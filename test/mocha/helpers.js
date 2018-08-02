/*
 * Copyright (c) 2016-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const brIdentity = require('bedrock-identity');
const brKey = require('bedrock-key');
const {config} = require('bedrock');
const database = require('bedrock-mongodb');
const jsprim = require('jsprim');
const httpSignatureHeader = require('http-signature-header');
const {promisify} = require('util');
const signatureAlgorithms = require('signature-algorithms');

const api = {};
module.exports = api;

api.createIdentity = (userName, userId) => {
  userId = userId || 'did:v1:' + uuid();
  const newIdentity = {
    id: userId,
    label: userName,
    email: userName + '@bedrock.dev',
    url: 'https://example.com',
    description: userName
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
  await api.removeCollections(['identity', 'documentServer', 'publicKey']);
  // FIXME: drop all buckets based on config
  await insertTestData(mockData);
};

api.createHttpSignatureRequest = async (
  {algorithm, identity, requestOptions, additionalIncludeHeaders = []}) => {
  if(!requestOptions.headers.date) {
    requestOptions.headers.date = jsprim.rfc1123(new Date());
  }
  const includeHeaders = additionalIncludeHeaders.concat(
    ['date', 'host', '(request-target)']);
  const plaintext = httpSignatureHeader.createSignatureString(
    {includeHeaders, requestOptions});
  const keyId = identity.keys.publicKey.id;
  const authzHeaderOptions = {includeHeaders, keyId};
  const cryptoOptions = {plaintext};
  if(algorithm.startsWith('rsa')) {
    authzHeaderOptions.algorithm = algorithm;
    const alg = algorithm.split('-');
    const {privateKeyPem} = identity.keys.privateKey;
    cryptoOptions.algorithm = alg[0];
    cryptoOptions.privateKeyPem = privateKeyPem;
    cryptoOptions.hashType = alg[1];
  }
  if(algorithm === 'ed25519') {
    const {privateKeyBase58} = identity.keys.privateKey;
    cryptoOptions.algorithm = algorithm;
    cryptoOptions.privateKeyBase58 = privateKeyBase58;
  }
  authzHeaderOptions.signature = await signatureAlgorithms.sign(cryptoOptions);
  requestOptions.headers.Authorization = httpSignatureHeader.createAuthzHeader(
    authzHeaderOptions);
};

/* TODO
api.delegateOcap = async ({ocap, identity}) => {
  return jsigs.sign(ocap, {
    algorithm: 'Ed25519Signature2018',
    creator: identity.keys.publicKey.id,
    privateKeyBase58: identity.keys.privateKey.privateKeyBase58,
    proof: {
      '@context': 'https://w3id.org/security/v2',
      proofPurpose: 'capabilityDelegation'
    }
  });
};
*/

api.createKeyPair = options => {
  const {publicKey, privateKey, publicKeyBase58, privateKeyBase58, userName} =
    options;
  let ownerId = null;
  const keyId = options.keyId;
  if(userName === 'userUnknown') {
    ownerId = '';
  } else {
    ownerId = options.userId;
  }
  const newKeyPair = {
    publicKey: {
      '@context': 'https://w3id.org/identity/v1',
      id: 'https://' + config.server.host + '/keys/' + keyId,
      owner: ownerId,
      label: 'Signing Key 1',
    },
    privateKey: {
      owner: ownerId,
      label: 'Signing Key 1',
      publicKey: 'https://' + config.server.host + '/keys/' + keyId,
    }
  };
  if(publicKey && privateKey) {
    newKeyPair.publicKey.type = 'RsaVerificationKey2018';
    newKeyPair.publicKey.publicKeyPem = publicKey;
    newKeyPair.privateKey.privateKeyPem = privateKey;
  }
  if(publicKeyBase58 && privateKeyBase58) {
    newKeyPair.publicKey.type = 'Ed25519VerificationKey2018';
    newKeyPair.publicKey.publicKeyBase58 = publicKeyBase58;
    newKeyPair.privateKey.privateKeyBase58 = privateKeyBase58;
  }
  return newKeyPair;
};

// Insert identities and public keys used for testing into database
async function insertTestData(mockData) {
  const records = Object.values(mockData.identities);
  for(const record of records) {
    try {
      await Promise.all([
        brIdentity.insert(
          {actor: null, identity: record.identity, meta: record.meta || {}}),
        record.identity.keys ? brKey.addPublicKey(
          {actor: null, publicKey: record.identity.keys.publicKey}) : null
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
