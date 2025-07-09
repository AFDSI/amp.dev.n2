```javascript
const {execSync} = require('child_process');

module.exports.version = () => {
  try {
    return execSync('git log -1 --pretty=format:%h ').toString().trim();
  } catch (e) {
    // This method is called from gulpfile.js/deploy.js even if in a
    // non-git context, like the development Docker image
    return 'detached';
  }
};

module.exports.message = () => {
  return execSync('git log -1 --pretty=%B --no-merges').toString().trim();
};

module.exports.user = () => {
  return execSync('git config user.name').toString().trim();
};

module.exports.committerDate = (path) => {
  return execSync(`git log --format=%ai ${path} | tail -1`).toString().trim();
};
```