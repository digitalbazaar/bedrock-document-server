/*
 * Copyright (c) 2017-2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const async = require('async');
const brIdentity = require('bedrock-identity');
const brDocServer = require('bedrock-document-server');
const database = require('bedrock-mongodb');
const expect = global.chai.expect;
const helpers = require('./helpers');
const mockData = require('./mock.data');

describe.skip('Node API', () => {
  before(done => {
    async.series([
      callback => helpers.prepareDatabase(mockData, callback)
    ], done);
  });
  describe.skip('add API', () => {
    beforeEach(done => {
      helpers.removeCollections(['documentServer'], done);
      // FIXME drop buckets
    });
    describe('regularUser as actor', () => {
      const mockIdentity = mockData.identities.regularUser;
      let actor;
      before(done => {
        brIdentity.get(null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          done(err);
        });
      });
      it('should add a doc with no owner', async () => {
        const doc = mockData.docs.doc1;
        // ...
      });
      // FIXME: determine proper behavior, this test adds a new doc
      it.skip('returns existing doc on attempt to add a duplicate', async () => {
        // ...
      });
      it('should add a doc with an owner', async () => {
        // ...
      });
      it('returns PermissionDenied if actor is not owner', async () => {
        // ...
      });
      it('returns error if invalid storage plugin is specified', async () => {
        // ...
      });
    }); // end regularUser as actor
    describe.skip('admin as actor', () => {
      const mockIdentity = mockData.identities.adminUser;
      let actor;
      before(done => {
        brIdentity.get(null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          done(err);
        });
      });
      it('should create a doc with no owner', async () => {
        // ...
      });
      // FIXME: determine proper behavior, this test adds a new doc
      it.skip('returns existing doc on attempt to create a duplicate', async () => {
        // ..
      });
      it('should add a doc with an owner', async () => {
        // ...
      });
      it('should add a doc with a different owner', async () => {
        // ...
      });
      it('returns error if invalid storage plugin is specified', async () => {
        // ...
      });
    }); // end admin as actor
  }); // end create API
  describe.skip('get API', () => {
    beforeEach(done => {
      helpers.removeCollections(['documentServer'], done);
      // FIXME: drop buckets
    });
    describe('regularUser as actor', () => {
      let actor;
      before(done => {
        const mockIdentity = mockData.identities.regularUser;
        brIdentity.get(null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          done(err);
        });
      });
      it('gets a doc with no owner', async () => {
        // ...
      });
      it('gets a doc with actor as owner', done => async.auto({
      }, done));
      it('returns PermissionDenied if actor does not own the doc', done => {
      });
      it('returns NotFound on a non-exsistent doc', done => {
      });
      it('returns NotFound on a deleted doc', done => async.auto({
      }, done));
    }); // end regularUser as actor
    describe('adminUser as actor', () => {
      let actor;
      before(done => {
        const mockIdentity = mockData.identities.adminUser;
        brIdentity.get(null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          done(err);
        });
      });
      it('gets a doc with no owner', async () => {
        // ...
      });
      it('gets a doc with actor as owner', async () => {
        // ...
      });
      it('gets a doc with a different owner', async () => {
        // ...
      });
      it('returns NotFound on a non-exsistent doc', async () => {
        // ...
      });
      it('returns NotFound on a deleted doc', async () => {
        // ...
      });
    }); // end adminUser as actor
  }); // end get API
  describe.skip('delete API', () => {
    beforeEach(done => {
      helpers.removeCollections(['documentServer'], done);
      // FIXME: drop buckets
    });
    describe('regularUser as actor', () => {
      let actor;
      before(done => {
        const mockIdentity = mockData.identities.regularUser;
        brIdentity.get(null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          done(err);
        });
      });
      it('should delete a doc if actor is owner', async () => {
        // ...
      });
      it('returns NotFound on a non-exsistent doc', async () => {
        // ...
      });
      it('returns PermissionDenied if actor is not owner', async () => {
        // ...
      });
      it('returns PermissionDenied if there is no owner', async () => {
        // ...
      });
    }); // end regularUser as actor
    describe('adminUser as actor', () => {
      let actor;
      before(done => {
        const mockIdentity = mockData.identities.adminUser;
        brIdentity.get(null, mockIdentity.identity.id, (err, result) => {
          actor = result;
          done(err);
        });
      });
      it('should delete a doc if actor is owner', async () => {
        // ...
      });
      it('should delete a doc with a different owner', async () => {
        // ...
      });
      it('returns NotFound on a non-exsistent doc', async () => {
        // ...
      });
      it('returns PermissionDenied if there is no owner', async () => {
        // ...
      });
    }); // end adminUser as actor
  }); // end delete API
}); // end document server API
