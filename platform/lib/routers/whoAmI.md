```javascript
'use strict';

const express = require('express');
const yaml = require('js-yaml');
const fs = require('fs');
const utils = require('@lib/utils');
const config = require('@lib/config');

// eslint-disable-next-line new-cap
const whoAmI = express.Router();
const info = {
  'environment': config.environment,
  'instance': process.env.GAE_INSTANCE,
  'build': yaml.load(
    fs.readFileSync(utils.project.paths.BUILD_INFO_PATH, 'utf8')
  ),
};

whoAmI.get('/who-am-i', (request, response) => {
  response.setHeader('Content-Type', 'application/json');
  response.status(200).send(JSON.stringify(info, null, 2));
});

module.exports = whoAmI;
```