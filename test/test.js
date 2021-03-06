/*
 * Copyright (c) 2018 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');

// load plugins
require('bedrock-server');
require('bedrock-document-server');
require('./server');

bedrock.events.on('bedrock.init', () => {
  require('./mocha/mock.data');
});

require('bedrock-test');
bedrock.start();
