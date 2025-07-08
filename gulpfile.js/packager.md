```javascript
'use strict';

const {join} = require('path');
const {sh} = require('@lib/utils/sh.js');
const mri = require('mri');

// Parse commandline arguments
const argv = mri(process.argv.slice(2));

const PACKAGER_ROOT = join(__dirname, '../packager');
const opts = {
  workingDir: PACKAGER_ROOT,
};

async function packagerRunLocal() {
  const password = argv.password || process.env.AMP_DEV_CERT_PWD;
  await sh('pwd', opts);
  await sh('docker build -t amppkg .', opts);
  return await sh(
    `docker run -p 8083:8080 --env PASSWORD=${password} amppkg`,
    opts
  );
}

function packagerTest() {
  return sh(
    'curl -si --output - -H "amp-cache-transform: google" -H "accept: application/signed-exchange;v=b3;q=0.9,*/*;q=0.8" "https://amp-dev-staging.appspot.com/index.amp.html"'
  );
}

function packagerLog() {
  return sh('gcloud app logs tail -s default --project amp-dev-sxg');
}

exports.packagerRunLocal = packagerRunLocal;
exports.packagerTest = packagerTest;
exports.packagerLog = packagerLog;
```