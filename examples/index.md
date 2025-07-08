```javascript
'use strict';

const express = require('express');
const {join, dirname, resolve} = require('path');

// eslint-disable-next-line new-cap
const examples = express.Router();

const {listFiles} = require('@boilerplate/lib/io.js');

/* auto import all sample specific routers */
loadRouters('api', '/api');
/* auto import all routers defined in this dir */
loadRouters('source');

function loadRouters(root, prefix = '') {
  const routers = [];
  const rootDir = resolve(join(__dirname, root));
  listFiles(rootDir, routers, true);
  routers
    .filter((path) => path.endsWith('.js') && !path.includes('/static/'))
    .forEach((path) => {
      const route = join(prefix, getRoute(rootDir, path));
      examples.use('/documentation/examples' + route, require(path));
    });
}

function getRoute(rootDir, filePath) {
  let route = filePath.substring(rootDir.length);
  route = dirname(route);
  route = removeOrdinals(route);
  return route;
}

function removeOrdinals(path) {
  return path.replace(/\/\d+\./g, '/');
}

module.exports = examples;
```