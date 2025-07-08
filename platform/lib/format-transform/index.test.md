```javascript
const fs = require('fs');
const {join} = require('path');
const {BUILD} = require('@lib/utils/project').paths;
const signale = require('signale');

const VALIDATOR_TARGET_PATH = join(BUILD, 'testing/validator.js');
if (fs.existsSync(VALIDATOR_TARGET_PATH)) {
  // Ensure the downloaded validator.js is used:
  jest.mock('amphtml-validator');
  const ampHtmlValidator = jest.requireActual('amphtml-validator');
  const validatorInstance = ampHtmlValidator.getInstance(VALIDATOR_TARGET_PATH);
  const ampHtmlValidatorMock = require('amphtml-validator');
  ampHtmlValidatorMock.getInstance.mockReturnValue(validatorInstance);
} else {
  signale.warn(
    'No local validator.js found. This test will not run offline.' +
      ' Please run npm install.'
  );
}

const {getInstance} = require('./index');

const PLATFORM_HOST = require('../config.js').hosts.platform.base;

describe('formatTransform', () => {
  let formatTransform = null;

  beforeEach(async () => {
    if (!formatTransform) {
      formatTransform = await getInstance();
    }
  });

  it('makes no changes when target is websites', () => {
    const input = `<html ⚡>
<head>
<link rel="canonical" href="<% canonical %>"></head><body></body></html>`;
    expect(formatTransform.transform(input, 'websites')).toEqual({
      transformedContent: input,
    });
  });

  it('changes html tag and cleans up head', () => {
    const input = s(`<!doctype html>
<html ⚡>
<head>
<link><meta><noscript></noscript>
<meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<style amp-boilerplate></style>
</head>
<body></body>
</html>`);
    const want = s(`<!doctype html>
<html ⚡4email data-css-strict>
<head>
<meta charset="utf-8">
<script async src="https://cdn.ampproject.org/v0.js"></script>
<style amp4email-boilerplate>body{visibility:hidden}</style>
</head>
<body></body>
</html>`);
    const {transformedContent, validationResult} = formatTransform.transform(
      input,
      'email'
    );
    expect(s(transformedContent)).toBe(want);
    expect(validationResult).toEqual({
      status: 'PASS',
      errors: [],
    });
  });

  it('makes URLs absolute', () => {
    const input = s(`<!doctype html><html ⚡4email><head></head>
<body>
<a href="/something">Link</a>
<amp-img src="/something" width="1" height="1"></amp-img>
<form action-xhr="/something"></form>
</body>
</html>`);
    const want = s(`<!doctype html><html ⚡4email data-css-strict><head></head>
<body>
<a href="${PLATFORM_HOST}/something">Link</a>
<amp-img src="${PLATFORM_HOST}/something" width="1" height="1"></amp-img>
<form action-xhr="${PLATFORM_HOST}/something"></form>
</body>
</html>`);
    const {transformedContent} = formatTransform.transform(input, 'email');
    expect(s(transformedContent)).toBe(want);
  });

  it('removes @formats', () => {
    const input =
      s(`<html ⚡><head><style amp-custom>body{color:red}</style></head>
<!-- comment @formats(websites) -->
<body>
</body>
</html>`);
    const want =
      s(`<html ⚡><head><style amp-custom>body{color:red}</style></head>
<!-- comment  -->
<body>
</body>
</html>`);

    const {transformedContent} = formatTransform.transform(input, 'websites');
    expect(s(transformedContent)).toBe(want);
  });

  it('applies @formats filter', () => {
    const input = s(`<!doctype html><html ⚡><head></head>
<body>
<!-- comment @formats(websites) -->
  <div>foo</div>
<!-- comment -->
  <div>bar</div>
<!-- comment @formats(email) -->
  <div>baz</div>
</body>
</html>`);
    const want = s(`<!doctype html><html ⚡4email data-css-strict><head></head>
<body>
<!-- comment -->
  <div>bar</div>
<!-- comment  -->
  <div>baz</div>
</body>
</html>`);

    const {transformedContent} = formatTransform.transform(input, 'email');
    expect(s(transformedContent)).toBe(want);
  });

  it('checks if result is valid AMP', () => {
    const input = '<!doctype html><html ⚡><head></head><body></body></html>';
    const want =
      '<!doctype html><html ⚡4email data-css-strict><head></head><body></body></html>';
    const {transformedContent, validationResult} = formatTransform.transform(
      input,
      'email'
    );
    expect(s(transformedContent)).toBe(want);
    expect(validationResult.status).toBe('FAIL');
  });

  it('throws when format is not supported', () => {
    expect(() => {
      formatTransform.transform('<html ⚡></html>', 'foobar');
    }).toThrow();
  });
});

function s(str) {
  return str.replace(/\n/g, '').trim();
}
```