```javascript

'use strict';

const express = require('express');
const growPageLoader = require('../common/growPageLoader');

// eslint-disable-next-line new-cap
const xmlPages = express.Router();

xmlPages.get('/*.xml', async (req, res, next) => {
  // this page handler is mainly for the sitemap.xml
  // but since we do not know where exactly it is located we handle all xml files
  // Because of that this router should come after the static files
  try {
    const result = await growPageLoader.fetchPage(req.path);
    res.send(result);
  } catch (e) {
    // page not found
    next();
  }
});

module.exports = xmlPages;
```