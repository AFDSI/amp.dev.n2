```javascript
'use strict';

require('module-alias/register');

const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const path = require('path');

const io = require('./lib/io');
const templates = require('./lib/templates');
const log = require('@lib/utils/log')('Build Boilerplate');

const DIST_DIR = 'dist';
const INPUT_FILE = 'templates/index.html';

const generatorTemplate = io.readFile(INPUT_FILE);
const config = initConfig();
const generatorPage = templates.render(generatorTemplate, config);
generateOptimizedAmpFiles(generatorPage);
log.success('Built boilerplate generator.');

function initConfig() {
  const config = {
    gaTrackingId: require('../platform/config/shared.json').gaTrackingId,
    categories: require('./data/categories.json'),
    formats: require('./data/formats.json'),
    templates: templates.find('./templates/files'),
    highlightTheme: io.readFile(
      path.join(__dirname, './templates/styles/code-snippet.scss')
    ),
  };
  // assign default template
  let defaultTemplate;
  config.formats.forEach((format) => {
    format.template = config.templates[format.id];
    if (format.default) {
      defaultTemplate = format.template;
    }
  });
  // server-side render initial boilerplate code
  config.initialCode = templates.render(defaultTemplate, {});
  return config;
}

async function generateOptimizedAmpFiles(output) {
  const optimized = await optimizeAmp(output);
  io.writeFile(DIST_DIR, 'index.html', optimized);
}

async function optimizeAmp(html) {
  const optimizer = AmpOptimizer.create();
  return await optimizer.transformHtml(html);
}
```