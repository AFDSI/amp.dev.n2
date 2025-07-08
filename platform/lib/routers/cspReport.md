```javascript

'use strict';

const express = require('express');
const log = require('@lib/utils/log')('CSP Violation Report');

// eslint-disable-next-line new-cap
const cspReportRouter = express.Router();

cspReportRouter.use(
  '/csp-report',
  express.json({type: 'application/csp-report'})
);

cspReportRouter.post('/csp-report', (req, res) => {
  log.error(req.body);
  res.sendStatus(200);
});

module.exports = cspReportRouter;
```