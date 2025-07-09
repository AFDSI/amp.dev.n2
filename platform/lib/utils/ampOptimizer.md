```javascript
const HeadDedupTransformer = require('@lib/utils/HeadDedupTransformer');
const AmpOptimizer = require('@ampproject/toolbox-optimizer');
const CssTransformer = require('@lib/utils/cssTransformer');
const signale = require('signale');

const optimizerConfig = {
  imageBasePath: 'pages',
  autoExtensionImport: true,
  extensionVersions: {
    'amp-base-carousel': '0.1',
  },
  transformations: [
    HeadDedupTransformer,
    ...AmpOptimizer.TRANSFORMATIONS_AMP_FIRST,
    CssTransformer,
  ],
};

const optimizer = AmpOptimizer.create(optimizerConfig);

/**
 * Takes a arbitrary HTML string (a rendered template in
 * most cases) together with a request. If the request does not
 * come with a get paramter of `optimize=false` the document
 * gets optimized otherwise or in case of error
 * the original HTML string is returned
 *
 * @param {express.Request} request
 * @param {String} html - HTML Markup
 * @param {Object} params - Optional configuration for the optimizer
 */
async function optimize(request, html, params = {}, filename) {
  if (request.query.optimize == 'false') {
    return html;
  }
  if (request.query.ampjs === '1') {
    params.ampUrlPrefix = 'https://ampjs.org';
  }

  try {
    return await optimizer.transformHtml(html, params);
  } catch (e) {
    signale.error(`[OPTIMIZER] file - ${filename}`, e);
    return html;
  }
}

module.exports = {
  optimizer,
  optimize,
};
```