```javascript
const {remove, firstChildByTag} =
  require('@ampproject/toolbox-optimizer').NodeUtils;
const TAGS_TO_DEDUP = {
  meta: {
    name: 'viewport',
  },
  link: {
    rel: 'canonical',
  },
};

/**
 * A custom transformer for the @ampproject/toolbox-optimizer removing
 * all duplicated viewport and link rel=canonical tags.
 */
class HeadDedupTransformer {
  constructor(config) {
    this.log_ = config.log.tag('HeadDedupTransformer');
  }

  transform(tree) {
    const html = firstChildByTag(tree, 'html');
    if (!html) return;

    const head = firstChildByTag(html, 'head');
    if (!head) return;

    // build a map of all potential duplicates
    const matches = new Map();
    for (const child of head.children) {
      const dedupRule = this.getDedupRule(child);
      if (dedupRule) {
        const existingMatches = matches.get(dedupRule) || [];
        existingMatches.push(child);
        matches.set(dedupRule, existingMatches);
      }
    }
    // remove duplicates
    matches.forEach((matches) => {
      matches.slice(1).forEach((node) => {
        remove(node);
      });
    });
  }

  getDedupRule(node) {
    for (const [key, value] of Object.entries(TAGS_TO_DEDUP)) {
      if (node.tagName === key) {
        return this.matchAttributes(node, value) ? value : null;
      }
    }
    return null;
  }

  matchAttributes(node, obj) {
    for (const [key, value] of Object.entries(obj)) {
      if (node.attribs[key] !== value) {
        return false;
      }
    }
    return true;
  }
}

module.exports = HeadDedupTransformer;
```