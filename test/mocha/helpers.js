/*
 * Copyright (c) 2016-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
const config = bedrock.config;
const brIdentity = require('bedrock-identity');
const database = require('bedrock-mongodb');
const {promisify} = require('util');

const api = {};
module.exports = api;

api.createIdentity = function(userName, userId) {
  userId = userId || 'did:v1:' + uuid();
  const newIdentity = {
    id: userId,
    type: 'Identity',
    sysSlug: userName,
    label: userName,
    email: userName + '@bedrock.dev',
    sysPassword: 'password',
    sysPublic: ['label', 'url', 'description'],
    sysResourceRole: [],
    url: 'https://example.com',
    description: userName,
    sysStatus: 'active'
  };
  return newIdentity;
};

// collections may be a string or array
api.removeCollections = async (collectionNames = ['identity']) => {
  await promisify(database.openCollections)(collectionNames);
  for(const collectionName of collectionNames) {
    if(database.collections[collectionName]) {
      await database.collections[collectionName].remove({});
    }
  }
};

api.prepareDatabase = async mockData => {
  await api.removeCollections(['identity', 'documentServer']);
  // FIXME: drop all buckets based on config
  await insertTestData(mockData);
};

// Insert identities and public keys used for testing into database
async function insertTestData(mockData) {
  const records = Object.values(mockData.identities);
  for(const record of records) {
    try {
      await Promise.all([
        brIdentity.insert(
          {actor: null, identity: record.identity, meta: record.meta || {}})
      ]);
    } catch(e) {
      if(e.name === 'DuplicateError') {
        // duplicate error means test data is already loaded
        continue;
      }
      throw e;
    }
  }
}
