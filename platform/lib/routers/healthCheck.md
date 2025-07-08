```javascript
'use strict';

const express = require('express');
const log = require('@lib/utils/log')('Health Check');

// eslint-disable-next-line new-cap
const healthCheck = express.Router();
const HEALTH_CHECK_PATH = '/__health-check';

// Used by GCE to determine wether a VM instance is healthy.
healthCheck.get(HEALTH_CHECK_PATH, (req, res) => {
  // TODO add more checks
  log.info('OK');
  res.status(200).send('OK');
});

module.exports = {
  router: healthCheck,
  HEALTH_CHECK_PATH,
};
```