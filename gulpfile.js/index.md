```javascript
'use strict';
require('module-alias/register');

const search = require('recursive-search');

// DON'T ADD GULP TASKS TO THIS FILE!
// CREATE A NEW FILE IN THIS DIRECTORY INSTEAD

// load gulp tasks from files in this directory
search
  .recursiveSearchSync(/.js/, __dirname)
  .map(require)
  .forEach((module) => {
    Object.assign(exports, module);
  });
```