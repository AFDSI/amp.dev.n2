```javascript
'use strict';

const config = require('../config.js');
const {promisify} = require('util');
const {isAbsolute, join} = require('path');
const {readFile} = require('fs');
const readFileAsync = promisify(readFile);
const fetch = require('node-fetch');
const {pagePath, paths} = require('../utils/project');

/**
 * Will return the content of the grow generated page.
 * In dev mode the page is loaded from the running grow server.
 * @param pageUrlPath The path to the page
 */
async function fetchPage(pageUrlPath) {
  if (config.isTestMode()) {
    // fetch original doc page from filesystem for testing
    return readFileAsync(join(paths.PAGES_SRC, pageUrlPath), 'utf-8');
  } else if (isAbsolute(pageUrlPath)) {
    return readFileAsync(pageUrlPath, 'utf-8');
  } else if (config.isDevMode()) {
    // fetch doc from proxy
    return fetchPageFromGrowServer(pageUrlPath);
  } else {
    // fetch generated doc page from filesystem
    return readFileAsync(pagePath(pageUrlPath), 'utf-8');
  }
}

async function fetchPageFromGrowServer(path) {
  const pageUrl = new URL(path, config.hosts.pages.base);
  const fetchResponse = await fetch(pageUrl);

  // Not checking for Response.ok here as Grow might return an error
  // page with status 500 that holds debug information that should
  // still be shown to the user
  if (fetchResponse.status && fetchResponse.status !== 404) {
    return fetchResponse.text();
  }

  // As this will only ever be called in development throw an error
  // if Grow did not return a page
  throw Error("Requested page doesn't exist in Grow pod");
}

module.exports.fetchPage = fetchPage;
```