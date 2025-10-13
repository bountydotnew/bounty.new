import * as vscode from 'vscode';
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
	private context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
		this.sessionLoaded = this.loadSession();
	}

	private async loadSession(): Promise<void> {
		const sessionData = await this.context.secrets.get(AuthService.STORAGE_KEY);
		console.log('[AuthService] Loading session from storage:', JSON.stringify({
			hasSessionData: Boolean(sessionData),
		}));
		
		if (sessionData) {
			try {
				this.session = JSON.parse(sessionData);
				console.log('[AuthService] Session parsed:', JSON.stringify({
hasAccessToken: Boolean(this.session?.accessToken),
					expiresAt: this.session?.expiresAt,
					isExpired: this.session ? this.session.expiresAt < Date.now() : null,
				}));
				
				if (this.session && this.session.expiresAt < Date.now()) {
					console.warn('[AuthService] Session expired, deleting');
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
			console.log('[AuthService] Requesting device code from:', url);
			
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

			const data = await response.json() as DeviceCodeResponse;
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
				data = responseText ? JSON.parse(responseText) : {} as TokenResponse;
			} catch {
				console.error('[AuthService] Failed to parse token response:', responseText);
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
				return data;
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

			await vscode.env.openExternal(
				vscode.Uri.parse(
					verification_uri_complete ||
						`${API_CONFIG.deviceAuthUrl}?user_code=${user_code}`
				)
			);

			vscode.window.showInformationMessage(
				`Device code: ${user_code}. Opening browser for authorization...`
			);

			return await this.pollUntilAuthorized(device_code, interval);
		} catch (error) {
			console.error('[AuthService] Device flow error:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Authentication failed',
			};
		}
	}

	/**
	 * Normalize the token response into simple outcomes to keep polling logic simple.
	 */
	private evaluateTokenResponse(tokenResponse: TokenResponse): {
		outcome: 'success' | 'continue' | 'slow_down' | 'error';
		message?: string;
		accessToken?: string;
		expiresIn?: number;
	} {
		if (tokenResponse.access_token) {
			return {
				outcome: 'success',
				accessToken: tokenResponse.access_token,
				expiresIn: tokenResponse.expires_in,
			};
		}

		const error = tokenResponse.error;
		if (!error) {
			return { outcome: 'continue' };
		}

			switch (error) {
				case 'authorization_pending':
					return { outcome: 'continue' };
				case 'slow_down':
					return { outcome: 'slow_down' };
				case 'access_denied':
					return { outcome: 'error', message: 'Access denied by user' };
				case 'expired_token':
					return { outcome: 'error', message: 'Device code expired' };
				default:
					return { outcome: 'error', message: tokenResponse.error_description || 'Unknown error' };
			}
	}

	/**
	 * Performs a single poll step and returns next action.
	 */
	private async handlePollStep(
		deviceCode: string,
		currentInterval: number,
	): Promise<{ shouldResolve: boolean; resolveValue?: { success: boolean; error?: string }; newInterval?: number }> {
		const tokenResponse = await this.pollForToken(deviceCode);
		const evalResult = this.evaluateTokenResponse(tokenResponse);

		switch (evalResult.outcome) {
			case 'success': {
				const accessToken = evalResult.accessToken ?? '';
				const expiresIn = evalResult.expiresIn ?? 3600;
				await this.saveSession({
					accessToken,
					expiresAt: Date.now() + expiresIn * 1000,
				});
				vscode.window.showInformationMessage('Successfully authenticated with bounty.new!');
				return { shouldResolve: true, resolveValue: { success: true } };
			}
			case 'slow_down':
				console.log('[AuthService] Slowing down polling');
				return { shouldResolve: false, newInterval: currentInterval + 5 };
			case 'error':
				return { shouldResolve: true, resolveValue: { success: false, error: evalResult.message || 'Unknown error' } };
			case 'continue':
			default:
				return { shouldResolve: false };
		}
	}

	private async pollUntilAuthorized(
		deviceCode: string,
		interval: number
	): Promise<{ success: boolean; error?: string }> {
		let pollingInterval = interval;
		const maxAttempts = 60;
		let attempts = 0;

		return await new Promise((resolve) => {
			const poll = async () => {
				if (attempts++ >= maxAttempts) {
					resolve({ success: false, error: 'Authorization timed out' });
					return;
				}

				try {
					const step = await this.handlePollStep(deviceCode, pollingInterval);
					if (step.shouldResolve) {
						resolve(step.resolveValue ?? { success: false, error: 'Unknown error' });
						return;
					}
					if (typeof step.newInterval === 'number') {
						pollingInterval = step.newInterval;
					}
				} catch (error) {
					console.error('[AuthService] Polling error:', error);
				}

				setTimeout(() => {
					// Ensure poll() can be awaited and unhandled rejections are avoided.
					poll();
				}, pollingInterval * 1000);
			};

			// Start polling asynchronously
			// No need to await here as the promise resolves inside poll()
			poll();
		});
	}

	async getAuthHeader(): Promise<Record<string, string>> {
		await this.sessionLoaded;
		const session = this.getSession();
		
		console.log('[AuthService] getAuthHeader called:', JSON.stringify({
			hasSession: Boolean(session),
			accessToken: session?.accessToken ? `${session.accessToken.substring(0, 20)}...` : 'none',
			expiresAt: session?.expiresAt,
			isExpired: session ? session.expiresAt < Date.now() : null,
			currentTime: Date.now(),
		}));
		
		if (!session) {
			console.warn('[AuthService] No session found, returning empty auth headers');
			return {};
		}
		
		return {
			Authorization: `Bearer ${session.accessToken}`,
		};
	}
}
