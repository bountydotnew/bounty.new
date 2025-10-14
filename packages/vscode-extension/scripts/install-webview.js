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
	if (execPath.endsWith('npm-cli.js')) {
		command = process.execPath;
		args = [execPath, ...args];
	} else {
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
