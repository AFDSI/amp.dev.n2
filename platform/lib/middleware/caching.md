```javascript
const mime = require('mime-types');
const ms = require('ms');
const {setMaxAge, setImmutable} = require('../utils/cacheHelpers.js');

const IMMUTABLE = 'immutable';

const maxAgePerMimeType = [
  [/text\/.+$/i, maxAge('1h')],
  [/image\/.+$/i, maxAge('1w')],
  [/video\/.+$/i, maxAge('1w')],
  [/application\/json$/i, maxAge('1h')],
  [/application\/zip$/i, maxAge('1d')],
  [/application\/pdf$/i, maxAge('1d')],
  [/application\/javascript$/i, maxAge('1h')],
  [/font\/.+$/i, IMMUTABLE],
];

const defaultMaxAge = maxAge('1m');

module.exports = (request, response, next) => {
  const mimeType =
    mime.lookup(request.path) ||
    extractMimeFromAcceptHeader(request.headers.accept);
  if (!mimeType) {
    setMaxAge(response, defaultMaxAge);
    next();
    return;
  }
  const maxAgeMapping = maxAgePerMimeType.find((mapping) =>
    mapping[0].test(mimeType)
  );
  const maxAge = maxAgeMapping ? maxAgeMapping[1] : defaultMaxAge;
  if (maxAge === IMMUTABLE) {
    setImmutable(response);
  } else {
    setMaxAge(response, maxAge);
  }
  next();
};

function extractMimeFromAcceptHeader(string) {
  if (!string) {
    return '';
  }
  return string.split(',')[0];
}

function maxAge(string) {
  return Math.floor(ms(string) / 1000);
}
```