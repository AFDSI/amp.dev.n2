```javascript
'use strict';

const express = require('express');
const project = require('@lib/utils/project');
const {
  getFormatFromRequest,
  DEFAULT_FORMAT,
} = require('../amp/formatHelper.js');
const {promisify} = require('util');
const fs = require('fs');
const readFileAsync = promisify(fs.readFile);
const LRU = require('lru-cache');
const path = require('path');

// eslint-disable-next-line new-cap
const inlineExamples = express.Router();

const exampleCache = new LRU({
  max: 200,
});

inlineExamples.get('/*', async (request, response, next) => {
  const format = getFormatFromRequest(request);
  if (format && format !== DEFAULT_FORMAT) {
    request.url = request.path.replace('.html', `.${format}.html`);
  }

  try {
    const examplePath = new URL(request.url, 'https://example.com').pathname;
    let example = exampleCache.get(examplePath);
    if (!example) {
      example = await readFileAsync(
        path.join(project.paths.INLINE_EXAMPLES_DEST, examplePath),
        'utf-8'
      );
      exampleCache.set(examplePath, example);
    }
    response.send(example);
  } catch (e) {
    next(e);
  }
});

module.exports = inlineExamples;
```