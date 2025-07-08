```javascript
'use strict';

const {src} = require('gulp');
const {join} = require('path');
const gulpAmpValidator = require('gulp-amphtml-validator');
const {GROW_BUILD_DEST} = require('@lib/utils/project').paths;

/**
 * Validates all pages build into /platform/pages.
 */
function validate() {
  return (
    src(join(GROW_BUILD_DEST, '/**/*.amp.html'))
      // Validate the input and attach the validation result to the "amp" property
      // of the file object.
      .pipe(gulpAmpValidator.validate())
      // Print the validation results to the console.
      .pipe(gulpAmpValidator.format())
      // Exit the process with error code (1) if an AMP validation error
      // occurred.
      .pipe(gulpAmpValidator.failAfterError())
  );
}

exports.validate = validate;
```