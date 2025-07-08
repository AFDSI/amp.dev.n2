```javascript
'use strict';

const gulp = require('gulp');
const once = require('gulp-once');
const {join} = require('path');

const config = require('@lib/config');
const {sh} = require('@lib/utils/sh.js');
const {project} = require('@lib/utils');

const IMAGE_TAG = 'amp-dev-thumbor';
const opts = {
  workingDir: project.paths.THUMBOR_ROOT,
};

async function thumborRunLocal() {
  await sh('pwd', opts);
  await sh(`docker build -t ${IMAGE_TAG} .`, opts);
  return await sh(
    `docker run -p ${config.hosts.thumbor.port}:8080 ${IMAGE_TAG}`,
    opts
  );
}

function thumborImageIndex() {
  const imagePaths = config.shared.thumbor.fileExtensions.map((extension) => {
    return join(project.paths.STATICS_DEST, '/**/', `*.${extension}`);
  });

  return gulp.src(imagePaths).pipe(
    once({
      file: project.paths.THUMBOR_IMAGE_INDEX,
    })
  );
}

exports.thumborRunLocal = thumborRunLocal;
exports.thumborImageIndex = thumborImageIndex;
```