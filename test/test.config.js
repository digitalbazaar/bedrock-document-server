/*
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */

const config = require('bedrock').config;
const path = require('path');
require('bedrock-permission');

const permissions = config.permission.permissions;
const roles = config.permission.roles;

config.mocha.tests.push(path.join(__dirname, 'mocha'));

// MongoDB
config.mongodb.name = 'bedrock_document_server_test';
config.mongodb.dropCollections.onInit = true;
config.mongodb.dropCollections.collections = [];

roles['bedrock-document-server.test'] = {
  id: 'bedrock-document-server.test',
  label: 'Test Role',
  comment: 'Role for Test User',
  sysPermission: [
    permissions.DOCUMENT_SERVER_ACCESS.id,
    permissions.DOCUMENT_SERVER_CREATE.id,
    permissions.DOCUMENT_SERVER_REMOVE.id
  ]
};

config['document-server'].endpoints.push({
  route: '/test1'
});
config['document-server'].endpoints.push({
  route: '/test2'
});
