```javascript
'use strict';

const gulp = require('gulp');
const through = require('through2');
const yaml = require('js-yaml');
const {sh} = require('@lib/utils/sh');
const {project} = require('@lib/utils');
const signale = require('signale');
const growReferenceChecker = require('@lib/tools/growReferenceChecker');
const log = require('@lib/utils/log')('Linter');

function lintNode() {
  return sh('npm run lint:node');
}

function lintYaml() {
  return gulp.src(`${project.paths.ROOT}/**/*.{yaml,yml}`).pipe(
    through.obj(async (file, encoding, callback) => {
      try {
        if (file.contents.includes(' !g.')) {
          log.warn(
            `Can not validate ${file.relative} as it contains custom constructors`
          );
        } else {
          yaml.load(file.contents);
        }

        callback();
      } catch (e) {
        signale.fatal(`Error parsing YAML: ${file.relative}`, e);
        callback(e);
      }
    })
  );
}

function lintGrow() {
  return growReferenceChecker.start();
}

exports.lintNode = lintNode;
exports.lintYaml = lintYaml;
exports.lintGrow = lintGrow;
exports.lintAll = gulp.parallel(
  lintNode,
  lintYaml
  /* TODO(#5584): restore `lintGrow` once the test and workflows are fixes. */
);
```