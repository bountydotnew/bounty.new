import { Octokit } from '@octokit/core';
import { restEndpointMethods } from '@octokit/plugin-rest-endpoint-methods';
import { createAppAuth } from '@octokit/auth-app';
import { sign } from '@octokit/webhooks-methods';
import crypto from 'node:crypto';

const MyOctokit = Octokit.plugin(restEndpointMethods);

// Bot comment templates with branded button
function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Convert PKCS#1 private key to PKCS#8 format
 * GitHub provides PKCS#1 but @octokit/auth-app requires PKCS#8
 */
function convertPkcs1ToPkcs8(pkcs1Key: string): string {
  const keyObject = crypto.createPrivateKey(pkcs1Key);
  return keyObject.export({ type: 'pkcs8', format: 'pem' }).toString();
}

export function createUnfundedBountyComment(
  amount: number,
  bountyId: string,
  currency = 'USD',
  submissionCount = 0
): string {
  const formattedAmount = formatCurrency(amount, currency);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  const buttonUrl = `${baseUrl}/bounty-button.svg`;
  return `

[![bounty.new](${buttonUrl})](${baseUrl}/bounty/${bountyId})

${formattedAmount} • ${submissionCount} submissions

Submit with \`@bountydotnew submit\` in the PR description or \`/submit <PR#>\` on the issue.
Approve with \`/approve <PR#>\` on the issue or \`@bountydotnew approve\` on the PR.
After merge, confirm with \`/merge <PR#>\` or \`@bountydotnew merge\` to release payout.

> **Note:** Funding is required before approvals and payouts.
`;
}

export function createFundedBountyComment(
  bountyId: string,
  submissionCount = 0
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  const buttonUrl = `${baseUrl}/bounty-button.svg`;
  return `

[![bounty.new](${buttonUrl})](${baseUrl}/bounty/${bountyId})

Funded • ${submissionCount} submissions

Submit with \`@bountydotnew submit\` in the PR description or \`/submit <PR#>\` on the issue.
Approve with \`/approve <PR#>\` on the issue or \`@bountydotnew approve\` on the PR.
After merge, confirm with \`/merge <PR#>\` or \`@bountydotnew merge\` to release payout.
`;
}

export function createSubmissionReceivedComment(isFunded: boolean): string {
  return `

Submission received. ${isFunded ? 'The bounty is funded and ready for review.' : "This bounty isn't funded yet; submissions stay pending until funded."}

`;
}

export function createSubmissionWithdrawnComment(): string {
  return `

Submission withdrawn.

`;
}

export function createBountyCompletedComment(amount: number, currency = 'USD'): string {
  const formattedAmount = formatCurrency(amount, currency);
  return `

Bounty completed! Payment of ${formattedAmount} released.

`;
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
      type: 'installation',
      installationId,
    });

    return token;
  }

  /**
   * Get an octokit instance authenticated for a specific installation
   */
  async getInstallationOctokit(installationId: number): Promise<InstanceType<typeof MyOctokit>> {
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
      type: 'app',
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
    body: string
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
    body: string
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
   * Add a reaction to an issue comment
   */
  async createReaction(
    installationId: number,
    owner: string,
    repo: string,
    commentId: number,
    reaction: '+1' | '-1' | 'laugh' | 'hooray' | 'confused' | 'heart' | 'rocket' | 'eyes' = 'eyes'
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
    username: string
  ): Promise<'admin' | 'maintain' | 'write' | null> {
    const octokit = await this.getInstallationOctokit(installationId);

    try {
      const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
        owner,
        repo,
        username,
      });
      return data.permission as 'admin' | 'maintain' | 'write' | null;
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
    commentId: number
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
    issueNumber: number
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
        login: data.user?.login || '',
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
    prNumber: number
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
        login: data.user?.login || '',
        id: data.user?.id || 0,
      },
      body: data.body ?? null,
      head: { sha: data.head.sha, repoFullName: data.head.repo?.full_name ?? null },
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

    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation();

    return {
      repositories: data.repositories.map((r: {
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
      })),
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

    const account = data.account as { login?: string; type?: string; avatar_url?: string } | null;
    
    return {
      id: data.id,
      account: {
        login: account?.login || '',
        type: account?.type || '',
        avatar_url: account?.avatar_url || '',
      },
      suspended_at: data.suspended_at,
    };
  }

  /**
   * Verify webhook signature
   */
  async verifyWebhookSignature(
    signature: string,
    payload: string
  ): Promise<boolean> {
    try {
      const expectedSignature = await sign(
        this.config.webhookSecret,
        payload
      );

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
    const baseUrl = 'https://github.com/apps/bountydotnew/installations/new';
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
      throw new Error('Missing GitHub App configuration: GITHUB_APP_ID is required');
    }
    if (!privateKey) {
      throw new Error('Missing GitHub App configuration: GITHUB_APP_PRIVATE_KEY is required');
    }
    if (!webhookSecret) {
      throw new Error('Missing GitHub App configuration: GITHUB_WEBHOOK_SECRET is required');
    }

    // Convert private key from base64 if stored that way
    const isPemFormat = privateKey.includes('BEGIN RSA PRIVATE KEY');
    const decodedPrivateKey = isPemFormat
      ? privateKey
      : Buffer.from(privateKey, 'base64').toString('utf-8');

    githubAppManager = new GithubAppManager({
      appId,
      privateKey: decodedPrivateKey,
      webhookSecret,
    });
  }

  return githubAppManager;
}
