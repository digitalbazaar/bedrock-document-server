/*
 * Copyright (c) 2017-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const async = require('async');
const bedrock = require('bedrock');
const brIdentity = require('bedrock-identity');
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

const endpoint = bedrock.config.server.baseUri +
  bedrock.config['document-server'].endpoints[0].route;

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

    async function _postDoc({salt = ''}) {
      const content = 'IAMDOC' + salt;
      const contentFilename = 'imadoc.txt';
      const contentType = 'text/plain';

      const postRes = await rp({
        url: endpoint,
        method: 'POST',
        formData: {
          //attachment: fs.createReadStream(__dirname + '/mock.data.js')
          attachment: {
            value: content,
            options: {
              filename: contentFilename,
              contentType: contentType
            }
          }
        }
      });
      should.exist(postRes.body);
      postRes.statusCode.should.equal(200);
      postRes.body.should.be.an('object');
      should.exist(postRes.body.id);
      postRes.body.id.should.be.a('string');
      should.exist(postRes.body.proof);
      postRes.body.proof.type.should.equal('MessageDigest');
      should.exist(postRes.body.proof.mimeType);
      postRes.body.proof.mimeType.should.equal(contentType);
      should.exist(postRes.body.proof.digestAlgorithm);
      should.exist(postRes.body.proof.digestValue);
      should.exist(postRes.body.proof.created);

      return {
        id: postRes.body.id,
        content,
        contentFilename,
        contentType
      };
    }
    it('should post doc', async () => {
      await _postDoc({salt: '[post]'});
    });
    it('should get doc', async () => {
      const docInfo = await _postDoc({salt: '[post+get]'});
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
        url: endpoint,
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
    it.skip('should post duplicate doc', async () => {
      // TODO
      // files have hash ids, what should this do?
    });
    it.skip('should delete a doc', async () => {
      // TODO
    });
  });
});
