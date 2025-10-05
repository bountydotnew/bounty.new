import { window, env, Uri, type ExtensionContext } from 'vscode';
import { API_CONFIG } from '../constants';

interface DeviceCodeResponse {
	device_code: string;
	user_code: string;
	verification_uri: string;
	verification_uri_complete?: string;
	expires_in: number;
	interval: number;
}

interface TokenResponse {
	access_token?: string;
	token_type?: string;
	expires_in?: number;
	error?: string;
	error_description?: string;
}

interface Session {
	accessToken: string;
	expiresAt: number;
}

export class AuthService {
	private static readonly STORAGE_KEY = 'bounty_session';
	private static readonly CLIENT_ID = 'vscode-extension';
	private session: Session | null = null;
	private sessionLoaded: Promise<void>;
	private context: ExtensionContext;

	constructor(context: ExtensionContext) {
		this.context = context;
		this.sessionLoaded = this.loadSession();
	}

	private async loadSession(): Promise<void> {
		const sessionData = await this.context.secrets.get(AuthService.STORAGE_KEY);
		
		if (sessionData) {
			try {
				this.session = JSON.parse(sessionData);
				
				if (this.session && this.session.expiresAt < Date.now()) {
					this.session = null;
					await this.context.secrets.delete(AuthService.STORAGE_KEY);
				}
			} catch (error) {
				console.error('[AuthService] Failed to parse session:', error);
			}
		} else {
			console.log('[AuthService] No session data in storage');
		}
	}

	async saveSession(session: Session): Promise<void> {
		this.session = session;
		await this.context.secrets.store(
			AuthService.STORAGE_KEY,
			JSON.stringify(session)
		);
		console.log('[AuthService] Session saved:', JSON.stringify({
			accessToken: `${session.accessToken.substring(0, 20)}...`,
			expiresAt: session.expiresAt,
			expiresIn: `${Math.floor((session.expiresAt - Date.now()) / 1000)}s`,
		}));
	}

	async clearSession(): Promise<void> {
		this.session = null;
		await this.context.secrets.delete(AuthService.STORAGE_KEY);
	}

	getSession(): Session | null {
		if (this.session && this.session.expiresAt < Date.now()) {
			this.clearSession();
			return null;
		}
		return this.session;
	}

	async isAuthenticated(): Promise<boolean> {
		await this.sessionLoaded;
		return this.getSession() !== null;
	}

	async requestDeviceCode(): Promise<DeviceCodeResponse> {
		try {
			const url = `${API_CONFIG.authBaseUrl}/device/code`;
			
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					client_id: AuthService.CLIENT_ID,
					scope: 'openid profile email',
				}),
			});

			if (!response.ok) {
				let errorDetails = '';
				try {
					const errorText = await response.text();
					try {
						const errorData = JSON.parse(errorText);
						errorDetails = JSON.stringify(errorData);
					} catch {
						errorDetails = errorText;
					}
				} catch {
					errorDetails = 'Failed to read error response';
				}
				console.error('[AuthService] Device code request failed:', {
					status: response.status,
					statusText: response.statusText,
					url,
					error: errorDetails,
				});
				throw new Error(
					`Device code request failed (${response.status} ${response.statusText})${errorDetails ? `: ${errorDetails}` : ''}`
				);
			}

			const data = (await response.json()) as DeviceCodeResponse;
			console.log('[AuthService] Device code received:', {
				user_code: data.user_code,
				expires_in: data.expires_in,
			});
			return data;
		} catch (error) {
			if (error instanceof Error && error.message.includes('fetch')) {
				console.error('[AuthService] Network error:', error);
				throw new Error(`Network error: Cannot reach ${API_CONFIG.authBaseUrl}. Check your connection.`);
			}
			throw error;
		}
	}

	async pollForToken(
		deviceCode: string,
		// interval = 5
	): Promise<TokenResponse> {
		try {
			const url = `${API_CONFIG.authBaseUrl}/device/token`;
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
					device_code: deviceCode,
					client_id: AuthService.CLIENT_ID,
				}),
			});

			const responseText = await response.text();
			let data: TokenResponse;
			
			try {
				data = responseText ? JSON.parse(responseText) : {};
			} catch {
				window.showWarningMessage('[AuthService] Failed to parse token response:', responseText);
				data = {
					error: 'invalid_response',
					error_description: 'Server returned invalid JSON',
				};
			}
			
			if (!response.ok) {
				console.error('[AuthService] Token poll failed:', {
					status: response.status,
					statusText: response.statusText,
					data,
				});
			}
			
			return data;
		} catch (error) {
			console.error('[AuthService] Polling network error:', error);
			return {
				error: 'network_error',
				error_description: 'Cannot reach authorization server',
			};
		}
	}

	async initiateDeviceFlow(): Promise<{ success: boolean; error?: string }> {
		try {
			const deviceCodeData = await this.requestDeviceCode();
			const { device_code, user_code, verification_uri_complete, interval } =
				deviceCodeData;

			const authUrl = verification_uri_complete || `${API_CONFIG.deviceAuthUrl}?user_code=${user_code}`;
			await env.openExternal(Uri.parse(authUrl));

			window.showInformationMessage(
				`Device code: ${user_code}. Opening browser for authorization...`
			);

			return this.pollUntilAuthorized(device_code, interval);
		} catch (error) {
			console.error('[AuthService] Device flow error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication failed',
			};
		}
	}

	private async pollUntilAuthorized(
		deviceCode: string,
		interval: number
	): Promise<{ success: boolean; error?: string }> {
		let pollingInterval = interval;
		const maxAttempts = 60;
		let attempts = 0;

		return new Promise((resolve) => {
			const poll = async () => {
				if (attempts++ >= maxAttempts) {
					resolve({ success: false, error: 'Authorization timed out' });
					return;
				}

				try {
					const tokenResponse = await this.pollForToken(deviceCode);

					if (tokenResponse.access_token) {
						await this.saveSession({
							accessToken: tokenResponse.access_token,
							expiresAt: Date.now() + (tokenResponse.expires_in || 3600) * 1000,
						});

						window.showInformationMessage(
							'Successfully authenticated with bounty.new!'
						);
						resolve({ success: true });
						return;
					}

					if (tokenResponse.error) {
						switch (tokenResponse.error) {
							case 'authorization_pending':
								break;
							case 'slow_down': {
								pollingInterval += 5;
								console.log('[AuthService] Slowing down polling');
								break;
							}
							case 'access_denied':
								resolve({ success: false, error: 'Access denied by user' });
								return;
							case 'expired_token':
								resolve({ success: false, error: 'Device code expired' });
								return;
							default:
								resolve({
									success: false,
									error: tokenResponse.error_description || 'Unknown error',
								});
								return;
						}
					}
				} catch (error) {
					console.error('[AuthService] Polling error:', error);
				}

				setTimeout(poll, pollingInterval * 1000);
			};

			poll();
		});
	}

	async getAuthHeader(): Promise<Record<string, string>> {
		await this.sessionLoaded;
		const session = this.getSession();
		
		if (!session) {
			console.warn('[AuthService] No session found, returning empty auth headers');
			return {};
		}
		
		return {
			Authorization: `Bearer ${session.accessToken}`,
		};
	}
}
