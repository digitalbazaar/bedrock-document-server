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

// endpoint configurations
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
config['document-server'].endpoints = [];
