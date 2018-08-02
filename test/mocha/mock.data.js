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
    '-----END RSA PRIVATE KEY-----\n',
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

// has permission to access its own resources
userName = 'secondUser';
keyId = 'd4617381-ca41-432a-afeb-a6fb463fd58e';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(
  userName, 'did:v1:6b5257c4-cafd-415a-8068-3600003a5ecc');
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
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAxaUDQ0PO7ufGQF/pR5Gq\n' +
    'sRA74OvVX6nHjBZ2A2KS6EnhrSj8KZKrybPYlPE6josd1AZbNqYLJZy+WK3Hv/JH\n' +
    '/fGs4wtfitP3AZF/PkIMqTBlo0W6RtXMT046343xG6rkq39xcSaHpubGfjHP2hmF\n' +
    'Xt9gb1QbznAENuXv/v8UGyCyX6f0dyxknZVVaIIZdA0w2SeRBdGOy46jte8dBS14\n' +
    'seZIPioN+l0rTvsv7WbVAtQ3TSGFAc51ShWDGaEY68MwZTJqUzVOla8jxgoNGI+n\n' +
    'O5gTc8+ihh2TaK/8vfUqL4l6ti+naT0UwCMQjfsjhoz5G0At7pNXttkFrZUfW5zo\n' +
    'cwIDAQAB\n' +
    '-----END PUBLIC KEY-----\n',
  privateKey: '-----BEGIN RSA PRIVATE KEY-----\n' +
    'MIIEowIBAAKCAQEAxaUDQ0PO7ufGQF/pR5GqsRA74OvVX6nHjBZ2A2KS6EnhrSj8\n' +
    'KZKrybPYlPE6josd1AZbNqYLJZy+WK3Hv/JH/fGs4wtfitP3AZF/PkIMqTBlo0W6\n' +
    'RtXMT046343xG6rkq39xcSaHpubGfjHP2hmFXt9gb1QbznAENuXv/v8UGyCyX6f0\n' +
    'dyxknZVVaIIZdA0w2SeRBdGOy46jte8dBS14seZIPioN+l0rTvsv7WbVAtQ3TSGF\n' +
    'Ac51ShWDGaEY68MwZTJqUzVOla8jxgoNGI+nO5gTc8+ihh2TaK/8vfUqL4l6ti+n\n' +
    'aT0UwCMQjfsjhoz5G0At7pNXttkFrZUfW5zocwIDAQABAoIBAAcLerJLGHUrjcV9\n' +
    'pbMHXi4xhfDedxyR0KsNoec8/D+LYp/pdhOFRtpJrs6gSpYKH2YPU/D+uib9D0vZ\n' +
    '5eTRnf9PPfpZzW4FYCiOJxrw/8KIFxdaxOkBdebdwvt088MotD3orQJ7fRpV331g\n' +
    'CSidAEQBck6FkPgqxfuu9n8AWJce4y+9fsWL/384xkvxRNbwWEUHElgEJVWw8rcN\n' +
    '2daNQ4IcQvaHPHAb8u5hngQeE54Uk1ayJtNun6ycgcNbAcSMsFkHn3Df1bm3FHBx\n' +
    'SvvyGCK4s3nrE/g7nM8exjEMOZq3OgaqImg85dwkMkOBFG4wS1IPQxM3GH++3WPa\n' +
    'yPPQVgECgYEA6vs2jcY4+k+v9+cfsA5TK8ogrWjGXnq13QNaElTMEyJ779Ivn89T\n' +
    'TmEbrI+1LL4oEJj3F3Cybb5TSczV/TKrxvIyA03YlbmojWs8oVB3iGAIaG612LmH\n' +
    'maVWgbYrpobEUhq2KYK/MX8+oDYRSnUzz3w1cgYo+I7lkr1+i7ko2YsCgYEA11LV\n' +
    'gmmiNHjTOeuDpB1EoIZU/ELoaRnNVZn446GTJMCJWd6WKPrG5lFR4WwmSgEk+2Lo\n' +
    'EcbeUbZCZudy4Ce58ZbzMz2NGEBSL9Tp+hyUKpqXwYcDOafPST6SwvC6Uc2AQWLo\n' +
    't4DeiNaVtaLxvti4jw/a1C8w+nYMT5JCwyFvebkCgYBgDg0A63TDLev65KnZaCGr\n' +
    'ltbAzEG6wWKyU/pv3+YENGaBZGQ/aZreQWf0pFIlVh4+mqj3FgR6RAD7/BXFiP8b\n' +
    'Nkone5z7p4c1OA7yylfykX8eYZNIYp8Bucqg/3zcd96syWqJkX7iludcyn1K+JoT\n' +
    'SOz4DXiWEqPZ1khyiWAffQKBgQCfm4weXjTZFlLkVRpAVV2ga9KlJudluLWG5Voj\n' +
    'SYprrLhjQGYoPDOhV9gM84CyTITgPqFtQ+9ZvHMeGiQB2hCv7seZTN/AgTUqtXU2\n' +
    'a2a86djhoDWY0DYLwfFBxPUnW9/dF/cOxtytq/pPKFhvse+kRAleTRjOHyDi/rS0\n' +
    'NZ2PKQKBgGXtGHmjQQh0+l6LKajGlzjLcJC86WXXJRw+DpeMtgQyn7ePvmp1lQIO\n' +
    'GB9lmoNH5iZMyJhtlg/yl80qOQ9XUQ172GEfQY6H1QEB5mC61FXVJ5oK0dEJPm//\n' +
    'EWpnCmxX8b3hWmm10fQSp274DnLQhhKRGJS6mxRcHltpKWpHgrYS\n' +
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

userName = 'thirdUser';
keyId = '5a4a6588-ba47-4034-9975-53d07a3381c4';
identities[userName] = {};
identities[userName].identity = helpers.createIdentity(
  userName, 'did:v1:a2379a25-2a69-450f-bd87-16c5f5dc8f83');
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
  publicKeyBase58:
    'Da6qDanxRR3RsdHqPidCLNix7coQTrks21pwcNRpBQZX',
  privateKeyBase58:
    '61myCPNzpR5h8vAN45ifrehXdpLMw8TbqkRYfPYbDVBD' +
    'L8TqhvqebLYe7nQEEKhuXYcvS7aMM5fPtcsadyVQjNQq'
/*
  // TODO extra keypair 1
  publicKeyBase58:
    'Ff9qm7JLKBs2Z6ht2fyVR3MmqrsDcnNBrVWTFS2yK85r',
  privateKeyBase58:
    '3rtQTfhBSJZhnExDge4aaFuTCocEDwzYCmN6hRRoXLMt' +
    '9iKySvXeM56fnMKsZajjUbeqTjc4kkHTbjdtfC5unNWx'

  // TODO extra keypair 2
  publicKeyBase58:
    'EAwJ7LsFnpYaQLg6TYVdxv83cDkoKAGJJBeYLc5Xxzi2',
  privateKeyBase58:
    '3uNrva7sqewp9mB354FaHyZAmqEyWcuAqggHRNtF8zjr' +
    'iWXMH4anSwTf2CD96KEJwZ8CuHNqze71YTHdJiTaNscz'
*/
});
mock.keys[keyId] = createPublicKeyDoc({
  keyId,
  publicKeyBase58: identities[userName].keys.publicKey.publicKeyBase58,
  userId: userName
});
mock.owners[userName] = createOwnerDoc({
  keyId,
  publicKeyBase58: identities[userName].keys.publicKey.publicKeyBase58,
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
