'use strict';

const gulp = require('gulp');
const config = require('@lib/config');
const yaml = require('js-yaml');
const gulpFile = require('gulp-file');
const fs = require('fs');
const {project} = require('@lib/utils');

async function whoAmI() {
  const buildInfo = {
    'environment': config.environment,
    'instance': process.env.GAE_INSTANCE,
    'build': yaml.load(fs.readFileSync(project.paths.BUILD_INFO_PATH, 'utf8')),
  };

  return await gulpFile(`who-am-i`, JSON.stringify(buildInfo, 0, 2), {
    src: true,
  }).pipe(gulp.dest(`${project.paths.PAGES_DEST}`));
}

exports.whoAmI = whoAmI;
