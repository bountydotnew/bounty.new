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

				case 'fetchBountyDetail':
					await this.handleFetchBountyDetail(webview, message.bountyId as string);
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

	private async handleFetchBountyDetail(
		webview: vscode.Webview,
		bountyId: string
	): Promise<void> {
		try {
			const bountyDetail = await this.bountyService.fetchBountyById(bountyId);
			
			webview.postMessage({
				type: 'bountyDetailLoaded',
				bountyDetail,
			});
		} catch (error) {
			webview.postMessage({
				type: 'error',
				message: error instanceof Error ? error.message : 'Failed to fetch bounty details',
			});
		}
	}

	private async handleOpenBounty(bountyId: string): Promise<void> {
		const url = `${API_CONFIG.deviceAuthUrl.replace('/device', '')}/bounty/${bountyId}`;
		await vscode.env.openExternal(vscode.Uri.parse(url));
	}

	private _getLoginHtml(webview: vscode.Webview): string {
		return this._getReactHtml(webview, false);
	}

	private _getAuthenticatedHtml(webview: vscode.Webview): string {
		return this._getReactHtml(webview, true);
	}

	private _getReactHtml(webview: vscode.Webview, isAuthenticated: boolean): string {
		const scriptUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'dist', 'index.js')
		);
		const styleUri = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'dist', 'index.css')
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; img-src ${webview.cspSource} https: data:; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>Bounty</title>
			</head>
			<body>
				<div id="root" data-authenticated="${isAuthenticated}"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}
