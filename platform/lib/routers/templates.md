```javascript
'use strict';

const express = require('express');
const project = require('@lib/utils/project');

// eslint-disable-next-line new-cap
const templatesRouter = express.Router();

templatesRouter.use(
  '/documentation/templates/preview/',
  express.static(project.paths.TEMPLATES)
);

module.exports = templatesRouter;
```