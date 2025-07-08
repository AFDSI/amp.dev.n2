```javascript

'use strict';

const {DEFAULT_FORMAT} = require('../amp/formatHelper.js');

/**
 * Helps determining the default format for a certain template
 * to render it in the best fitting format if none is explicitly set
 */
class SupportedFormatsExtension {
  constructor() {
    this.tags = ['supportedFormats'];
  }

  parse(parser, nodes) {
    const token = parser.nextToken();

    // Parse arguments from tag
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(token.value);

    return new nodes.CallExtension(this, 'run', args);
  }

  /**
   * Tries to figure out if there is a fitting default
   * format and overwrites the one set by the global context
   */
  run(context, args) {
    const formats = args.formats || [DEFAULT_FORMAT];

    // Check if the user did not select a specific format
    // and if so overwrite the default format with a more fitting one
    if (context.ctx.requestedFormat) {
      return;
    }

    context.ctx.format = formats[0];
  }
}

module.exports = {
  SupportedFormatsExtension,
};
```