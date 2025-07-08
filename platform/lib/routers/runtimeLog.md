```javascript
'use strict';

const express = require('express');
const LogFormatter = require('../runtime-log/HtmlFormatter.js');
const log = require('@lib/utils/log')('Runtime Log');
const robots = require('./robots');

const {Templates} = require('../templates/');

// eslint-disable-next-line new-cap
const runtimeLog = express.Router();
const logFormatter = new LogFormatter();

const regexIsNumber = /\d+/;

runtimeLog.get('/', async (request, response) => {
  const message = {
    version: request.query.v,
    id: request.query.id,
    params: request.query.s || [],
  };
  if (!isValidLogRequest(message)) {
    response.status(400).send('Invalid request');
    return;
  }
  try {
    const messageTemplate = await Templates.get('message.html');
    const html = await logFormatter.apply(message);
    response.send(
      messageTemplate.render({
        title: 'Log',
        text: html,
        requestPath: request.path,
      })
    );
  } catch (error) {
    log.error('Retrieving runtime log failed:', error);
    response.status(404).send('Message not found');
  }
});

runtimeLog.use(robots('allow_all.txt'));

function isValidLogRequest(logRequest) {
  return (
    regexIsNumber.test(logRequest.version) && regexIsNumber.test(logRequest.id)
  );
}

module.exports = runtimeLog;
```