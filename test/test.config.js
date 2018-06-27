/*
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

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
    permissions.DOCUMENT_ACCESS.id,
    permissions.DOCUMENT_CREATE.id,
    permissions.DOCUMENT_REMOVE.id
  ]
};

config['document-server'].endpoints.push({
  route: '/test-default',
});
config['document-server'].endpoints.push({
  route: '/test-types-and-limits',
  mimeTypes: [
    'text/plain'
  ],
  limits: {
    files: 1,
    fileSize: 2
  }
});
config['document-server'].endpoints.push({
  route: '/test-dups',
  duplicatePolicy: 'share'
});
