/*
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {config} = require('bedrock');
const {constants} = config;
const helpers = require('./helpers');
require('bedrock-server');

const mock = {};
module.exports = mock;

const identities = mock.identities = {};
const keys = mock.keys = {};
const owners = mock.owners = {};

let userName;
let keyId;

// has permission to access its own resources
userName = 'regularUser';
keyId = '31e76c9d-0cb9-4d0a-9154-584a58fc4bab';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(
  userName, 'did:v1:28b26664-8f0f-4727-b771-864e1a241f48');
identities[userName].meta = {
  sysResourceRole: [{
    sysRole: 'bedrock-document-server.test',
    generateResource: 'id'
  }]
};
identities[userName].keys = helpers.createKeyPair({
  userName: userName,
  userId: identities[userName].identity.id,
  keyId,
  publicKey: '-----BEGIN PUBLIC KEY-----\n' +
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwzPDp8kvJlGHbQGHQGcp\n' +
    'tO5iZG8iwED1QFNvJuKTZqYDoN44LUf95tYsjGqT38qj2/uo4zZRkfE3H1TEnsDo\n' +
    'KbbRn1mqV3098sU/G9Kk8fsXL9eJrQ77sLoDQmZf0/huIqHw6/jN7m5p3bq80A0m\n' +
    'gaJ56FuMq6IM4b9Sw40ajXTWQdiJqThN41eSHK01peT9jHMlnbQQwolqw0y9fkZ5\n' +
    'oEGHezQH6+CVRXB2u7WveMWvow3+ssGDwoK6/YeSWUXFv0VZoQwVO0VmaIFcM11f\n' +
    'G3KZD+iAayrF3xXz8ZPe0PY+6nZZi5/4HNy6B/30hAQn9X9I/0WMmmbQ5gCHJsu9\n' +
    'WwIDAQAB\n' +
    '-----END PUBLIC KEY-----\n',
  privateKey: '-----BEGIN RSA PRIVATE KEY-----\n' +
    'MIIEpAIBAAKCAQEAwzPDp8kvJlGHbQGHQGcptO5iZG8iwED1QFNvJuKTZqYDoN44\n' +
    'LUf95tYsjGqT38qj2/uo4zZRkfE3H1TEnsDoKbbRn1mqV3098sU/G9Kk8fsXL9eJ\n' +
    'rQ77sLoDQmZf0/huIqHw6/jN7m5p3bq80A0mgaJ56FuMq6IM4b9Sw40ajXTWQdiJ\n' +
    'qThN41eSHK01peT9jHMlnbQQwolqw0y9fkZ5oEGHezQH6+CVRXB2u7WveMWvow3+\n' +
    'ssGDwoK6/YeSWUXFv0VZoQwVO0VmaIFcM11fG3KZD+iAayrF3xXz8ZPe0PY+6nZZ\n' +
    'i5/4HNy6B/30hAQn9X9I/0WMmmbQ5gCHJsu9WwIDAQABAoIBAESCMWP8xvCC4q3O\n' +
    'QILI8ilPFPc8zgx9f9XAsp0KHkODdniKJVs3DhRrDJ2Hdjiv7Qxy6ZY85Sn8Z6U2\n' +
    'Yf95osGpKS7tEEy+ZvSCZ6DDMCLBRiUDV42GWa1vy18NgQprAXRkM6MN4nCRDdTF\n' +
    'CilWxDHxLSnwn5FJQY4lUM3TAwOr5fBvSxjZiwDimykyy90wSqQxl1HI/badNipJ\n' +
    'ZDCoVdIDFtYjjD03o7wsyOPFxD0sZnKnxSIS8kYeHMxK5Js20eLdHRocZdSebxbu\n' +
    'bESUWaLg0sFn1tBg4y19hflAqzJGpta2wUombipkLm3DLJWQVMeq/52WJf7oqhr9\n' +
    'Fg1BxkECgYEA4JQ6i+XSxMkZnsk0vCjEEQH+lfixV9+dQ9tBmn+FqNKTV40gix8+\n' +
    'CMnB/ZKT6CknByQ1EojX7ZDj/c1qgoVYyRkcYcoQGzDwxZLydQpCncPT5/UYic0H\n' +
    '8eKUCQLzwOnZo55mBmehxTqTwmtYjoSCWsGWoGO7ssEGSa+rIYd4SqECgYEA3oNX\n' +
    'z53tE+Y8b7G95DEZIom32NpreMVq9T0xS8ZUYeDkR80a3Mli6IHz+qbFSd2ylcNf\n' +
    'PbnJ1xeEGyGgMi9PG4E7GWTitl68uAOKnZ/83nHNtXQ5SJwRtxPiOyuh+HN8AAqX\n' +
    'PfNCDffF6gAm+wfxyY1aAL04aBmzaaqEWpEGonsCgYEAxUqzHE+sl+ArN8l/IIWX\n' +
    'qXFdHJc8BPyXhhNKUNYSr7s+Yb3DhzTNJJ9KYt+wPFZayPVQApZhS3zsLf2VwlAv\n' +
    'LYt32ZjQCXM3MfrkMVnwJ/TvZml1Qynx/teUQU5soV9PKWRwMNQ906ygPj5br+hN\n' +
    'NDm5f/Hd5S2ZvoYrCuueC8ECgYEArKTZ3/PXu6Xa5IrTHBdgOiUCqVWnJ1h9iXQG\n' +
    'KJXkaOEWHgOswPvcKyyRQbxdvNcvtfWVkw3w5luPm4F2ixmb1mppkWVuZjORV3Ef\n' +
    '/vbgOzOveQeJXqYBNLxPvrs2+8+WuW1+NYnliXLic5HUrNdYKZrr50DpYBP42ZZ9\n' +
    'BMwbirsCgYA01XR+CS661Vy8bh6dEHa1IDoWBk3gqk9REUFnhdYLLEXy3zi1SnfI\n' +
    'mXm+fICVKinK5jKA/iu0M1zLUY/rWjpIWQTMpk9AcLhWYwURPCkLw/E//T5iaw37\n' +
    'cuRO/K57URWU78bQYpTMSCs0JhXnvHN1iCM5xyZ6rtz0jwZheWe+sA==\n' +
    '-----END RSA PRIVATE KEY-----\n'
});
mock.keys[keyId] = createPublicKeyDoc({
  keyId,
  publicKeyPem: identities[userName].keys.publicKey.publicKeyPem,
  userId: userName
});
mock.owners[userName] = createOwnerDoc({
  keyId,
  publicKeyPem: identities[userName].keys.publicKey.publicKeyPem,
  userId: userName
});

// has admin permissions
userName = 'adminUser';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(
  userName, 'did:v1:cbcee289-2484-48bd-a54e-55f50cfc9dfc');
identities[userName].meta = {
  sysResourceRole: [{
    sysRole: 'bedrock-document-server.test'
  }]
};

// // identity with no permissions
// userName = 'noPermission';
// identities[userName] = {};
// identities[userName].identity = helpers.createIdentity(userName);

const docs = mock.docs = {};

docs.doc1 = 'TEST DOCUMENT';

function createOwnerDoc(options) {
  let type;
  if(options.publicKeyPem) {
    type = 'RsaVerificationKey2018';
  } else if(options.publicKeyBase58) {
    type = 'Ed25519VerificationKey2018';
  }

  return {
    '@context': constants.SECURITY_CONTEXT_V2_URL,
    'id': 'https://' + config.server.host + '/tests/i/' + options.userId,
    'publicKey': {
      'type': type,
      'owner': 'https://' + config.server.host + '/tests/i/' + options.userId,
      'id': 'https://' + config.server.host + '/keys/' + options.keyId
    }
  };
}

function createPublicKeyDoc({keyId, publicKeyPem, publicKeyBase58, userId}) {
  const doc = {
    '@context': constants.SECURITY_CONTEXT_V2_URL,
    owner: `https://${config.server.host}/tests/i/${userId}`,
    label: 'Access Key 1',
    id: `https://${config.server.host}/keys/${keyId}`,
    sysStatus: 'active'
  };
  if(publicKeyPem) {
    doc.type = ['RsaVerificationKey2018'];
    doc.publicKeyPem = publicKeyPem;
  }
  if(publicKeyBase58) {
    doc.type = ['Ed25519VerificationKey2018'];
    doc.publicKeyBase58 = publicKeyBase58;
  }
  return doc;
}
