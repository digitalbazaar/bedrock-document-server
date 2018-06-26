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
      content = 'IMADOC',
      contentFilename = 'imadoc.txt',
      contentType = 'text/plain',
      attachmentCount = 1
    }) {
      should.exist(endpoint);
      const attachments = [];
      function _content(i) {
        return salt + content + '-' + i;
      }
      for(let i = 0; i < attachmentCount; ++i) {
        attachments.push({
          value: _content(i),
          options: {
            filename: contentFilename,
            contentType: contentType
          }
        });
      }
      const postRes = await rp({
        url: endpoint,
        method: 'POST',
        formData: {
          //attachment: fs.createReadStream(__dirname + '/mock.data.js')
          attachment: attachments,
        }
      });
      should.exist(postRes.body);
      postRes.statusCode.should.equal(200);
      function _checkResult(i, data) {
        data.should.be.an('object');
        should.exist(data.id);
        data.id.should.be.a('string');
        should.exist(data.proof);
        data.proof.type.should.equal('MessageDigest');
        should.exist(data.proof.mimeType);
        data.proof.mimeType.should.equal(contentType);
        should.exist(data.proof.digestAlgorithm);
        data.proof.digestAlgorithm.should.equal('sha256');
        should.exist(data.proof.digestValue);
        const hash =
          base64url(
            crypto
              .createHash('sha256')
              .update(_content(i))
              .digest());
        data.proof.digestValue.should.equal(hash);
        should.exist(data.proof.created);
      }

      let result;
      if(attachments.length === 1) {
        postRes.body.should.be.an('object');
        _checkResult(0, postRes.body);
        result = {
          id: postRes.body.id,
          content: _content(0),
          contentFilename,
          contentType
        };
      } else {
        postRes.body.should.be.an('array');
        postRes.body.length.should.equal(attachmentCount);
        result = [];
        for(let i = 0; i < attachmentCount; ++i) {
          _checkResult(i, postRes.body[i]);
          result.push({
            id: postRes.body[i].id,
            content: _content(i),
            contentFilename,
            contentType
          });
        }
      }

      return result;
    }
    it('should post doc', async () => {
      await _postDocs({
        endpoint: endpoint0,
        salt: '[post]'
      });
    });
    it('should get doc', async () => {
      const docInfo = await _postDocs({
        endpoint: endpoint0,
        salt: '[post+get]'
      });
      //console.log('PG', docInfo);
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
    it.skip('should post many docs', async () => {
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
          endpoint: endpoint1
        });
      } catch(e) {
        // FIXME: check error
        e.statusCode.should.equal(500);
        err = e;
      }
      should.exist(err)
      // TODO: more checks
    });
    it('should fail if over file size limit', async () => {
      let err;
      try {
        await _postDocs({
          endpoint: endpoint1,
          content: '01234567890'
        });
      } catch(e) {
        // FIXME: check error
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
          contentType: 'bogus/type'
        });
      } catch(e) {
        // FIXME: check error
        e.statusCode.should.equal(406);
        err = e;
      }
      should.exist(err)
      // TODO: more checks
    });
    it.skip('should post duplicate doc', async () => {
      // TODO
      // files have hash ids, what should this do?
    });
    it.skip('should delete a doc', async () => {
      // TODO
    });
  });
});
