```javascript
'use strict';

const {setNoSniff, setXssProtection} = require('../utils/cacheHelpers.js');

/**
 * Add security headers.
 */
module.exports = (req, res, next) => {
  setNoSniff(res);
  setXssProtection(res);
  next();
};
```