```javascript

require('module-alias/register');
const log = require('@lib/utils/log')('Localized Documents Cleaner');
const gulp = require('gulp');
const through = require('through2');
const path = require('path');

// Where to look for existing documents
const POD_BASE_PATH = path.join(__dirname, '../../../pages/');

// Which documents to check for broken references
// eslint-disable-next-line max-len
const PAGES_SRC = POD_BASE_PATH + 'content/amp-dev/**/*@*.md';

class LocalizedDocumentsCleaner {
  constructor() {}

  async start() {
    log.start(`Inspecting documents in ${PAGES_SRC} ...`);

    return new Promise((resolve, reject) => {
      let stream = gulp.src(PAGES_SRC, {'read': true, 'base': './'});
      stream = stream.pipe(
        through.obj((doc, encoding, callback) => {
          stream.push(this._clean(doc));
          callback();
        })
      );

      stream.pipe(gulp.dest('./'));
      stream.on('end', () => {
        log.complete('Done!');

        resolve();
      });
    });
  }

  _clean(doc) {
    let content = doc.contents.toString();

    content = content.replace(/\nformats:\s*(\n- .*)+/m, '');

    doc.contents = Buffer.from(content);
    return doc;
  }
}

// If not required, run directly
if (!module.parent) {
  const localizedDocumentsCleaner = new LocalizedDocumentsCleaner();
  localizedDocumentsCleaner.start();
}

module.exports = LocalizedDocumentsCleaner;
```