```javascript

'use strict';

const path = require('path');
const express = require('express');
const {setMaxAge} = require('@lib/utils/cacheHelpers');
const project = require('@lib/utils/project');
const config = require('@lib/config');

function createRobotsHandler(robotsFile) {
  // eslint-disable-next-line new-cap
  const router = express.Router();
  const robotsFilePath = path.join(
    'robots',
    config.isProdMode() ? robotsFile : 'disallow_all.txt'
  );
  router.get('/robots.txt', (request, response) => {
    setMaxAge(response, 60 * 60);
    response
      .status(200)
      .sendFile(robotsFilePath, {root: project.paths.STATICS_DEST});
  });
  return router;
}

module.exports = createRobotsHandler;
```