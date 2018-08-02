/*!
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const asyncHandler = require('express-async-handler');
const base64url = require('base64url');
const bedrock = require('bedrock');
const brCallbackify = bedrock.util.callbackify;
const brPermission = require('bedrock-permission');
const {config} = require('bedrock');
const contentType = require('content-type');
const cors = require('cors');
const crypto = require('crypto');
const database = require('bedrock-mongodb');
const expressHttpProxy = require('express-http-proxy');
const injector = new (require('bedrock-injector')).Injector();
const jsonld = bedrock.jsonld;
const logger = require('./logger');
const nanoidGenerate = require('nanoid/generate');
const {promisify} = require('util');
const scheduler = require('bedrock-jobs');
const uuid = require('uuid/v4');
const BedrockError = bedrock.util.BedrockError;
const Busboy = require('busboy');
const Readable = require('stream').Readable;
const URL = require('url');
require('bedrock-express');
const {
  ensureAuthenticated,
  optionallyAuthenticated
} = require('bedrock-passport');
const brPermissionCheck = promisify(brPermission.checkPermission);

require('./config');

// short document id using 22 base58 alphabet characters
const _docIdAlphabet =
  '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
function createDocId() {
  return nanoidGenerate(_docIdAlphabet, 22);
}

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
  /*
  await promisify(database.openCollections)(['documentServer']);
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
 * subsystem by adding features such as proxy hooks.
 *
 * @param capabilityName (required) the name of the capability.
 * @param [capabilityValue | undefined] either the value of the capability:
 *          type type type of plugin (e.g. 'proxyPlugin').
 *          api the javascript API for the plugin.
 *        or `undefined` to use this function as a synchronous getter.
 */
api.use = (capabilityName, capabilityValue) => {
  if(capabilityValue) {
    if(!(typeof capabilityValue === 'object' &&
      capabilityValue.type === 'proxyPlugin' &&
      typeof capabilityValue.api === 'object' &&
      typeof capabilityValue.api.decorateRequest === 'function')) {
      throw new TypeError('Plugin type must be a valid "proxyPlugin".');
    }
  }
  return injector.use(capabilityName, capabilityValue);
};

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
 *   bucket - mongo GridFS bucket (required)
 *   data - true or 'json' to return data, 'stream' to return a stream
 *     (optional, default: 'json')
 *   meta - true to 'json' to return metadata (optional, default: 'json')
 *
 * @return a Promise that resolves to a document record if found
 *   [data] the document data or stream
 *   [meta] the document metadata
 */
api.get = brCallbackify(async (actor, docId, options = {}) => {
  // FIXME: check permissions
  /*
  await brPermissionCheck(actor, PERMISSIONS.DOCUMENT_ACCESS, {
    resource: docId,
    translate: 'owner'
  });
  */

  const result = {};

  // get file with metadata
  const docFiles = await options.bucket.find({
    'metadata.docId': docId,
    'metadata.valid': true,
    'metadata.deleted': {'$exists': false}
  }).limit(1).toArray();
  if(docFiles.length === 0) {
    // not found
    throw new BedrockError('Document not found.', 'NotFoundError', {
      public: true,
      httpStatusCode: 404
    });
  }
  const docFile = docFiles[0];

  // handle meta query param
  if(options.meta) {
    if(options.meta === true || options.meta === 'json') {
      result.meta = {
        ...docFile.metadata,
        contentType: docFile.contentType
      };
    }
  }

  if(options.data) {
    if(options.data === 'stream') {
      result.data = options.bucket.openDownloadStream(docFile._id);
    } else {
      throw new Error('JSON data unimplemented');
    }
  }

  return result;
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
  // FIXME: check permissions
  //
  throw new Error('Unimplemented');

  // get file with metadata
  const docFile = await bucket.findOne({
    'metadata.docId': docId
  }).toArray();
  // not found
  if(docFiles.length === 0) {
    throw new BedrockError('Document not found.', 'NotFoundError', {
      public: true,
      httpStatusCode: 404
    });
  }
  // set headers
  await bucket.delete(docFile._id);
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
  const basePath = endpoint.route;
  const docPath = endpoint.route + '/:docId';
  const {baseUri} = bedrock.config.server;

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
    fields: {'metadata.docId': 1},
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
    const docId = createDocId();
    const md = Object.assign({
      created: new Date(),
      filename
    }, metadata, {docId});
    logger.info('gridfs upload', {docId, metadata: md, contentType});
    return new Promise((resolve, reject) => {
      // using id as "filename"
      const gfsStream = bucket.openUploadStream(docId, {
        contentType,
        metadata: md
      });
      gfsStream
        .on('error', (err) => {
          logger.error('gridfs upload error', {docId, error: err});
          reject(err);
        })
        .once('finish', () => {
          logger.info('gridfs upload done', {docId});
          resolve({
            _id: gfsStream.id,
            docId,
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
      stream,
      metadata: {
        owner: req.user.actor.id
      }
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
        md.id = baseUri + basePath + '/' + results[0].docId;
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
        // FIXME: add error details
        logger.error('store raw content', {error: err});
        next(err);
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
        stream: file,
        filename,
        contentType: mimeType,
        metadata: {
          owner: req.user.actor.id
        }
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
          info.docId = results[0].docId;
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
            id: baseUri + basePath + '/' + fileInfo[0].docId,
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
    ensureAuthenticated,
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
    ensureAuthenticated,
    // TODO: validate({query: 'services.document-server.getDocumentsQuery'}),
    asyncHandler(async (req, res, next) => {
      // TODO: add query support
      next();
    }));
  */

  /*
  app.patch(
    accountPath,
    ensureAuthenticated,
    // TODO: validate({query: 'services.document-server.patchDocuments'}),
    asyncHandler(async (req, res, next) => {
      // TODO: patch allowed metadata?
      next();
    }));
  */

  app.options(docPath, cors());
  app.get(
    docPath,
    ensureAuthenticated,
    // TODO: validate({query: 'services.document-server.getDocument'}),
    cors(),
    asyncHandler(async (req, res) => {
      const docId = req.params.docId;
      const {actor = null} = req.user || {};
      if(req.query.meta === 'MessageDigest2018') {
        const {meta} = await api.get(actor, docId, {
          bucket,
          meta: true
        });
        res.status(200).json({
          id: baseUri + basePath + '/' + meta.docId,
          proof: {
            type: 'MessageDigest2018',
            created: meta.created,
            digestAlgorithm: meta.digestAlgorithm,
            digestValue: meta.digestValue,
            mimeType: meta.contentType
          }
        });
      } else {
        const {data, meta} = await api.get(actor, docId, {
          bucket,
          data: 'stream',
          meta: true
        });
        // set headers
        res.set('content-type', meta.contentType);
        // TODO
        //res.set('content-disposition', 'attachment; filename="...");

        data.pipe(res);
      }
    }));

  /*
  app.delete(
    docPath,
    ensureAuthenticated,
    // TODO: validate({query: 'services.document-server.deleteDocument'}),
    asyncHandler(async (req, res, next) => {
      const docId = req.params.docId;
      const {actor} = req.user;
      await api.remove(actor, docId);
      res.status(204).end();
    }));
  */
}

bedrock.events.on('bedrock-express.configure.routes', async app => {
  const cfg = config['document-server'];
  const {baseUri} = bedrock.config.server;

  app.options(cfg.routes.proxy, cors());
  app.get(
    cfg.routes.proxy,
    /* FIXME: require authentication to use the proxy */
    optionallyAuthenticated,
    // TODO: validate({query: 'services.document-server.proxyDocument'}),
    cors(),
    asyncHandler(async (req, res, next) => {
      let plugin;
      let {url} = req.query;
      const {plugin: pluginName} = req.query;

      // TODO: handle with validator
      if(!url) {
        throw new BedrockError(
          '"url" query param not specified.', 'DataError', {
            public: true,
            httpStatusCode: 400
          });
      } else if(!url.startsWith('https://')) {
        throw new BedrockError(
          '"url" must start with "https://".', 'SyntaxError', {
            public: true,
            httpStatusCode: 400
          });
      } else if(url.startsWith(baseUri + '/' + cfg.routes.proxy)) {
        throw new BedrockError(
          'Circular proxy detected.', 'DataError', {
            public: true,
            httpStatusCode: 400
          });
      }
      if(Array.isArray(pluginName)) {
        throw new BedrockError(
          'Only one "plugin" query param permitted.', 'NotAllowedError', {
            public: true,
            httpStatusCode: 400
          });
      } else if(pluginName) {
        plugin = api.use(pluginName);
        if(plugin.type !== 'proxyPlugin') {
          throw new BedrockError(
            'Invalid plugin type.', 'DataError', {
              public: true,
              httpStatusCode: 400
            });
        }
      }

      // proxy to `url`
      expressHttpProxy(url, {
        https: true,
        parseReqBody: false,
        preserveHostHdr: true,
        proxyErrorHandler(err, res, next) {
          next(err);
        },
        async proxyReqOptDecorator(proxyRequest, originalRequest) {
          proxyRequest.rejectUnauthorized = config.jsonld.strictSSL;
          if(plugin) {
            proxyRequest.url = url;
            await plugin.api.decorateRequest({proxyRequest, originalRequest});
            url = proxyRequest.url;
          }
          return proxyRequest;
        },
        proxyReqPathResolver(/*req*/) {
          return URL.parse(url).path;
        },
        // in milliseconds, 2 minutes
        // TODO: make configurable or use another lib
        timeout: 1000 * 60 * 2
      })(req, res, next);
    }));

  const eps = config['document-server'].endpoints.map(
    endpoint => _setupEndpoint({app, endpoint}));
  return Promise.all(eps);
});
