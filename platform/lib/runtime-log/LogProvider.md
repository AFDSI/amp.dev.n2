```javascript
'use strict';

const {format} = require('util');
const nodeFetch = require('node-fetch');
const LRU = require('lru-cache');

const LOG_HOST = 'https://cdn.ampproject.org/rtv/%s/log-messages.json';
const MAX_CACHE_SIZE = 10;

/**
 * Fetches and caches the runtime log.
 */
class LogProvider {
  constructor(fetch = nodeFetch) {
    this.fetch_ = fetch;
    this.cache_ = new LRU(MAX_CACHE_SIZE);
  }

  /**
   * Returns a message object.
   *
   * @param {Object} logRequest The log request object.
   * @returns {Promise<Object>} the log object
   */
  async get(logRequest) {
    const version = logRequest.version;
    let messages = this.cache_.get(version);
    if (!messages) {
      messages = await this.fetchLogs_(version);
      this.cache_.set(version, messages);
    }
    const result = messages[logRequest.id];
    if (!result) {
      throw new Error(`Unknown message id: ${logRequest.id}`);
    }
    return result;
  }

  async fetchLogs_(version) {
    const url = format(LOG_HOST, version);
    const response = await this.fetch_(url);
    if (!response.ok) {
      throw new Error(`Request failed ${url} with status ${response.status}`);
    }
    return response.json();
  }
}

module.exports = LogProvider;
```