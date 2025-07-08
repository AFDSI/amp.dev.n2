```javascript
'use strict';

const HtmlFormatter = require('./HtmlFormatter');

let log;

const logProvider = {
  get: () => Promise.resolve(log),
};

const formatter = new HtmlFormatter(logProvider);

test('formats string', async () => {
  log = {
    message: 'hello %s!',
  };
  const logRequest = {
    id: 123,
    params: ['world'],
  };
  const message = await formatter.apply(logRequest);
  expect(message).toBe('hello world!');
});

test('linkifies URLs', async () => {
  log = {
    message: 'see https://example.com',
  };
  const logRequest = {
    id: 123,
    params: [],
  };
  const message = await formatter.apply(logRequest);
  expect(message).toBe(
    'see <a href="https://example.com">https://example.com</a>'
  );
});

test('throws exception if log not available', async () => {
  const expectedError = new Error('fail');
  logProvider.get = () => Promise.reject(expectedError);
  const logRequest = {
    id: 123,
    params: ['world'],
  };
  let error;
  try {
    await formatter.apply(logRequest);
  } catch (err) {
    error = err;
  }
  expect(error).toBe(expectedError);
});
```