// Change this to your local dev URL when testing device auth locally
const USE_LOCAL_DEV = true;
const PROD_BASE = 'https://www.bounty.new';
const LOCAL_BASE = 'http://localhost:3000';

const BASE_URL = USE_LOCAL_DEV ? LOCAL_BASE : PROD_BASE;

export const API_CONFIG = {
	baseUrl: `${BASE_URL}/api/trpc`,
	authBaseUrl: `${BASE_URL}/api/auth`,
	deviceAuthUrl: `${BASE_URL}/device`,
	headers: {
		accept: '*/*',
		'content-type': 'application/json',
	},
} as const;

export const EXTENSION_CONFIG = {
	sidebarViewId: 'bounty.sidebarView',
	loginCommandId: 'bounty-vscode.login',
	logoutCommandId: 'bounty-vscode.logout',
	refreshCommandId: 'bounty-vscode.refresh',
} as const;

export const DEFAULT_FETCH_PARAMS = {
	page: 1,
	limit: 20,
} as const;
