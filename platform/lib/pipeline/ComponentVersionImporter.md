```javascript
const {GitHubImporter} = require('./gitHubImporter');
const {COMPONENT_VERSIONS, COMPONENT_VERSIONS_STATIC} =
  require('@lib/utils/project.js').paths;
const {writeFile} = require('fs').promises;
const validatorRulesProvider = require('@ampproject/toolbox-validator-rules');

class ComponentVersionImporter {
  constructor(githubImporter = new GitHubImporter()) {
    this.githubImporter_ = githubImporter;
  }

  async run() {
    const validatorRules = await validatorRulesProvider.fetch();
    const storyTags = validatorRules.raw.tags.filter((tag) => {
      return tag.tagName.toLowerCase().startsWith('amp-story-');
    });
    const componentInfo = JSON.parse(
      await this.githubImporter_.fetchFile(
        '/build-system/compile/bundles.config.extensions.json'
      )
    );
    const latestComponentVersions = {};
    for (const component of componentInfo) {
      latestComponentVersions[component.name] = component.latestVersion;
      if (component.name === 'amp-story') {
        for (const storyTag of storyTags) {
          const storyTagName = storyTag.tagName.toLowerCase();
          latestComponentVersions[storyTagName] = component.latestVersion;
        }
      }
    }
    const contents = JSON.stringify(latestComponentVersions, null, 2);
    // required by grow and express
    await writeFile(COMPONENT_VERSIONS, contents, 'utf-8');
    // required by playground
    await writeFile(COMPONENT_VERSIONS_STATIC, contents, 'utf-8');
    return latestComponentVersions;
  }
}

// If not required, run directly
if (!module.parent) {
  new ComponentVersionImporter().run();
}

module.exports = ComponentVersionImporter;
```