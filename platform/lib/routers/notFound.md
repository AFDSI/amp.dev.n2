```javascript
'use strict';

const {pagePath} = require('@lib/utils/project');
const {setMaxAge} = require('@lib/utils/cacheHelpers.js');
const {optimizer} = require('@lib/utils/ampOptimizer.js');
const {readFileSync} = require('fs');
const {join} = require('path');

let optimizedPage;

async function getNotFoundPage() {
  if (!optimizedPage) {
    try {
      const page = readFileSync(join(pagePath(), '404.html'), 'utf-8');
      optimizedPage = await optimizer.transformHtml(page);
    } catch (e) {
      optimizedPage = "The page you've requested can't be found.";
    }
  }
  return optimizedPage;
}

module.exports = async (req, res) => {
  setMaxAge(res, 60 * 10); // ten minutes
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    res.status(404).send(getNotFoundPage());
    return;
  }

  res.status(404).send('404').end();
};
```