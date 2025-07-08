```javascript

'use strict';

const express = require('express');
const {ensureUrlScheme, loadTemplate} = require('./growPages.js');
const log = require('@lib/utils/log')('Grow Shared Pages');

// eslint-disable-next-line new-cap
const sharedPages = express.Router();

/**
 * Some pages rendered by Grow should not be served by the router in growPages.js
 * as they a) don't need to be SSR and b) are not meant to be customer facing
 * and therefore can only be made accessible by their canonical path
 */
sharedPages.get('/shared/**', async (req, res, next) => {
  const url = ensureUrlScheme(req.originalUrl);
  try {
    const template = await loadTemplate(url.pathname);
    res.send(template.render());
  } catch (e) {
    // page not found
    log.error(e);
    next();
  }
});

module.exports = sharedPages;
```