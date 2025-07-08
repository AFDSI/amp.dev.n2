```javascript
'use strict';

const {format} = require('util');
const linkifyHtml = require('linkifyjs/html');
const LogProvider = require('./LogProvider.js');

/**
 * Formats a AMP runtime log requests.
 */
class LogFormatter {
  constructor(logProvider = new LogProvider()) {
    this.logProvider_ = logProvider;
  }

  /**
   * Turns a AMP runtime log requests into an HTML string
   * @param {Object} message The log request object.
   * @returns {string} HTML string
   */
  async apply(logRequest) {
    const log = await this.logProvider_.get(logRequest);
    let formattedMesssage = format(log.message, ...logRequest.params);
    formattedMesssage = linkifyHtml(formattedMesssage, {
      defaultProtocol: 'https',
      className: null,
      target: null,
    });
    return formattedMesssage;
  }
}

module.exports = LogFormatter;
```