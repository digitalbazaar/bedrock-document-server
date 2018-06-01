/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
const async = require('async');
const asyncHandler = require('express-async-handler');
const base64url = require('base64url');
const bedrock = require('bedrock');
const brPermission = require('bedrock-permission');
const config = require('bedrock').config;
const cors = require('cors');
const crypto = require('crypto');
const database = require('bedrock-mongodb');
const jsonld = bedrock.jsonld;
const logger = require('./logger');
const multer = require('multer');
const scheduler = require('bedrock-jobs');
const BedrockError = bedrock.util.BedrockError;
const GridFsStorage = require('multer-gridfs-storage');
require('bedrock-express');
require('bedrock-permission');

require('./config');

// module permissions
const PERMISSIONS = config.permission.permissions;

// jobs
const namespace = 'document-server';
const JOB_SCHEDULE_GC = `${namespace}.jobs.scheduleGC`;

// module API
const api = {};
module.exports = api;

const defaultBucketName = 'documentServer';

bedrock.events.on('bedrock.init', () => {
  if(config['document-server'].jobs.scheduleGC.enabled) {
    scheduler.define(JOB_SCHEDULE_GC, _scheduleGC);
  }
});

bedrock.events.on('bedrock-mongodb.ready', callback => async.auto({
  openCollections: callback => database.openCollections(
    ['documentServer'], callback),
  createIndexes: ['openCollections', (results, callback) =>
    /*
    database.createIndexes([{
      collection: 'documentServer',
      fields: {id: 1},
      options: {unique: true, background: false}
    }, {
      collection: 'documentServer',
      fields: {'meta.deleted': 1},
      options: {unique: false, background: false}
    }], callback)
    */
    callback()
  ],
  emitReadyEvent: ['createIndexes', (results, callback) =>
    bedrock.events.emit('bedrock-document-server.ready', callback)
  ]
}, err => callback(err)));

/**
 * Registers or retrieves a document server plugin.
 *
 * A plugin can be registered to extend the capabilities of the document server
 * subsystem by adding new storage and authorization mechanisms.
 *
 * @param capabilityName (required) the name of the capability.
 * @param [capabilityValue | callback] either the value of the capability:
 *          type type type of plugin (e.g. 'storage', 'authorization').
 *          api the javascript API for the plugin.
 *        or a callback to use this function as an asynchronous getter.
 */
// TODO
//api.use = (capabilityName, capabilityValue) =>
//  injector.use(capabilityName, capabilityValue);

/**
 * Adds a new document.
 *
 * actor - the actor performing the action.
 * options - a set of options used when adding the document.
 *   ... - ...
 *   owner - the owner of the document
 *     (default: `undefined`, anyone can access the document).
 *   storage - the storage subsystem for the doc server (default: 'gridfs').
 * callback(err, docInfo) - the callback to call when finished.
 *   err - An Error if an error occurred, null otherwise.
 *   docInfo - information about the added document.
 */
api.add = (actor, docInfo, options, callback) => {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options.owner = options.owner || null;
  // ...
  callback(new Error('Unimplemented'));
};

/**
 * Gets a document given an id and a set of options.
 *
 * actor - the actor performing the action.
 * docId - the URI of the document.
 * options - a set of options used.
 * callback(err, result) - the callback to call when finished.
 *   err - An Error if an error occurred, null otherwise
 *   result - The document.
 */
api.get = (actor, docId, options, callback) => {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options.owner = options.owner || null;
  // ...
  callback(new Error('Unimplemented'));
};

/**
 * Delete an existing document an id and a set of options.
 *
 * actor - the actor performing the action.
 * docId - the URI of the doc.
 * options - a set of options used 
 * callback(err) - the callback to call when finished.
 *   err - An Error if an error occurred, null otherwise.
 */
api.remove = (actor, docId, options, callback) => {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options.owner = options.owner || null;
  // ...
  callback(new Error('Unimplemented'));
};

/**
 * Scans for old deleted or invalid documents to be garbage collected.
 *
 * @param job the current job.
 * @param callback() called once the operation completes.
 */
const _scheduleGC = (job, callback) => {
  // FIXME: implement
  //logger.verbose(
  //  `Running worker (${job.worker.id}) to schedule GC...`);
  callback();
};

// FIXME: move to bedrock-document-server-http?

async function _setupEndpoint({app, endpoint, bucketName = defaultBucketName}) {
  const cfg = config['document-server'];
  const basePath = endpoint.route;
  const docPath = endpoint.route + '/:docId';
  const {baseUri} = bedrock.config.server;

  bucketName = 'fs_' + bucketName;
  const bucket = new database.mongo.GridFSBucket(database.client, {bucketName});

  const collection = database.client.collection(bucketName + '.files');

  // create custom indexes
  await Promise.all([
    // public id lookup
    collection.ensureIndex('metadata.id', {
      unique: true
    }),
    // use to GC of invalid files
    collection.ensureIndex('metadata.valid', {
      sparse: true
    }),
    // use for GC of deleted files
    collection.ensureIndex('metadata.deleted', {
      sparse: true
    })
  ]);

  const storage = GridFsStorage({
    db: database.client,
    file: (req, file) => {
      return {
        bucketName,
        metadata: {
          // NOTE: add 'id' of hash later, as file data is not yet available
          created: new Date()
        }
      };
    }
  });
  const upload = multer({storage});
  const attachmentUpload = upload.single('attachment');
  // TODO: handle single or multiple files
  //const attachmentUpload = upload.array('attachments', 10);

  const digestAlgorithm = 'sha256';

  function checksumFile(algorithm, filename) {
    return new Promise((resolve, reject) =>
      bucket.openDownloadStreamByName(filename)
        .on('error', reject)
        .pipe(crypto.createHash(algorithm))
          //.setEncoding('base64'))
        .once('finish', function () {
          resolve(base64url(this.read()));
        })
    )
  }

  app.post(
    basePath,
    attachmentUpload,
    // FIXME: optionallyAuthenticated,
    // TODO: validate('services.document-server.postDocuments'),
    asyncHandler(async (req, res) => {
      const hash = await checksumFile(digestAlgorithm, req.file.filename);
      await collection.updateOne({_id: req.file.id}, {
        '$set': {
          'metadata.id': hash,
          'metadata.digestAlgorithm': digestAlgorithm,
          'metadata.digestValue': hash,
          // used to allow GC of files w/o this set
          'metadata.valid': true,
          // TODO: add ownership, etc
        }
      });

      res.status(200).json({
        id: baseUri + basePath + '/' + hash,
        proof: {
          type: 'MessageDigest',
          mimeType: req.file.contentType,
          digestAlgorithm,
          digestValue: hash,
          created: req.file.metadata.created
        }
      });
    }));

  /*
  app.get(
    basePath,
    // FIXME: optionallyAuthenticated,
    // TODO: validate({query: 'services.document-server.getDocumentsQuery'}),
    asyncHandler(async (req, res, next) => {
      // TODO: add query support
      next();
    }));
  */

  /*
  app.patch(
    accountPath,
    // FIXME: ensureAuthenticated,
    // TODO: validate({query: 'services.document-server.patchDocuments'}),
    asyncHandler(async (req, res, next) => {
      // TODO: patch allowed metadata?
      next();
    }));
  */

  app.options(docPath, cors());
  app.get(
    docPath,
    // FIXME:optionallyAuthenticated,
    // TODO: validate({query: 'services.document-server.getDocument'}),
    cors(),
    asyncHandler(async (req, res) => {
      const docId = req.params.docId;
      // get file with metadata
      const docFiles = await bucket.find({
        'metadata.id': docId,
        'metadata.valid': true,
        'metadata.deleted': {'$exists': false}
      }).limit(1).toArray();
      if(docFiles.length === 0) {
        // not found
        return res.status(404).end();
      }
      const docFile = docFiles[0];
      // set headers
      res.set('content-type', docFile.contentType);
      // TODO
      //res.set('content-disposition', 'attachment; filename="...");

      await bucket.openDownloadStream(docFile._id).pipe(res);
    }));

  /*
  app.delete(
    docPath,
    // FIXME:ensureAuthenticated,
    // TODO: validate({query: 'services.document-server.deleteDocument'}),
    asyncHandler(async (req, res, next) => {
      const docId = req.params.docId;
      // get file with metadata
      const docFiles = await bucket.find({
        'metadata.id': docId
      }).limit(1).toArray();
      // not found
      if(docFiles.length === 0) {
        return res.status(404).end();
      }
      const docFile = docFiles[0];
      // set headers
      await bucket.delete(docFile._id);
      res.status(200).end();
    }));
  */
}

bedrock.events.on('bedrock-express.configure.routes', async app => {
  const eps = config['document-server'].endpoints.map(
    endpoint => _setupEndpoint({app, endpoint}));
  return Promise.all(eps);
});

