/**
 * GitHub App manager for Convex actions.
 *
 * Wraps Octokit to provide authenticated GitHub App API calls.
 * Used by the webhook handler and GitHub-related actions.
 *
 * Env vars required:
 * - GITHUB_APP_ID
 * - GITHUB_APP_PRIVATE_KEY (base64-encoded PEM)
 * - GITHUB_WEBHOOK_SECRET
 */

type OctokitInstance = any;

let _cachedOctokit: {
  Octokit: any;
  createAppAuth: any;
  restEndpointMethods: any;
  sign: any;
} | null = null;

async function getOctokitModules() {
  if (_cachedOctokit) return _cachedOctokit;
  const { Octokit } = await import('@octokit/core');
  const { createAppAuth } = await import('@octokit/auth-app');
  const { restEndpointMethods } = await import(
    '@octokit/plugin-rest-endpoint-methods'
  );
  _cachedOctokit = { Octokit, createAppAuth, restEndpointMethods, sign: null };
  return _cachedOctokit;
}

function getPrivateKey(): string {
  const raw = process.env.GITHUB_APP_PRIVATE_KEY!;
  // Decode base64 using atob (available in Convex runtime, no Node Buffer needed)
  return atob(raw);
}

async function getInstallationOctokit(
  installationId: number
): Promise<OctokitInstance> {
  const { Octokit, createAppAuth, restEndpointMethods } =
    await getOctokitModules();
  const OctokitWithRest = Octokit.plugin(restEndpointMethods);
  return new OctokitWithRest({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: getPrivateKey(),
      installationId,
    },
  });
}

async function getAppOctokit(): Promise<OctokitInstance> {
  const { Octokit, createAppAuth, restEndpointMethods } =
    await getOctokitModules();
  const OctokitWithRest = Octokit.plugin(restEndpointMethods);
  return new OctokitWithRest({
    authStrategy: createAppAuth,
    auth: {
      appId: process.env.GITHUB_APP_ID!,
      privateKey: getPrivateKey(),
    },
  });
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

export async function verifyWebhookSignature(
  signature: string,
  payload: string
): Promise<boolean> {
  const secret = process.env.GITHUB_WEBHOOK_SECRET!;

  // Compute HMAC-SHA256 using Web Crypto API (available in Convex runtime)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = `sha256=${Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')}`;

  // Constant-time comparison
  if (signature.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < signature.length; i++) {
    diff |= signature.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}

// ---------------------------------------------------------------------------
// Issue & PR operations
// ---------------------------------------------------------------------------

export async function createIssueComment(
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
): Promise<{ id: number; html_url: string }> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body,
  });
  return { id: data.id, html_url: data.html_url };
}

export async function editComment(
  installationId: number,
  owner: string,
  repo: string,
  commentId: number,
  body: string
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  await octokit.rest.issues.updateComment({
    owner,
    repo,
    comment_id: commentId,
    body,
  });
}

export async function deleteComment(
  installationId: number,
  owner: string,
  repo: string,
  commentId: number
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  await octokit.rest.issues.deleteComment({
    owner,
    repo,
    comment_id: commentId,
  });
}

export async function createReaction(
  installationId: number,
  owner: string,
  repo: string,
  commentId: number,
  content = 'eyes'
): Promise<void> {
  const octokit = await getInstallationOctokit(installationId);
  await octokit.rest.reactions.createForIssueComment({
    owner,
    repo,
    comment_id: commentId,
    content,
  });
}

export async function getUserPermission(
  installationId: number,
  owner: string,
  repo: string,
  username: string
): Promise<string | null> {
  try {
    const octokit = await getInstallationOctokit(installationId);
    const { data } = await octokit.rest.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username,
    });
    return data.permission;
  } catch {
    return null;
  }
}

export async function getPullRequest(
  installationId: number,
  owner: string,
  repo: string,
  prNumber: number
): Promise<any> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
  });
  return data;
}

export async function getIssue(
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number
): Promise<any> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });
  return data;
}

export async function getComment(
  installationId: number,
  owner: string,
  repo: string,
  commentId: number
): Promise<any> {
  try {
    const octokit = await getInstallationOctokit(installationId);
    const { data } = await octokit.rest.issues.getComment({
      owner,
      repo,
      comment_id: commentId,
    });
    return data;
  } catch {
    return null;
  }
}

export async function getInstallationRepositories(
  installationId: number
): Promise<any[]> {
  const octokit = await getInstallationOctokit(installationId);
  const { data } = await octokit.rest.apps.listReposAccessibleToInstallation({
    per_page: 100,
  });
  return data.repositories;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function isMaintainerPermission(permission: string | null): boolean {
  return ['admin', 'maintain', 'write'].includes(permission ?? '');
}
