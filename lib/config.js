/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
const config = bedrock.config;

// permissions
const permissions = config.permission.permissions;
permissions.DOCUMENT_ACCESS = {
  id: 'DOCUMENT_ACCESS',
  label: 'Access Documents',
  comment: 'Required to access documents.'
};
permissions.DOCUMENT_CREATE = {
  id: 'DOCUMENT_CREATE',
  label: 'Create Documents',
  comment: 'Required to create documents.'
};
permissions.DOCUMENT_REMOVE = {
  id: 'DOCUMENT_REMOVE',
  label: 'Remove Documents',
  comment: 'Required to remove documents.'
};

config['document-server'] = {};

// routes
config['document-server'].routes = {};
config['document-server'].routes.proxy = '/document-storage/proxy';

// jobs
config['document-server'].jobs = {};
config['document-server'].jobs.scheduleGC = {
  enabled: false
  // TODO
};
// TODO
/*
bedrock.util.config.main.pushComputed('scheduler.jobs', () => ({
  id: 'document-server.jobs.scheduleGC',
  type: 'document-server.jobs.scheduleGC',
  // repeat forever, run every day
  schedule: 'R/PT1D',
  // no special priority
  priority: 0,
  concurrency: 1,
  // use a 10000ms grace period between TTL for workers to finish up
  // before forcibly running another worker
  lockDuration: config['document-server'].jobs.scheduleGC.ttl + 10000
}));
*/

// storage endpoint configurations; this module enables creating multiple
// storage containers where each of these endpoints is an interface to
// a different storage container
// {
//   // route for this endpoint
//   route: '/...'
//   // acceptable MIME types for this endpoint (optional, default: any)
//   mimeTypes: [...]
//   // input limits (see busboy docs)
//   limits: { ... }
//   // digest algorithm for (optional, default: sha256)
//   digestAlgorithm: 'sha256'
//   // name of gridfs bucket ("fs_" prefix is added)
//   bucketName: 'documentServer'
// }
// TODO: mount any `.route` off of '/document-storage/stores/XXX' for
// optimization purposes
// TODO: deprecate `endpoints` because it is confusing, these are configs
// for individual storage ... where each one of *those* has a `route` (endpoint)
config['document-server'].stores = config['document-server'].endpoints = [];
