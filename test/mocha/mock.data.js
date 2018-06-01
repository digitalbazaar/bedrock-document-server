/*
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const constants = require('bedrock').config.constants;
const helpers = require('./helpers');

const mock = {};
module.exports = mock;

const identities = mock.identities = {};
let userName;

// has permission to access its own resources
userName = 'regularUser';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(
  userName, 'did:v1:28b26664-8f0f-4727-b771-864e1a241f48');
identities[userName].identity.sysResourceRole.push({
  sysRole: 'bedrock-document-server.test',
  generateResource: 'id'
});

// has admin permissions
userName = 'adminUser';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(
  userName, 'did:v1:cbcee289-2484-48bd-a54e-55f50cfc9dfc');
identities[userName].identity.sysResourceRole.push({
  sysRole: 'bedrock-document-server.test'
});

// // identity with no permissions
// userName = 'noPermission';
// identities[userName] = {};
// identities[userName].identity = helpers.createIdentity(userName);

const docs = mock.docs = {};

docs.doc1 = 'TEST DOCUMENT';
