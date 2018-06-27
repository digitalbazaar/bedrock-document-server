/*
 * Copyright (c) 2017-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const async = require('async');
const base64url = require('base64url');
const bedrock = require('bedrock');
const brIdentity = require('bedrock-identity');
const crypto = require('crypto');
const fs = require('fs');
const helpers = require('./helpers');
const mockData = require('./mock.data');
let request = require('request');
let rp = require('request-promise-native');

request = request.defaults({
  json: true,
  strictSSL: false
});
rp = rp.defaults({
  json: true,
  strictSSL: false,
  resolveWithFullResponse: true
});

const endpointInfo0 = bedrock.config['document-server'].endpoints[0];
const endpoint0 = bedrock.config.server.baseUri + endpointInfo0.route;

const endpointInfo1 = bedrock.config['document-server'].endpoints[1];
const endpoint1 = bedrock.config.server.baseUri + endpointInfo1.route;

const endpointInfo2 = bedrock.config['document-server'].endpoints[2];
const endpoint2 = bedrock.config.server.baseUri + endpointInfo2.route;

describe('HTTP API', () => {
  before(done => {
    async.series([
      callback => helpers.prepareDatabase(mockData, callback)
    ], done);
  });
  describe('regularUser as actor', () => {
    const mockIdentity = mockData.identities.regularUser;
    let actor;
    /*
    before(done => async.auto({
      getActor: callback => brIdentity.get(
        null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          callback(err);
        })
    }, done));
    */

    async function _postDocs({
      endpoint = null,
      salt = '',
      docs,
      multipart = false
    }) {
      should.exist(endpoint);
      if(!multipart && docs.length !== 1) {
        throw new RangeError('More than one doc for non-mulitpart test');
      }
      const req = {
        url: endpoint,
        method: 'POST'
      };
      if(multipart) {
        const attachments = docs.map(doc => {
          return {
            value: doc.content,
            options: {
              filename: doc.contentFilename,
              contentType: doc.contentType
            }
          };
        });
        req.formData = {
          //attachment: fs.createReadStream(__dirname + '/mock.data.js')
          attachment: attachments
        };
      } else {
        req.body = docs[0].content;
        req.json = false;
        req.headers = {
          accept: 'application/json',
          'content-type': docs[0].contentType
        };
      }
      const postRes = await rp(req);
      should.exist(postRes.body);
      // ensure always have json body
      let body = multipart ? postRes.body : JSON.parse(postRes.body);
      postRes.statusCode.should.equal(200);
      function _checkResult(doc, data) {
        data.should.be.an('object');
        should.exist(data.id);
        data.id.should.be.a('string');
        should.exist(data.proof);
        data.proof.type.should.equal('MessageDigest2018');
        should.exist(data.proof.mimeType);
        data.proof.mimeType.should.equal(doc.contentType);
        should.exist(data.proof.digestAlgorithm);
        data.proof.digestAlgorithm.should.equal('sha256');
        should.exist(data.proof.digestValue);
        const hash =
          base64url(
            crypto
              .createHash('sha256')
              .update(doc.content)
              .digest());
        data.proof.digestValue.should.equal(hash);
        should.exist(data.proof.created);
      }

      if(docs.length === 1) {
        body.should.be.an('object');
        body = [body];
      }
      body.should.be.an('array');
      body.length.should.equal(docs.length);
      const results = [];
      for(let i = 0; i < docs.length; ++i) {
        const doc = docs[i];
        _checkResult(doc, body[i]);
        results.push({
          id: body[i].id,
          content: doc.content,
          contentFilename: doc.contentFilename,
          contentType: doc.contentType,
          response: body[i]
        });
      }
      if(docs.length === 1) {
        return results[0];
      }
      return results;
    }
    it('should post raw plain doc', async () => {
      await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '[post+raw+plain]',
          contentType: 'text/plain'
        }],
        multipart: false
      });
    });
    it('should post raw json doc', async () => {
      await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '{"id":"urn:test:123"}',
          contentType: 'application/json'
        }],
        multipart: false
      });
    });
    it('should post multipart doc', async () => {
      await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '[post+multipart]',
          contentType: 'text/plain',
          contentFilename: 'post-multipart-1'
        }],
        multipart: true
      });
    });
    it('should get raw doc', async () => {
      const docInfo = await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '[post+raw+get]',
          contentType: 'text/plain'
        }],
        multipart: false
      });
      const getRes = await rp({
        url: docInfo.id
      });
      getRes.statusCode.should.equal(200);
      should.exist(getRes.body);
      getRes.body.should.equal(docInfo.content);
      should.exist(getRes.headers['content-type']);
      getRes.headers['content-type'].should.contain(docInfo.contentType);
      // TODO
      //getRes.headers['content-disposition'].should.equal(...);
    });
    it('should get multipart doc', async () => {
      const docInfo = await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '[post+multipart+get]',
          contentType: 'text/plain',
          contentFilename: 'post-multipart-get-1'
        }],
        multipart: true
      });
      const getRes = await rp({
        url: docInfo.id
      });
      getRes.statusCode.should.equal(200);
      should.exist(getRes.body);
      getRes.body.should.equal(docInfo.content);
      should.exist(getRes.headers['content-type']);
      getRes.headers['content-type'].should.contain(docInfo.contentType);
      // TODO
      //getRes.headers['content-disposition'].should.equal(...);
    });
    it('should get raw doc meta', async () => {
      const docInfo = await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '[post+raw+get+meta]',
          contentType: 'text/plain'
        }],
        multipart: false
      });
      const getRes = await rp({
        url: docInfo.id + '?meta=MessageDigest2018'
      });
      getRes.statusCode.should.equal(200);
      should.exist(getRes.body);
      getRes.body.should.deep.equal(docInfo.response);
      should.exist(getRes.headers['content-type']);
      getRes.headers['content-type'].should.contain('application/json');
    });
    it.skip('should post many docs', async () => {
      await _postDocs({
        endpoint: endpoint0,
        docs: [{
          content: '[post+multipart-1]',
          contentType: 'text/plain',
          contentFilename: 'post-multipart-1'
        }, {
          content: '[post+multipart-2]',
          contentType: 'text/plain',
          contentFilename: 'post-multipart-2'
        }],
        multipart: true
      });
      return;

      // TODO
      const postRes = await rp({
        url: endpoint0,
        method: 'POST',
        formData: {
          //attachments: [
          //  require('fs').createReadStream(__dirname + '/../doc1.txt'),
          //  require('fs').createReadStream(__dirname + '/../doc2.jpg'),
          //  require('fs').createReadStream(__dirname + '/../doc3.pdf')
          //]
        }
      });
      // FIXME
      should.exist(postRes.body);
      postRes.statusCode.should.equal(200);
      postRes.body.should.be.an('object');
      // ... check more data
      // ... get and check each resource
    });
    it('should fail if over file limit', async () => {
      let err;
      try {
        await _postDocs({
          endpoint: endpoint1,
          docs: [{
            content: '[post+1]',
            contentType: 'text/plain'
          }, {
            content: '[post+2]',
            contentType: 'text/plain'
          }],
          multipart: true
        });
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.exist(err.statusCode, 'statusCode');
      err.statusCode.should.equal(500);
      // TODO: more checks
    });
    it('should fail if raw over file size limit', async () => {
      let err;
      try {
        await _postDocs({
          endpoint: endpoint1,
          docs: [{
            content: '01234567890',
            contentType: 'text/plain'
          }],
          multipart: false
        });
      } catch(e) {
        err = e;
      }
      should.exist(err);
      should.exist(err.statusCode, 'statusCode');
      err.statusCode.should.equal(413);
      // TODO: more checks
    });
    it('should fail if multipart over file size limit', async () => {
      let err;
      try {
        await _postDocs({
          endpoint: endpoint1,
          docs: [{
            content: '01234567890',
            contentType: 'text/plain'
          }],
          multipart: true
        });
      } catch(e) {
        // FIXME: check error
        should.exist(e.statusCode, 'statusCode');
        e.statusCode.should.equal(500);
        err = e;
      }
      should.exist(err)
      // TODO: more checks
    });
    it('should fail if unknown mimetype', async () => {
      let err;
      try {
        await _postDocs({
          endpoint: endpoint1,
          docs: [{
            content: '',
            contentType: 'bogus/type'
          }]
        });
      } catch(e) {
        // FIXME: check error
        e.statusCode.should.equal(406);
        err = e;
      }
      should.exist(err)
      // TODO: more checks
    });
    it('should deny duplicate doc', async () => {
      const docs = [{
        content: '[dup]',
        contentType: 'text/plain'
      }];
      await _postDocs({
        endpoint: endpoint0,
        docs,
        multipart: false
      });
      let err;
      try {
        await _postDocs({
          endpoint: endpoint0,
          docs,
          multipart: false
        });
      } catch(e) {
        err = e;
      }
      should.exist(err)
      should.exist(err.statusCode, 'statusCode');
      err.statusCode.should.equal(409);
      // TODO: more checks
    });
    it.skip('should allow duplicate doc', async () => {
      // TODO
      // files have hash ids, what should this do?
    });
    it('should share duplicate doc', async () => {
      const docs = [{
        content: '[dup]',
        contentType: 'text/plain'
      }];
      await _postDocs({
        endpoint: endpoint2,
        docs,
        multipart: false
      });
      await _postDocs({
        endpoint: endpoint2,
        docs,
        multipart: false
      });
    });
    it.skip('should delete a doc', async () => {
      // TODO
    });
  });
});
