```javascript

'use strict';

const contentSecurityPolicy = require('helmet-csp');
const config = require('@lib/config');

const getDynamicHosts = () =>
  ['playground', 'preview', 'go', 'log']
    .map((key) => {
      const {[key]: hostConfig} = config.hosts || {};
      if (hostConfig) {
        return `${config.getHost(hostConfig)}/`;
      }
    })
    .filter((v) => v);

module.exports = (req, res, next) => {
  const directives = {
    defaultSrc: ['*', 'data:', 'blob:'],
    workerSrc: [`'self'`, 'blob:'],
    scriptSrc: [
      'blob:',
      `'unsafe-inline'`,
      'https://cdn.ampproject.org/v0.js',
      'https://cdn.ampproject.org/v0.mjs',
      'https://cdn.ampproject.org/v0/',
      'https://cdn.ampproject.org/sw/',
      'https://cdn.ampproject.org/viewer/',
      'https://cdn.ampproject.org/rtv/',
      'https://www.googletagmanager.com/gtag/js',
      ...getDynamicHosts(),
    ],
    objectSrc: [`'none'`],
    styleSrc: [
      `'unsafe-inline'`,
      'https://cdn.ampproject.org/rtv/',
      ...getDynamicHosts(),
    ],
    reportUri: ['/csp-report'],
  };

  // Allow unsafe-inline for examples
  if (/\/documentation\/examples\//.test(req.path)) {
    directives.scriptSrc = [...directives.scriptSrc, `'unsafe-inline'`];
  }

  // Add security headers.
  contentSecurityPolicy({
    directives,
    reportOnly: true,
  })(req, res, next);
};
```
