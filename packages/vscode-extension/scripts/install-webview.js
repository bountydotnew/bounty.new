const { spawnSync } = require('node:child_process');
const path = require('node:path');

const webviewDir = path.join(__dirname, '..', 'webview');
const userAgent = process.env.npm_config_user_agent || '';
const execPath = process.env.npm_execpath;

let command;
let args = ['install'];

if (userAgent.includes('bun')) {
  command = process.platform === 'win32' ? 'bun.cmd' : 'bun';
} else if (execPath) {
  // Check if execPath is a JavaScript file (npm-cli.js, pnpm.cjs, yarn.js, etc.)
  // These need to be executed via Node.js, not directly as commands
  if (execPath.match(/\.(c?js|mjs)$/i)) {
    command = process.execPath; // Use Node.js binary
    args = [execPath, ...args];
  } else {
    // It's a binary executable (e.g., pnpm.exe, yarn.exe on Windows)
    command = execPath;
  }
} else {
  command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

const result = spawnSync(command, args, {
  cwd: webviewDir,
  stdio: 'inherit',
});

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
