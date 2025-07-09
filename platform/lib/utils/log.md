```javascript
const {Signale} = require('signale');
const config = require('@lib/config');
const loggers = {};

function log(scope, options = {}) {
  options.scope = scope;
  let logger = loggers[scope];
  if (!logger) {
    loggers[scope] = new Signale(options);
    logger = loggers[scope];

    // Disable all loggers during test runs as they might be confusing for
    // tests targeting error cases
    if (config.isTestMode()) {
      logger.disable();
    }
  }

  return logger;
}

module.exports = log;
```