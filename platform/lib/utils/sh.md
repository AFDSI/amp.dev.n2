```javascript
'use strict';

require('module-alias/register');
const {spawn} = require('child_process');
const {ROOT} = require('@lib/utils/project').paths;

const DEFAULT_OPTIONS = {
  workingDir: ROOT,
  quiet: false,
};

/**
 * Executes a shell command.
 *
 * @param commandLine the command string, or array of command and argument parts (useful if arguments have spaces).
 * @param {string=''} an optional message being displayed after the command has
 * terminated succesfully.
 * @param {Object=DEFAULT_OPTIONS} an optional object extending the default options
 */
function sh(commandLine, ...options) {
  let message = '';
  const opts = extractOptions(options);
  if (isString(options[0])) {
    message = options[0];
  }

  const fragments = extractCommandFragments(commandLine);
  const command = fragments[0];
  const args = fragments.splice(1);

  console.log(`$ ${command} ${args.join(' ')}`);
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {cwd: opts.workingDir});
    let result = '';

    process.stdout.on('data', (data) => {
      data = data.toString();
      result += data;
      if (!opts.quiet) {
        console.log(data);
      }
    });

    process.stderr.on('data', (data) => {
      console.log(`${data.toString()}`);
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`${command} process exited with code ${code}`));
        return;
      }
      resolve(result);
    });
  }).then((result) => {
    console.log(message);
    return result;
  });
}

function extractOptions(params) {
  if (isString(params[0])) {
    return Object.assign({}, DEFAULT_OPTIONS, params[1] || {});
  }

  return Object.assign({}, DEFAULT_OPTIONS, params[0] || {});
}

function extractCommandFragments(command) {
  if (typeof command === 'string') {
    return command.replace(/\s+/gm, ' ').trim().split(' ');
  }
  return command;
}

function isString(obj) {
  return obj && obj.length > 0 && typeof obj[0] === 'string';
}

module.exports = {
  sh,
  extractCommandFragments,
};
```