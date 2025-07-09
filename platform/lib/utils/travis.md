```javascript

'use strict';

require('module-alias/register');

/**
 * Returns true if called inside a Travis environment
 * @return {Boolean}
 */
function onTravis() {
  return !!process.env.TRAVIS;
}

const folds = {};

/**
 * Outputs markers needed for the Travis UI to make certain log sections
 * collapsable
 * @param  {String} label [description]
 * @return {undefined}
 */
function fold(label) {
  if (!onTravis()) {
    return;
  }

  if (!folds[label]) {
    console.log(`travis_fold:start:${label}`);
  } else {
    console.log(`travis_fold:end:${label}`);
  }

  folds[label] = !!folds[label];
}

const build = {
  number: process.env.TRAVIS_BUILD_NUMBER,
  job: process.env.TRAVIS_JOB_NUMBER,
};

const repo = {
  branch: process.env.TRAVIS_BRANCH,
  commit: process.env.TRAVIS_COMMIT,
};

module.exports = {
  onTravis,
  fold,
  build,
  repo,
};
```