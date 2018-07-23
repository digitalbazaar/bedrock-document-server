/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const asyncHandler = require('express-async-handler');
const base64url = require('base64url');
const bedrock = require('bedrock');
const brCallbackify = bedrock.util.callbackify;
const brPermission = require('bedrock-permission');
const config = require('bedrock').config;
const contentType = require('content-type');
const cors = require('cors');
const crypto = require('crypto');
const database = require('bedrock-mongodb');
const jsonld = bedrock.jsonld;
const logger = require('./logger');
const {promisify} = require('util');
const scheduler = require('bedrock-jobs');
const uuid = require('uuid/v4');
const BedrockError = bedrock.util.BedrockError;
const Busboy = require('busboy');
const Readable = require('stream').Readable
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

bedrock.events.on('bedrock-mongodb.ready', async () => {
  await promisify(database.openCollections)(['documentServer']);

  /*
  await promisify(database.createIndexes)([{
    collection: 'documentServer',
    fields: {id: 1},
    options: {unique: true, background: false}
  }, {
    collection: 'documentServer',
    fields: {'meta.deleted': 1},
    options: {unique: false, background: false}
  }]);
  */

  await bedrock.events.emit('bedrock-document-server.ready');
});

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
 * @param actor - the actor performing the action.
 * @param options - a set of options used when adding the document.
 *   ... - ...
 *   owner - the owner of the document
 *     (default: `undefined`, anyone can access the document).
 *   storage - the storage subsystem for the doc server (default: 'gridfs').
 *
 * @return a Promise that resolves to document info about the added doc
 */
api.add = brCallbackify(async (actor, docInfo, options = {}) => {
  throw new Error('Unimplemented');
});

/**
 * Gets a document given an id and a set of options.
 *
 * @param actor - the actor performing the action.
 * @param docId - the URI of the document.
 * @param [options] - a set of options used.
 *   data - true to return data (optional, default: true)
 *   meta - true to return metadata (optional, default: true)
 *
 * @return a Promise that resolves to a document record
 *   [data] the document data
 *   [meta] the document metadata
 */
api.get = brCallbackify(async (actor, docId, options = {}) => {
  throw new Error('Unimplemented');
});

/**
 * Gets a document stream given an id and a set of options.
 *
 * @param actor - the actor performing the action.
 * @param docId - the URI of the document.
 *
 * @return a Promise that resolves to a document readable stream
 */
api.getStream = brCallbackify(async (actor, docId, options = {}) => {
  throw new Error('Unimplemented');
});

/**
 * Delete an existing document an id and a set of options.
 *
 * @param actor - the actor performing the action.
 * @param docId - the URI of the doc.
 * @param options - a set of options used
 *
 * @return a Promise that resolves.
 */
api.remove = brCallbackify(async (actor, docId, options = {}) => {
  throw new Error('Unimplemented');
});

/**
 * Scans for old deleted or invalid documents to be garbage collected.
 *
 * @param job the current job.
 * @param callback() called once the operation completes.
 */
const _scheduleGC = async job => {
  // FIXME: implement
  //logger.verbose(
  //  `Running worker (${job.worker.id}) to schedule GC...`);
};

// FIXME: move to bedrock-document-server-http?

async function _setupEndpoint({app, endpoint}) {
  const cfg = config['document-server'];
  const basePath = endpoint.route;
  const docPath = endpoint.route + '/:docId';
  const {baseUri} = bedrock.config.server;

  // TODO: not yet supported
  if(endpoint.duplicatePolicy === 'allow') {
    throw new RangeError('duplicate policy of "allow" not supported');
  }

  const bucketName = 'fs_' + (endpoint.bucketName || defaultBucketName);
  const collectionName = bucketName + '.files';

  logger.info('setup endpoint', {route: endpoint.route, bucketName});

  const bucket = database.createGridFSBucket({
    bucketName
    // TODO: add readPreference?
  });

  // create endpoint collection
  await promisify(database.openCollections)([collectionName]);
  const collection = database.collections[collectionName];

  // create custom indexes
  await promisify(database.createIndexes)([{
    // public id lookup
    collection: collectionName,
    fields: {'metadata.digestValue': 1},
    options: {
      sparse: true,
      unique: true
    }
  }, {
    // use to GC of invalid files
    collection: collectionName,
    fields: {'metadata.valid': 1, 'metadata.created': 1},
    options: {
      sparse: true
    }
  }, {
    // use for GC of deleted files
    collection: collectionName,
    fields: {'metadata.deleted': 1},
    options: {
      sparse: true
    }
  }]);

  const digestAlgorithm = endpoint.digestAlgorithm || 'sha256';

  function uploadStreamToGridFs(
    {stream, filename = '', metadata = {}, contentType}) {
    // use generic id as internal gridfs "filename" to avoid conflicts
    // storing given filename in the metadata
    const id = uuid();
    const md = Object.assign({
      filename,
      created: new Date()
    }, metadata);
    logger.info('gridfs upload', {id, metadata, contentType});
    return new Promise((resolve, reject) => {
      // using id as "filename"
      const gfsStream = bucket.openUploadStream(id, {
        contentType,
        metadata: md
      });
      gfsStream
        .on('error', (err) => {
          logger.error('gridfs upload error', {id, error: err});
          reject(err);
        })
        .once('finish', () => {
          logger.info('gridfs upload done', {id});
          resolve({
            _id: gfsStream.id,
            id,
            metadata: md
          });
        });
      stream.pipe(gfsStream);
    });
  }

  function checksumStream({stream, algorithm}) {
    return new Promise((resolve, reject) =>
      stream
        .pipe(crypto.createHash(algorithm))
        .on('error', reject)
        .once('finish', function () {
          resolve(base64url(this.read()));
        })
    );
  }

  function setGridFsMetadata(id, metadata) {
    const update = {};
    Object.keys(metadata).forEach(key => {
      // FIXME: db encode?
      update['metadata.' + key] = metadata[key];
    });
    return collection.updateOne({_id: id}, {'$set': update});
  }

  function storeRawContent(req, res, next) {
    const mimeType = contentType.parse(req).type;

    // FIXME: store actual raw stream data!
    // When the content type is JSON-like, the body-parser is consuming the
    // data before this code has access to it.  Current workaroud is to take
    // the parsed JSON and turn it back into a stream.  This is inefficient and
    // could cause round-trip hashing errors!
    let stream;
    if(mimeType === 'application/json' ||
      mimeType === 'application/ld+json') {
      stream = new Readable();
      stream.push(JSON.stringify(req.body));
      stream.push(null)
    } else {
      stream = req;
    }

    // check type
    if(endpoint.mimeTypes && endpoint.mimeTypes.length > 0 &&
      !endpoint.mimeTypes.includes(mimeType)) {
      res.status(406).end();
      return;
    }

    // check content length limit
    // FIXME: handle limits for chunked data
    if(endpoint.limits &&
      'fileSize' in endpoint.limits &&
      'content-length' in req.headers &&
      parseInt(req.headers['content-length']) > endpoint.limits.fileSize) {
      // TODO: log
      res.status(413).end();
      return;
    }

    // save and checksum in parallel
    const gfsUpload = uploadStreamToGridFs({
      contentType: mimeType,
      stream
    });
    const checksum = checksumStream(
      {stream, algorithm: digestAlgorithm});
    let md = {
      id: null, // add later
      proof: {
        type: 'MessageDigest2018',
        mimeType: mimeType,
        digestAlgorithm,
        digestValue: null, // add later
        created: null // add later
      }
    };

    Promise.all([gfsUpload, checksum])
      .then(results => {
        // store result data
        md.id = baseUri + basePath + '/' + results[1];
        md.proof.digestValue = results[1];
        md.proof.created = results[0].metadata.created;

        // update meta
        return setGridFsMetadata(results[0]._id, {
          // digest info
          digestAlgorithm,
          digestValue: results[1],
          valid: true
          // TODO: add ownership, etc
        });
      }).then(() => {
        // FIXME: 201 + Location?
        res.status(200).json(md);
      }).catch(err => {
        if(database.isDuplicateError(err)) {
          if(endpoint.duplicatePolicy === 'share') {
            // FIXME: use 'get' API to get common MessageDigest2018
            // for now this just returns a similar one with incorrect date
            res.status(200).json(md);
          } else {
            // FIXME: refactor to use normal BedrockError flow
            res.status(409).json({
              type: 'DuplicateError',
              digestAlgorithm: md.digestAlgorithm,
              digestValue: md.digestValue
            });
          }
        } else {
          // FIXME: add error details
          logger.error('store raw content', {error: err});
          next(err);
        }
      });
  }

  function storeMultipartContent(req, res, next) {
    const busboy = new Busboy({
      headers: req.headers,
      limits: endpoint.limits
    });
    // array of promises for each file, resolve to file info
    const filePromises = [];
    // array of all ids
    const fileInfo = [];
    // error flags
    let validTypes = true;
    let partsLimit = false;
    let filesLimit = false;
    let fieldsLimit = false;

    busboy.on('file', (fieldname, file, filename, encoding, mimeType) => {
      // check type
      if(endpoint.mimeTypes && endpoint.mimeTypes.length > 0) {
        validTypes = validTypes && endpoint.mimeTypes.includes(mimeType);
      }
      if(!validTypes) {
        file.resume();
        return;
      }
      // save and checksum in parallel
      const gfsUpload = uploadStreamToGridFs({
        stream: file, filename, contentType: mimeType
      });
      const checksum = checksumStream(
        {stream: file, algorithm: digestAlgorithm});
      const info = {
        id: null,
        contentType: mimeType,
        digestAlgorithm,
        valid: true
      };
      // FIXME: use these or just file.truncted?
      file.on('limit', () => {
        // TODO: add reason
        info.valid = false;
      });
      file.on('end', () => {
        // TODO: add reason
        if(file.truncated) {
          info.valid = false;
        }
      });

      const filePromise = Promise.all([gfsUpload, checksum])
        .then(results => {
          if(file.truncated) {
            throw new BedrockError('File size too large.', 'RangeError', {
              public: true,
              httpStatusCode: 400
            });
          }
          // add computed fields to info
          info._id = results[0]._id;
          info.id = results[0].id;
          info.created = results[0].metadata.created;
          info.digestValue = results[1];

          // update meta
          return setGridFsMetadata(results[0]._id, {
            // digest info
            digestAlgorithm,
            digestValue: results[1]
            // TODO: add ownership, etc
          });
        }).then(() => {
          fileInfo.push(info);
        }).catch(err => {
          if(database.isDuplicateError(err)) {
            if(endpoint.duplicatePolicy === 'share') {
              // FIXME: use 'get' API to get common MessageDigest2018 info
              // for now this will just return a similar one with incorrect date
              fileInfo.push(info);
            } else {
              // FIXME: refactor to use normal BedrockError flow
              throw new BedrockError('Duplicate document.', 'DuplicateError', {
                public: true,
                httpStatusCode: 409
              });
            }
          } else {
            throw err;
          }
        });
      filePromises.push(filePromise);
    });
    busboy.on('field',
      (fieldname, val, fieldnameTruncated, valTruncated, encoding,
        contentType) => {
          // TODO: handle fields
        });
    busboy.on('partsLimit', () => {
      partsLimit = true;
    });
    busboy.on('filesLimit', () => {
      filesLimit = true;
    });
    busboy.on('fieldsLimit', () => {
      fieldsLimit = true;
    });
    busboy.on('finish', () => {
      Promise.all(filePromises)
        .then(results => {
          if(!validTypes) {
            throw new BedrockError('Unsupported content type.', 'ContentError', {
              public: true,
              httpStatusCode: 415
            });
          }
          if(partsLimit) {
            throw new BedrockError('Too many parts.', 'RangeError', {
              public: true,
              httpStatusCode: 400
            });
          }
          if(filesLimit) {
            throw new BedrockError('Too many files.', 'RangeError', {
              public: true,
              httpStatusCode: 400
            });
          }
          if(fieldsLimit) {
            throw new BedrockError('Too many fields.', 'RangeError', {
              public: true,
              httpStatusCode: 400
            });
          }
        })
        .then(results => {
          // TODO: support multiple files and results
          if(fileInfo.length === 0) {
            throw new BedrockError('No files present.',
              'RangeError', {
                public: true,
                httpStatusCode: 400
              });
          }
          if(fileInfo.length > 1) {
            throw new BedrockError('Multiple files not supported.',
              'RangeError', {
                public: true,
                httpStatusCode: 400
              });
          }
        })
        .then(results => {
          // passed limits, saved, and processed: mark all as valid
          return Promise.all(fileInfo.map(info => setGridFsMetadata(info._id, {
            valid: true
          })));
        })
        .then(results => {
          // TODO: support multiple results
          // FIXME: 201 + Location?
          res.status(200).json({
            id: baseUri + basePath + '/' + fileInfo[0].digestValue,
            proof: {
              type: 'MessageDigest2018',
              mimeType: fileInfo[0].contentType,
              digestAlgorithm,
              digestValue: fileInfo[0].digestValue,
              created: fileInfo[0].created
            }
          });
        })
        .catch(err => {
          logger.error('store multipart content', {error: err});
          next(err);
        });
    });
    req.pipe(busboy);
  }

  app.post(
    basePath,
    // FIXME: optionallyAuthenticated,
    // TODO: validate('services.document-server.postDocuments'),
    asyncHandler(async (req, res, next) => {
      const contentType = req.headers['content-type'];
      if(/^multipart\/form-data/.test(contentType)) {
        return storeMultipartContent(req, res, next);
      } else {
        return storeRawContent(req, res, next);
      }
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
        'metadata.digestValue': docId,
        'metadata.valid': true,
        'metadata.deleted': {'$exists': false}
      }).limit(1).toArray();
      if(docFiles.length === 0) {
        // not found
        return res.status(404).end();
      }
      const docFile = docFiles[0];

      // handle meta query param
      if(req.query.meta === 'MessageDigest2018') {
        res.status(200).json({
          id: baseUri + basePath + '/' + docFile.metadata.digestValue,
          proof: {
            type: 'MessageDigest2018',
            created: docFile.metadata.created,
            digestAlgorithm: docFile.metadata.digestAlgorithm,
            digestValue: docFile.metadata.digestValue,
            mimeType: docFile.contentType
          }
        });
        return;
      }

      // set headers
      res.set('content-type', docFile.contentType);
      // TODO
      //res.set('content-disposition', 'attachment; filename="...");

      bucket.openDownloadStream(docFile._id).pipe(res);
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
        'metadata.digestValue': docId
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

