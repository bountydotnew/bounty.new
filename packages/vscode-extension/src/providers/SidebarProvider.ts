import * as vscode from 'vscode';
import { BountyService } from '../services/BountyService';
import { AuthService } from '../services/AuthService';
import type { WebviewMessage, FetchBountiesParams } from '../types';
import { getNonce } from '../utils/webview';
import { API_CONFIG } from '../constants';

export class SidebarProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private bountyService: BountyService;
	private authService: AuthService;

	constructor(
		private readonly _extensionUri: vscode.Uri,
		private readonly context: vscode.ExtensionContext
	) {
		this.authService = new AuthService(context);
		this.bountyService = new BountyService(() => this.authService.getAuthHeader());
	}

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		_context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken
	): void {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		this.renderView(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(
			async (data: WebviewMessage) => this.handleMessage(data, webviewView.webview)
		);
	}

	public revive(panel: vscode.WebviewView): void {
		this._view = panel;
	}

	public refresh(): void {
		if (this._view) {
			this.renderView(this._view.webview);
		}
	}

	private async renderView(webview: vscode.Webview): Promise<void> {
		const isAuthenticated = await this.authService.isAuthenticated();
		
		if (isAuthenticated) {
			webview.html = this._getAuthenticatedHtml(webview);
			this.handleFetchBounties(webview, {});
		} else {
			webview.html = this._getLoginHtml(webview);
		}
	}

	private async handleMessage(
		message: WebviewMessage,
		webview: vscode.Webview
	): Promise<void> {
		try {
			switch (message.type) {
				case 'login':
					await this.handleLogin(webview);
					break;

				case 'logout':
					await this.handleLogout(webview);
					break;

				case 'fetchBounties':
					await this.handleFetchBounties(webview, message.params as FetchBountiesParams);
					break;

				case 'openBounty':
					await this.handleOpenBounty(message.bountyId as string);
					break;

				case 'refresh':
					this.refresh();
					break;

				default:
					console.warn('[SidebarProvider] Unknown message type:', message.type);
			}
		} catch (error) {
			console.error('[SidebarProvider] Error handling message:', error);
			webview.postMessage({
				type: 'error',
				message: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	private async handleLogin(webview: vscode.Webview): Promise<void> {
		webview.postMessage({ type: 'loginStarted' });

		const result = await this.authService.initiateDeviceFlow();

		if (result.success) {
			this.renderView(webview);
		} else {
			webview.postMessage({
				type: 'loginError',
				message: result.error || 'Authentication failed',
			});
		}
	}

	private async handleLogout(webview: vscode.Webview): Promise<void> {
		await this.authService.clearSession();
		this.renderView(webview);
		vscode.window.showInformationMessage('Logged out successfully');
	}

	private async handleFetchBounties(
		webview: vscode.Webview,
		params: FetchBountiesParams
	): Promise<void> {
		try {
			const bounties = await this.bountyService.fetchBounties(params);
			
			webview.postMessage({
				type: 'bountiesLoaded',
				bounties,
			});
		} catch (error) {
			webview.postMessage({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to fetch bounties',
			});
		}
	}

	private async handleOpenBounty(bountyId: string): Promise<void> {
		const url = `${API_CONFIG.deviceAuthUrl.replace('/device', '')}/bounty/${bountyId}`;
		await vscode.env.openExternal(vscode.Uri.parse(url));
	}

	private _getLoginHtml(webview: vscode.Webview): string {
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'bounty.css')
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>Bounty - Login</title>
			</head>
			<body>
				<div class="login-container fade-in">
					<div class="logo-container">
						<svg fill="none" stroke="currentColor" stroke-width="21.3696" viewBox="0 0 153 179" xmlns="http://www.w3.org/2000/svg">
							<path d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179" />
						</svg>
					</div>
					
					<h1 class="login-title">Welcome to Bounty</h1>
					<p class="login-subtitle">Connect your bounty.new account to browse and manage bounties directly from VS Code</p>
					
					<button class="button button-primary" id="login-btn">
						Connect to bounty.new
					</button>
					
					<div id="login-status" class="hidden"></div>
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

	private _getAuthenticatedHtml(webview: vscode.Webview): string {
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'bounty.css')
		);
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>Bounty</title>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1 class="header-title">Bounties</h1>
						<div class="header-actions">
							<button class="button button-ghost" id="refresh-btn" title="Refresh bounties">
								↻
							</button>
							<button class="button button-ghost" id="logout-btn" title="Logout">
								←
							</button>
						</div>
					</div>
					
					<div id="loading" class="loading-container">
						<div class="loading-spinner"></div>
						<p>Loading bounties...</p>
					</div>
					
					<div id="error" class="error-container hidden"></div>
					
					<div id="bounties-container"></div>
				</div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
