```javascript
'use strict';

require('module-alias/register');

const fs = require('fs');
const cheerio = require('cheerio');
const project = require('@lib/utils/project');
const filePath =
  project.paths.GROW_BUILD_DEST + '/tests/examples/default_settings.html';

describe('config', () => {
  const generatedContent = fs.readFileSync(filePath);
  const $ = cheerio.load(generatedContent);

  it('check headline', () => {
    expect($('h1').length).toBe(
      1,
      'Should only have headline from page and not from example'
    );

    const divAfterHeadline = $('h1').nextAll('div');

    expect(divAfterHeadline.hasClass('ap-m-code-snippet')).toBe(
      true,
      'First div after headline should be the code snipped'
    );
  });
});
```