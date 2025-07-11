'use strict';

const gulp = require('gulp');
// const through = require('through2'); // Comment out: 'through' is unused
// const yaml = require('js-yaml'); // Comment out: 'yaml' is unused
const {sh} = require('@lib/utils/sh');
// const {project} = require('@lib/utils'); // Comment out: 'project' is unused
// const signale = require('signale'); // Comment out: 'signale' is unused
const growReferenceChecker = require('@lib/tools/growReferenceChecker');
// const log = require('@lib/utils/log')('Linter'); // Comment out: 'log' is unused

function lintNode() {
  // Use the direct path to the local eslint binary to avoid PATH issues with npx/npm
  return sh('node_modules/.bin/eslint "**/*.js"', {
    env: process.env, // Ensure environment variables are inherited
  });
}

function lintYaml() {
  // Directly call 'npx gulp lintYaml' without explicitly invoking bash.exe
  return sh('npx gulp lintYaml', {
    env: process.env,
  });
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
