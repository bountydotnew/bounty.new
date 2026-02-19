import { Octokit } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { createAppAuth } from "@octokit/auth-app";
import { sign } from "@octokit/webhooks-methods";
import crypto from "node:crypto";
// Bot comments are now centralized in bot-comments.ts
export * from "@bounty/api/src/lib/bot-comments";

const MyOctokit = Octokit.plugin(restEndpointMethods);

/**
 * Decode base64-encoded private key
 */
function decodePrivateKey(privateKey: string): string {
	const hasBeginMarker = privateKey.includes("BEGIN");
	const hasPrivateKeyMarker = privateKey.includes("PRIVATE KEY");

	// Check if already PEM format (shouldn't be, but handle gracefully)
	if (hasBeginMarker && hasPrivateKeyMarker) {
		throw new Error(
			"Private key appears to be in PEM format. Please base64 encode it first. " +
				"Run: cat private-key.pem | base64",
		);
	}

	try {
		const decoded = Buffer.from(privateKey, "base64").toString("utf-8");

		// Validate it's actually a PEM key after decoding
		const hasBegin = decoded.includes("BEGIN");
		const hasPrivateKey = decoded.includes("PRIVATE KEY");
		const isValidPem = hasBegin && hasPrivateKey;
		if (!isValidPem) {
			throw new Error(
				"Invalid private key format. Expected base64-encoded PEM key. " +
					"If you have a PEM file, encode it with: cat private-key.pem | base64",
			);
		}

		return decoded;
	} catch (error) {
		const isInvalidFormatError =
			error instanceof Error && error.message.includes("Invalid private key");
		if (isInvalidFormatError) {
			throw error;
		}
		const errorMessage =
			error instanceof Error ? error.message : "Invalid base64 format";
		throw new Error(
			`Failed to decode private key: ${errorMessage}. ` +
				"Ensure GITHUB_APP_PRIVATE_KEY is base64-encoded.",
		);
	}
}

/**
 * Convert PKCS#1 private key to PKCS#8 format
 * GitHub provides PKCS#1 but @octokit/auth-app requires PKCS#8
 */
function convertPkcs1ToPkcs8(pkcs1Key: string): string {
	try {
		const keyObject = crypto.createPrivateKey(pkcs1Key);
		return keyObject.export({ type: "pkcs8", format: "pem" }).toString();
	} catch (error) {
		throw new Error(
			`Failed to parse private key: ${error instanceof Error ? error.message : "Unknown error"}. ` +
				"Ensure GITHUB_APP_PRIVATE_KEY is a valid base64-encoded PEM key.",
		);
	}
}

export interface GitHubAppConfig {
	appId: string;
	privateKey: string;
	webhookSecret: string;
}

export class GithubAppManager {
	private config: GitHubAppConfig;

	constructor(config: GitHubAppConfig) {
		// Convert PKCS#1 to PKCS#8 for @octokit/auth-app compatibility
		const pkcs8Key = convertPkcs1ToPkcs8(config.privateKey);
		this.config = { ...config, privateKey: pkcs8Key };
	}

	/**
	 * Get an installation access token for a specific installation
	 */
	async getInstallationAccessToken(installationId: number): Promise<string> {
		const auth = createAppAuth({
			appId: this.config.appId,
			privateKey: this.config.privateKey,
		});

		const { token } = await auth({
			type: "installation",
			installationId,
		});

		return token;
	}

	/**
	 * Get an octokit instance authenticated for a specific installation
	 */
	async getInstallationOctokit(
		installationId: number,
	): Promise<InstanceType<typeof MyOctokit>> {
		const token = await this.getInstallationAccessToken(installationId);
		return new MyOctokit({ auth: token });
	}

	/**
	 * Get an octokit instance authenticated as the GitHub App (JWT auth)
	 * Used for app-level operations like getting installation info
	 */
	async getAppOctokit(): Promise<InstanceType<typeof MyOctokit>> {
		const auth = createAppAuth({
			appId: this.config.appId,
			privateKey: this.config.privateKey,
		});

		const { token } = await auth({
			type: "app",
		});

		return new MyOctokit({ auth: token });
	}

	/**
	 * Create a comment on an issue
	 */
	async createIssueComment(
		installationId: number,
		owner: string,
		repo: string,
		issueNumber: number,
		body: string,
	): Promise<{ id: number; html_url: string }> {
		const octokit = await this.getInstallationOctokit(installationId);

		const { data } = await octokit.rest.issues.createComment({
			owner,
			repo,
			issue_number: issueNumber,
			body,
		});

		return {
			id: data.id,
			html_url: data.html_url,
		};
	}

	/**
	 * Edit an existing comment
	 */
	async editComment(
		installationId: number,
		owner: string,
		repo: string,
		commentId: number,
		body: string,
	): Promise<void> {
		const octokit = await this.getInstallationOctokit(installationId);

		await octokit.rest.issues.updateComment({
			owner,
			repo,
			comment_id: commentId,
			body,
		});
	}

	/**
	 * Get a single comment by ID
	 */
	async getComment(
		installationId: number,
		owner: string,
		repo: string,
		commentId: number,
	): Promise<{ id: number; body: string | null } | null> {
		const octokit = await this.getInstallationOctokit(installationId);

		try {
			const response = await octokit.rest.issues.getComment({
				owner,
				repo,
				comment_id: commentId,
			});

			return {
				id: response.data.id,
				body: response.data.body ?? null,
			};
		} catch (error) {
			console.error("Failed to fetch GitHub comment:", error);
			return null;
		}
	}

	/**
	 * Add a reaction to an issue comment
	 */
	async createReaction(
		installationId: number,
		owner: string,
		repo: string,
		commentId: number,
		reaction:
			| "+1"
			| "-1"
			| "laugh"
			| "hooray"
			| "confused"
			| "heart"
			| "rocket"
			| "eyes" = "eyes",
	): Promise<void> {
		const octokit = await this.getInstallationOctokit(installationId);

		await octokit.rest.reactions.createForIssueComment({
			owner,
			repo,
			comment_id: commentId,
			content: reaction,
		});
	}

	/**
	 * Check if a user has write access to a repository
	 * Returns the user's permission level: 'admin', 'maintain', 'write', or null
	 */
	async getUserPermission(
		installationId: number,
		owner: string,
		repo: string,
		username: string,
	): Promise<"admin" | "maintain" | "write" | null> {
		const octokit = await this.getInstallationOctokit(installationId);

		try {
			const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
				owner,
				repo,
				username,
			});
			return data.permission as "admin" | "maintain" | "write" | null;
		} catch {
			return null;
		}
	}

	/**
	 * Delete a comment
	 */
	async deleteComment(
		installationId: number,
		owner: string,
		repo: string,
		commentId: number,
	): Promise<void> {
		const octokit = await this.getInstallationOctokit(installationId);

		await octokit.rest.issues.deleteComment({
			owner,
			repo,
			comment_id: commentId,
		});
	}

	/**
	 * Get issue details
	 */
	async getIssue(
		installationId: number,
		owner: string,
		repo: string,
		issueNumber: number,
	): Promise<{
		id: number;
		number: number;
		title: string;
		state: string;
		html_url: string;
		user: { login: string; id: number };
		body: string | null;
	}> {
		const octokit = await this.getInstallationOctokit(installationId);

		const { data } = await octokit.rest.issues.get({
			owner,
			repo,
			issue_number: issueNumber,
		});

		return {
			id: data.id,
			number: data.number,
			title: data.title,
			state: data.state,
			html_url: data.html_url,
			user: {
				login: data.user?.login || "",
				id: data.user?.id || 0,
			},
			body: data.body ?? null,
		};
	}

	/**
	 * Create an issue on GitHub
	 */
	async createIssue(
		installationId: number,
		owner: string,
		repo: string,
		title: string,
		body: string,
		labels?: string[],
	): Promise<{
		id: number;
		number: number;
		title: string;
		state: string;
		html_url: string;
		user: { login: string; id: number };
		body: string | null;
	}> {
		const octokit = await this.getInstallationOctokit(installationId);

		const { data } = await octokit.rest.issues.create({
			owner,
			repo,
			title,
			body,
			labels: labels || [],
		});

		return {
			id: data.id,
			number: data.number,
			title: data.title,
			state: data.state,
			html_url: data.html_url,
			user: {
				login: data.user?.login || "",
				id: data.user?.id || 0,
			},
			body: data.body ?? null,
		};
	}

	/**
	 * Get pull request details
	 */
	async getPullRequest(
		installationId: number,
		owner: string,
		repo: string,
		prNumber: number,
	): Promise<{
		id: number;
		number: number;
		title: string;
		state: string;
		html_url: string;
		user: { login: string; id: number };
		body: string | null;
		head: { sha: string; repoFullName?: string | null };
		merged: boolean;
		merged_at: string | null;
	}> {
		const octokit = await this.getInstallationOctokit(installationId);

		const { data } = await octokit.rest.pulls.get({
			owner,
			repo,
			pull_number: prNumber,
		});

		return {
			id: data.id,
			number: data.number,
			title: data.title,
			state: data.state,
			html_url: data.html_url,
			user: {
				login: data.user?.login || "",
				id: data.user?.id || 0,
			},
			body: data.body ?? null,
			head: {
				sha: data.head.sha,
				repoFullName: data.head.repo?.full_name ?? null,
			},
			merged: data.merged,
			merged_at: data.merged_at,
		};
	}

	/**
	 * Get repositories for an installation
	 */
	async getInstallationRepositories(installationId: number): Promise<{
		repositories: Array<{
			id: number;
			name: string;
			full_name: string;
			private: boolean;
			html_url: string;
			description: string | null;
		}>;
	}> {
		const octokit = await this.getInstallationOctokit(installationId);

		const { data } =
			await octokit.rest.apps.listReposAccessibleToInstallation();

		return {
			repositories: data.repositories.map(
				(r: {
					id: number;
					name: string;
					full_name: string;
					private: boolean;
					html_url: string;
					description: string | null;
				}) => ({
					id: r.id,
					name: r.name,
					full_name: r.full_name,
					private: r.private,
					html_url: r.html_url,
					description: r.description || null,
				}),
			),
		};
	}

	/**
	 * Get installation details
	 */
	async getInstallation(installationId: number): Promise<{
		id: number;
		account: {
			login: string;
			type: string;
			avatar_url: string;
		};
		suspended_at: string | null;
	}> {
		const octokit = await this.getAppOctokit();

		const { data } = await octokit.rest.apps.getInstallation({
			installation_id: installationId,
		});

		const account = data.account as {
			login?: string;
			type?: string;
			avatar_url?: string;
		} | null;

		return {
			id: data.id,
			account: {
				login: account?.login || "",
				type: account?.type || "",
				avatar_url: account?.avatar_url || "",
			},
			suspended_at: data.suspended_at,
		};
	}

	/**
	 * Delete (uninstall) a GitHub App installation.
	 * This revokes the app's access to the account/org on GitHub's side.
	 */
	async deleteInstallation(installationId: number): Promise<void> {
		const octokit = await this.getAppOctokit();

		await octokit.rest.apps.deleteInstallation({
			installation_id: installationId,
		});
	}

	/**
	 * Get installation for a specific repository
	 * Returns the installation object if the app is installed on the repo
	 */
	async getInstallationForRepo(
		owner: string,
		repo: string,
	): Promise<{
		id: number;
		account: {
			login: string;
			type: string;
			avatar_url: string;
		};
		suspended_at: string | null;
	} | null> {
		try {
			const octokit = await this.getAppOctokit();

			const { data } = await octokit.rest.apps.getRepoInstallation({
				owner,
				repo,
			});

			const account = data.account as {
				login?: string;
				type?: string;
				avatar_url?: string;
			} | null;

			return {
				id: data.id,
				account: {
					login: account?.login || "",
					type: account?.type || "",
					avatar_url: account?.avatar_url || "",
				},
				suspended_at: data.suspended_at,
			};
		} catch (error: any) {
			if (error.status === 404) {
				// App not installed on this repo
				return null;
			}
			throw error;
		}
	}

	/**
	 * Verify webhook signature
	 */
	async verifyWebhookSignature(
		signature: string,
		payload: string,
	): Promise<boolean> {
		try {
			const expectedSignature = await sign(this.config.webhookSecret, payload);

			// Compare signatures using timing-safe comparison
			const signatureBuffer = Buffer.from(signature);
			const expectedBuffer = Buffer.from(expectedSignature);

			if (signatureBuffer.length !== expectedBuffer.length) {
				return false;
			}

			// Use Node.js crypto.timingSafeEqual instead of crypto.subtle
			return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
		} catch {
			return false;
		}
	}

	/**
	 * Get app installation URL
	 */
	getInstallationUrl(state?: string): string {
		const baseUrl = `https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new`;
		if (state) {
			return `${baseUrl}?state=${encodeURIComponent(state)}`;
		}
		return baseUrl;
	}
}

// Singleton instance
let githubAppManager: GithubAppManager | null = null;

export function getGithubAppManager(): GithubAppManager {
	if (!githubAppManager) {
		const appId = process.env.GITHUB_APP_ID;
		const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
		const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

		if (!appId) {
			throw new Error(
				"Missing GitHub App configuration: GITHUB_APP_ID is required",
			);
		}
		if (!privateKey) {
			throw new Error(
				"Missing GitHub App configuration: GITHUB_APP_PRIVATE_KEY is required",
			);
		}
		if (!webhookSecret) {
			throw new Error(
				"Missing GitHub App configuration: GITHUB_WEBHOOK_SECRET is required",
			);
		}

		// Decode base64-encoded private key
		const decodedPrivateKey = decodePrivateKey(privateKey);

		githubAppManager = new GithubAppManager({
			appId,
			privateKey: decodedPrivateKey,
			webhookSecret,
		});
	}

	return githubAppManager;
}
