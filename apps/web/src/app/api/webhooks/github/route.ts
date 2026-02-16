import {
  db,
  bounty,
  submission,
  user,
  userProfile,
  payout,
  transaction,
  member,
  organization,
} from '@bounty/db';
import { githubInstallation } from '@bounty/db/src/schema/github-installation';
import { account } from '@bounty/db';
import { getGithubAppManager } from '@bounty/api/driver/github-app';
import {
  unfundedBountyComment,
  fundedBountyComment,
  submissionReceivedComment,
  submissionWithdrawnComment,
  bountyCompletedComment,
} from '@bounty/api/src/lib/bot-comments';
import {
  parseBotCommand,
  containsSubmissionKeyword,
  extractSubmissionDescription,
  isValidBountyAmount,
  isValidCurrency,
} from '@bounty/api/src/lib/bot-command-parser';
import { eq, and, count, or } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createTransfer } from '@bounty/stripe';
import {
  withPaymentLock,
  wasOperationPerformed,
  markOperationPerformed,
  PaymentLockError,
} from '@bounty/api/src/lib/payment-lock';

const ISSUE_REFERENCE_PATTERN =
  /(?:fixes|closes|resolves|related to)\s+#?(\d+)/i;

// Issue comment event (action: created/edited/deleted with comment)
type IssueCommentEvent = {
  action: 'created' | 'edited' | 'deleted';
  issue: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: { login: string };
    comments: number;
    pull_request?: Record<string, unknown>;
  };
  repository: { name: string; owner: { login: string } };
  installation: { id: number | null };
  comment: { id: number; user: { login: string }; body: string };
};

// Pull request event
type PullRequestEvent = {
  action: 'opened' | 'closed' | 'reopened';
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: { login: string };
    merged: boolean;
    merged_at: string | null;
    head: { sha: string };
    state: string;
  };
  repository: { name: string; owner: { login: string } };
  installation: { id: number | null };
};

// Installation event
type InstallationEvent = {
  action: 'created' | 'deleted';
  installation: {
    id: number;
    account: { login: string; avatar_url?: string };
    repository_selection: string;
    repositories: Array<{ id: number; name: string; full_name: string }>;
  };
  sender: { id: number; login: string };
};

// Issue edited event (no comment)
type IssueEditedEvent = {
  action: 'edited';
  issue: { number: number; title: string; body: string | null };
  repository: { name: string; owner: { login: string } };
  installation: { id: number | null };
};

// Issue deleted event (no comment)
type IssueDeletedEvent = {
  action: 'deleted';
  issue: { number: number };
  repository: { name: string; owner: { login: string } };
  installation: { id: number | null };
};

type WebhookEvent =
  | IssueCommentEvent
  | PullRequestEvent
  | InstallationEvent
  | IssueEditedEvent
  | IssueDeletedEvent;

// Type for GitHub API pull request response
type GitHubPullRequest = {
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
};

// Type for GitHub API issue response
type GitHubIssue = {
  id: number;
  number: number;
  title: string;
  state: string;
  html_url: string;
  user: { login: string; id: number };
  body: string | null;
};

// Common validation context passed to helper functions
type ValidationContext = {
  installationId: number;
  owner: string;
  repo: string;
  issueNumber: number;
};

// Permission levels that grant write access
const MAINTAINER_PERMISSIONS = ['admin', 'maintain', 'write'] as const;
type MaintainerPermission = (typeof MAINTAINER_PERMISSIONS)[number];

// Payment status checks
const PAYMENT_STATUS_FUNDED = 'held' as const;
const PAYMENT_STATUS_RELEASED = 'released' as const;

function isMaintainerPermission(
  permission: string | null
): permission is MaintainerPermission {
  return (
    permission !== null &&
    MAINTAINER_PERMISSIONS.includes(permission as MaintainerPermission)
  );
}

function isBountyFunded(bounty: { paymentStatus: string | null }): boolean {
  return bounty.paymentStatus === PAYMENT_STATUS_FUNDED;
}

function isBountyReleased(bounty: {
  paymentStatus: string | null;
  stripeTransferId?: string | null;
}): boolean {
  return (
    bounty.paymentStatus === PAYMENT_STATUS_RELEASED ||
    Boolean(bounty.stripeTransferId)
  );
}

// Check if PR references the issue (when not commenting from PR itself)
function prMustReferenceIssue(
  isPrComment: boolean,
  prBody: string | null,
  issueNumber: number
): boolean {
  if (isPrComment) {
    return true; // When commenting on PR, reference is implicit
  }
  return pullRequestReferencesIssue(prBody, issueNumber);
}

// Type for solver with stripe requirements
type SolverWithStripe = {
  stripeConnectAccountId: string;
  stripeConnectOnboardingComplete: boolean;
};

function isSolverReadyForPayout(
  solver:
    | {
        stripeConnectAccountId: string | null;
        stripeConnectOnboardingComplete: boolean | null;
      }
    | undefined
): solver is SolverWithStripe {
  return Boolean(
    solver?.stripeConnectAccountId && solver.stripeConnectOnboardingComplete
  );
}

// Result type for validation functions
type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; handled: true }; // Error was handled (comment posted), caller should return

// Helper to validate PR exists and is from same repo
async function validatePullRequest(
  ctx: ValidationContext,
  prNumber: number
): Promise<ValidationResult<GitHubPullRequest>> {
  const githubApp = getGithubAppManager();

  let pullRequest: GitHubPullRequest;
  try {
    pullRequest = await githubApp.getPullRequest(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      prNumber
    );
  } catch {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `\nI couldn't find PR #${prNumber}. Double‑check the number and try again.\n`
    );
    return { success: false, handled: true };
  }

  // Note: We allow PRs from forks - that's how open source contributions work!
  // The PR already targets this repository (verified by fetching it via our installation)

  return { success: true, data: pullRequest };
}

// Helper to validate bounty exists
async function validateBountyExists(
  ctx: ValidationContext,
  bountyIssueNumber: number
): Promise<ValidationResult<typeof bounty.$inferSelect>> {
  const githubApp = getGithubAppManager();
  const bountyRecord = await findBountyForIssue({
    issueNumber: bountyIssueNumber,
    owner: ctx.owner,
    repo: ctx.repo,
  });

  if (!bountyRecord) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      '\nNo bounty found for this issue.\n'
    );
    return { success: false, handled: true };
  }

  return { success: true, data: bountyRecord };
}

// Helper to check if user has maintainer-level permission
async function checkMaintainerPermission(
  ctx: ValidationContext,
  username: string
): Promise<boolean> {
  const githubApp = getGithubAppManager();
  const permission = await githubApp.getUserPermission(
    ctx.installationId,
    ctx.owner,
    ctx.repo,
    username
  );
  return isMaintainerPermission(permission);
}

// Helper to validate submission exists for a PR
async function validateSubmissionExists(
  ctx: ValidationContext,
  bountyId: string,
  prNumber: number
): Promise<ValidationResult<typeof submission.$inferSelect>> {
  const githubApp = getGithubAppManager();
  const [submissionRecord] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyId),
        eq(submission.githubPullRequestNumber, prNumber)
      )
    )
    .limit(1);

  if (!submissionRecord) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `\nNo submission found for PR #${prNumber}.\n`
    );
    return { success: false, handled: true };
  }

  return { success: true, data: submissionRecord };
}

// Helper to check if PR is valid for submission
function isPrOpenOrMerged(pr: { state: string; merged: boolean }): boolean {
  return pr.state === 'open' || pr.merged;
}

function isPrOpen(pr: { state: string }): boolean {
  return pr.state === 'open';
}

function isBountyAcceptingSubmissions(bounty: { status: string }): boolean {
  return bounty.status !== 'in_progress' && bounty.status !== 'completed';
}

// Helper to resolve bounty issue number for unsubmit command
async function resolveBountyIssueForUnsubmit(
  ctx: ValidationContext,
  isPrComment: boolean,
  pullRequest: GitHubPullRequest,
  targetPrNumber: number
): Promise<number | null> {
  const githubApp = getGithubAppManager();

  if (isPrComment) {
    const linkedIssueNumber = getIssueNumberFromPrBody(pullRequest.body || '');
    if (!linkedIssueNumber) {
      await githubApp.createIssueComment(
        ctx.installationId,
        ctx.owner,
        ctx.repo,
        ctx.issueNumber,
        '\nI couldn\'t tell which issue this PR is for. Add "Fixes #123" to the PR body or unsubmit from the issue with `/unsubmit <PR#>`.\n'
      );
      return null;
    }
    return linkedIssueNumber;
  }

  if (!pullRequestReferencesIssue(pullRequest.body, ctx.issueNumber)) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `\nPR #${targetPrNumber} doesn't reference this issue. Add "Fixes #${ctx.issueNumber}" (or similar) to the PR description and try again.\n`
    );
    return null;
  }

  return ctx.issueNumber;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-hub-signature-256');

    console.log('[GitHub Webhook] Received webhook request');

    if (!signature) {
      console.error('[GitHub Webhook] Missing x-hub-signature-256 header');
      return NextResponse.json(
        { error: 'Missing signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const githubApp = getGithubAppManager();
    const isValid = await githubApp.verifyWebhookSignature(signature, body);

    if (!isValid) {
      console.error('[GitHub Webhook] Signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body) as WebhookEvent;

    // Handle issue_comment events (only process 'created' actions to avoid processing edits/deletes)
    if ('issue' in event && 'comment' in event && event.action === 'created') {
      await handleIssueComment(event);
    }
    // Handle pull_request events
    else if ('pull_request' in event) {
      await handlePullRequest(event);
    }
    // Handle issue edited events
    else if (
      'issue' in event &&
      event.action === 'edited' &&
      !('comment' in event)
    ) {
      await handleIssueEdited(event);
    }
    // Handle issue deleted events
    else if (
      'issue' in event &&
      event.action === 'deleted' &&
      !('comment' in event)
    ) {
      await handleIssueDeleted(event);
    }
    // Handle installation events (must not have issue or pull_request to distinguish from other events)
    else if (
      'sender' in event &&
      'installation' in event &&
      (event.action === 'created' || event.action === 'deleted')
    ) {
      await handleInstallationEvent(event);
    } else {
      console.log('[GitHub Webhook] Unhandled event type');
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[GitHub Webhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

function getIssueNumberFromPrBody(prBody: string | null): number | null {
  if (!prBody) {
    return null;
  }
  const issueMatch = prBody.match(ISSUE_REFERENCE_PATTERN);
  return issueMatch ? Number.parseInt(issueMatch[1], 10) : null;
}

function pullRequestReferencesIssue(
  prBody: string | null,
  issueNumber: number
): boolean {
  if (!prBody) {
    return false;
  }
  const pattern = new RegExp(
    `(?:fixes|closes|resolves|related to)\\s+#?${issueNumber}\\b`,
    'i'
  );
  return pattern.test(prBody);
}

async function findBountyForIssue(params: {
  issueNumber: number;
  owner: string;
  repo: string;
}) {
  const { issueNumber, owner, repo } = params;
  const [bountyRecord] = await db
    .select()
    .from(bounty)
    .where(
      and(
        eq(bounty.githubIssueNumber, issueNumber),
        eq(bounty.githubRepoOwner, owner),
        eq(bounty.githubRepoName, repo)
      )
    )
    .limit(1);
  return bountyRecord;
}

async function findUserByGithubLogin(login: string) {
  const [linkedUser] = await db
    .select({ id: user.id })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(or(eq(user.handle, login), eq(userProfile.githubUsername, login)))
    .limit(1);
  return linkedUser;
}

// Check if user has early access when early access mode is enabled
async function checkEarlyAccessForUser(
  ctx: ValidationContext,
  githubUsername: string
): Promise<{ allowed: boolean; errorMessage?: string }> {
  // Early access mode is disabled, allow everyone
  const isEarlyAccessEnabled =
    process.env.NEXT_PUBLIC_EARLY_ACCESS_ENABLED !== 'false';
  if (!isEarlyAccessEnabled) {
    return { allowed: true };
  }

  // Look up the user by their GitHub username
  const userRecord = await db.query.user.findFirst({
    where: or(
      eq(user.handle, githubUsername),
      eq(userProfile.githubUsername, githubUsername)
    ),
    with: {
      profile: true,
    },
  });

  // If no user found, they don't have early access
  if (!userRecord) {
    return {
      allowed: false,
      errorMessage: `@${githubUsername} bounty.new is currently in early access mode. You need an early access account to use the bot.

Join the waitlist at https://bounty.new to get early access.`,
    };
  }

  const userRole = userRecord.role ?? 'user';

  // Allow early_access and admin roles
  if (userRole === 'early_access' || userRole === 'admin') {
    return { allowed: true };
  }

  // User doesn't have early access
  return {
    allowed: false,
    errorMessage: `@${githubUsername} bounty.new is currently in early access mode. Your account doesn't have early access yet.

Join the waitlist at https://bounty.new to get early access.`,
  };
}

async function handleIssueComment(event: IssueCommentEvent) {
  const { issue, comment, repository, installation } = event;

  console.log(
    `[GitHub Webhook] Issue comment created: ${repository.owner.login}/${repository.name}#${issue.number}`
  );

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  // Ignore comments from the bot itself to avoid infinite loops
  // GitHub bot accounts have '[bot]' in their login name (e.g., 'bountydotnew[bot]')
  if (comment.user.login.includes('[bot]')) {
    console.log('[GitHub Webhook] Ignoring comment from bot');
    return;
  }

  // Parse the comment for bot commands
  const command = parseBotCommand(comment.body);

  if (!command) {
    console.log('[GitHub Webhook] No bot command found');
    return;
  }

  console.log(`[GitHub Webhook] Command found: ${command.action}`);

  // Add eyes reaction to acknowledge the command
  const githubApp = getGithubAppManager();
  try {
    await githubApp.createReaction(
      installation.id,
      repository.owner.login,
      repository.name,
      comment.id,
      'eyes'
    );
  } catch (error) {
    // Don't fail if reaction fails
    console.warn('[GitHub Webhook] Failed to add reaction:', error);
  }

  // Check early access before processing any command
  const ctx: ValidationContext = {
    installationId: installation.id,
    owner: repository.owner.login,
    repo: repository.name,
    issueNumber: issue.number,
  };
  const earlyAccessCheck = await checkEarlyAccessForUser(
    ctx,
    comment.user.login
  );
  if (!earlyAccessCheck.allowed) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      earlyAccessCheck.errorMessage || 'Early access required.'
    );
    return;
  }

  if (command.action === 'create') {
    await handleBountyCreateCommand(event, command);
  } else if (command.action === 'submit') {
    await handleBountySubmitCommand(event, command);
  } else if (command.action === 'unsubmit') {
    await handleBountyUnsubmitCommand(event, command);
  } else if (command.action === 'approve') {
    await handleBountyApproveCommand(event, command);
  } else if (command.action === 'unapprove') {
    await handleBountyUnapproveCommand(event, command);
  } else if (command.action === 'reapprove') {
    await handleBountyReapproveCommand(event, command);
  } else if (command.action === 'merge') {
    await handleBountyMergeCommand(event, command);
  } else if (command.action === 'move') {
    await handleBountyMoveCommand(event, command);
  }
}

async function handleBountyUnsubmitCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'unsubmit' }>
) {
  const { issue, repository, installation, comment } = event;
  console.log('[GitHub Webhook] Unsubmit command received');

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  const ctx: ValidationContext = {
    installationId: installation.id,
    owner: repository.owner.login,
    repo: repository.name,
    issueNumber: issue.number,
  };
  const githubApp = getGithubAppManager();
  const isPrComment = Boolean(issue.pull_request);
  const targetPrNumber = isPrComment ? issue.number : command.prNumber;

  if (!targetPrNumber) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      '\nPlease include a PR number, like `/unsubmit 123`.\n'
    );
    return;
  }

  // Validate PR
  const prResult = await validatePullRequest(ctx, targetPrNumber);
  if (!prResult.success) {
    return;
  }
  const pullRequest = prResult.data;

  // Resolve bounty issue number
  const bountyIssueNumber = await resolveBountyIssueForUnsubmit(
    ctx,
    isPrComment,
    pullRequest,
    targetPrNumber
  );
  if (bountyIssueNumber === null) {
    return;
  }

  // Validate bounty exists
  const bountyResult = await validateBountyExists(
    { ...ctx, issueNumber: bountyIssueNumber },
    bountyIssueNumber
  );
  if (!bountyResult.success) {
    return;
  }
  const bountyRecord = bountyResult.data;

  // Check permission (PR author or maintainer)
  if (comment.user.login !== pullRequest.user.login) {
    const isMaintainer = await checkMaintainerPermission(
      ctx,
      comment.user.login
    );
    if (!isMaintainer) {
      await githubApp.createIssueComment(
        ctx.installationId,
        ctx.owner,
        ctx.repo,
        ctx.issueNumber,
        '\nOnly the PR author (or a repo maintainer) can unsubmit this PR.\n'
      );
      return;
    }
  }

  // Validate submission exists
  const submissionResult = await validateSubmissionExists(
    ctx,
    bountyRecord.id,
    targetPrNumber
  );
  if (!submissionResult.success) {
    return;
  }
  const submissionRecord = submissionResult.data;

  if (submissionRecord.status !== 'pending') {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This submission can’t be unsubmitted because it’s already ${submissionRecord.status}.
`
    );
    return;
  }

  await db.delete(submission).where(eq(submission.id, submissionRecord.id));

  if (submissionRecord.githubCommentId) {
    try {
      await githubApp.editComment(
        installation.id,
        repository.owner.login,
        repository.name,
        submissionRecord.githubCommentId,
        submissionWithdrawnComment()
      );
    } catch (error) {
      console.warn(
        '[GitHub Webhook] Failed to update submission comment:',
        error
      );
    }
  }

  const submissionCount = await db
    .select({ count: count() })
    .from(submission)
    .where(eq(submission.bountyId, bountyRecord.id));

  if (bountyRecord.githubCommentId) {
    const amount = Number.parseFloat(bountyRecord.amount);
    const isFunded = bountyRecord.paymentStatus === 'held';

    const newComment = isFunded
      ? fundedBountyComment(bountyRecord.id, submissionCount[0]?.count || 0)
      : unfundedBountyComment(
          amount,
          bountyRecord.id,
          bountyRecord.currency,
          submissionCount[0]?.count || 0
        );

    await githubApp.editComment(
      installation.id,
      repository.owner.login,
      repository.name,
      bountyRecord.githubCommentId,
      newComment
    );
  }

  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    issue.number,
    `
Submission for PR #${targetPrNumber} has been withdrawn.
`
  );
}

async function handleBountyCreateCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'create' }>
) {
  const { issue, repository, installation, comment } = event;

  console.log(
    `[GitHub Webhook] Creating bounty: ${command.amount} ${command.currency}`
  );

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID');
    return;
  }

  const githubApp = getGithubAppManager();

  // Validate bounty amount and currency
  if (!isValidBountyAmount(command.amount)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Invalid bounty amount: ${command.amount}. Amount must be greater than 0 and less than or equal to 1,000,000.

`
    );
    return;
  }

  if (!isValidCurrency(command.currency)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Invalid currency: ${command.currency}. Supported currencies are USD, EUR, and GBP.

`
    );
    return;
  }

  // Check if user has permission to create bounties (must be admin, maintainer, or have write access)
  const permission = await githubApp.getUserPermission(
    installation.id,
    repository.owner.login,
    repository.name,
    comment.user.login
  );

  if (!isMaintainerPermission(permission)) {
    console.log(
      `[GitHub Webhook] User ${comment.user.login} does not have permission to create bounties`
    );
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `

Sorry, you don't have permission to create bounties on this repository. Only repo admins, maintainers, or writers can do this.

`
    );
    return;
  }

  // Find user by their GitHub username (from OAuth login)
  // The commenter's GitHub username is event.comment.user.login
  const commenterGitHubUsername = comment.user.login;
  const [linkedUser] = await db
    .select({ id: user.id })
    .from(user)
    .leftJoin(userProfile, eq(user.id, userProfile.userId))
    .where(
      or(
        eq(user.handle, commenterGitHubUsername),
        eq(userProfile.githubUsername, commenterGitHubUsername)
      )
    )
    .limit(1);

  if (!linkedUser) {
    console.log(
      `[GitHub Webhook] No user found for GitHub username: ${commenterGitHubUsername}`
    );
    // User needs to link their GitHub account first
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `

Could not create bounty: Your GitHub account is not linked to a bounty.new account.

Please visit https://bounty.new/integrations to link your GitHub account, then try again.

`
    );
    return;
  }

  // Check if bounty already exists for this issue
  const [existingBounty] = await db
    .select()
    .from(bounty)
    .where(
      and(
        eq(bounty.githubIssueNumber, issue.number),
        eq(bounty.githubRepoOwner, repository.owner.login),
        eq(bounty.githubRepoName, repository.name)
      )
    )
    .limit(1);

  if (existingBounty) {
    console.log(
      `[GitHub Webhook] Bounty already exists for issue ${issue.number}`
    );
    // Create a new reply instead of editing user's comment
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `A bounty already exists for this issue. View it at https://bounty.new/bounty/${existingBounty.id}`
    );
    return;
  }

  // Resolve organizationId: prefer the installation's org, fallback to user's personal team
  let organizationId: string | undefined;

  const [installationRecord] = await db
    .select({ organizationId: githubInstallation.organizationId })
    .from(githubInstallation)
    .where(eq(githubInstallation.githubInstallationId, installation.id))
    .limit(1);

  if (installationRecord?.organizationId) {
    organizationId = installationRecord.organizationId;
  } else {
    // Fallback: user's personal team
    const [personalTeam] = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .innerJoin(organization, eq(organization.id, member.organizationId))
      .where(
        and(eq(member.userId, linkedUser.id), eq(organization.isPersonal, true))
      )
      .limit(1);
    organizationId = personalTeam?.organizationId;
  }

  if (!organizationId) {
    console.error(
      `[GitHub Webhook] No organization found for user ${linkedUser.id}, cannot create bounty`
    );
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `Failed to create bounty: no team found for your account. Please log in to [bounty.new](${process.env.NEXT_PUBLIC_BASE_URL ?? 'https://bounty.new'}) and ensure you have a team set up.`
    );
    return;
  }

  // Create the bounty
  const [newBounty] = await db
    .insert(bounty)
    .values({
      title: issue.title,
      description: issue.body || '',
      amount: String(command.amount),
      currency: command.currency,
      status: 'draft', // Will be updated to 'open' when funded
      paymentStatus: 'pending',
      githubIssueNumber: issue.number,
      githubInstallationId: installation.id,
      githubRepoOwner: repository.owner.login,
      githubRepoName: repository.name,
      organizationId,
      createdById: linkedUser.id,
    })
    .returning();

  console.log(`[GitHub Webhook] Created bounty ${newBounty.id}`);

  // Post the bot comment with link to bounty detail page
  const commentBody = unfundedBountyComment(
    command.amount,
    newBounty.id,
    command.currency,
    0
  );
  const botComment = await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    issue.number,
    commentBody
  );

  // Update the bounty with the comment ID for later editing
  await db
    .update(bounty)
    .set({
      githubCommentId: botComment.id,
      updatedAt: new Date(),
    })
    .where(eq(bounty.id, newBounty.id));

  console.log(`[GitHub Webhook] Posted bot comment ${botComment.id}`);
}

async function createSubmissionFromPullRequest(params: {
  installationId: number;
  repository: { owner: { login: string }; name: string };
  bountyRecord: typeof bounty.$inferSelect;
  pullRequest: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: { login: string };
    head: { sha: string };
    state: string;
  };
  requireSubmitKeyword: boolean;
  descriptionOverride?: string;
}) {
  const {
    installationId,
    repository,
    bountyRecord,
    pullRequest,
    requireSubmitKeyword,
    descriptionOverride,
  } = params;

  if (requireSubmitKeyword) {
    const hasSubmitKeyword = containsSubmissionKeyword(
      pullRequest.body,
      bountyRecord.submissionKeyword || undefined
    );
    if (!hasSubmitKeyword) {
      return { status: 'skipped', reason: 'missing_keyword' } as const;
    }
  }

  const [pendingSubmissionCount] = await db
    .select({ count: count() })
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.githubUsername, pullRequest.user.login),
        eq(submission.status, 'pending')
      )
    );

  if (pendingSubmissionCount?.count >= 2) {
    return { status: 'skipped', reason: 'too_many_pending' } as const;
  }

  const [existingSubmission] = await db
    .select()
    .from(submission)
    .where(eq(submission.githubPullRequestNumber, pullRequest.number))
    .limit(1);

  if (existingSubmission) {
    return { status: 'skipped', reason: 'already_submitted' } as const;
  }

  const contributorUser = await findUserByGithubLogin(pullRequest.user.login);
  const contributorId =
    contributorUser?.id || `github-${pullRequest.user.login}`;

  const extractedDescription = extractSubmissionDescription(
    pullRequest.body,
    bountyRecord.submissionKeyword || undefined
  );
  const description =
    descriptionOverride?.trim() || extractedDescription || pullRequest.title;

  const [newSubmission] = await db
    .insert(submission)
    .values({
      bountyId: bountyRecord.id,
      contributorId,
      description: description || pullRequest.title,
      deliverableUrl: pullRequest.html_url,
      pullRequestUrl: pullRequest.html_url,
      githubPullRequestNumber: pullRequest.number,
      githubUsername: pullRequest.user.login,
      githubHeadSha: pullRequest.head.sha,
      status: 'pending',
    })
    .returning({ id: submission.id });

  const githubApp = getGithubAppManager();
  if (!bountyRecord.githubIssueNumber) {
    console.error('[GitHub Webhook] No GitHub issue number for bounty');
    return { status: 'skipped', reason: 'no_github_issue' } as const;
  }
  const submissionComment = await githubApp.createIssueComment(
    installationId,
    repository.owner.login,
    repository.name,
    bountyRecord.githubIssueNumber,
    submissionReceivedComment(
      bountyRecord.paymentStatus === 'held',
      pullRequest.user.login,
      pullRequest.number
    )
  );

  // Also post on the PR itself
  await githubApp.createIssueComment(
    installationId,
    repository.owner.login,
    repository.name,
    pullRequest.number,
    submissionReceivedComment(
      bountyRecord.paymentStatus === 'held',
      pullRequest.user.login,
      pullRequest.number
    )
  );
  if (newSubmission?.id) {
    await db
      .update(submission)
      .set({
        githubCommentId: submissionComment.id,
        updatedAt: new Date(),
      })
      .where(eq(submission.id, newSubmission.id));
  }

  const submissionCount = await db
    .select({ count: count() })
    .from(submission)
    .where(eq(submission.bountyId, bountyRecord.id));

  if (bountyRecord.githubCommentId) {
    const amount = Number.parseFloat(bountyRecord.amount);
    const isFunded = bountyRecord.paymentStatus === 'held';

    const newComment = isFunded
      ? fundedBountyComment(bountyRecord.id, submissionCount[0]?.count || 0)
      : unfundedBountyComment(
          amount,
          bountyRecord.id,
          bountyRecord.currency,
          submissionCount[0]?.count || 0
        );

    await githubApp.editComment(
      installationId,
      repository.owner.login,
      repository.name,
      bountyRecord.githubCommentId,
      newComment
    );
  }

  return { status: 'created' } as const;
}

async function handleBountySubmitCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'submit' }>
) {
  const { issue, repository, installation, comment } = event;
  console.log('[GitHub Webhook] Submit command received');

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  const ctx: ValidationContext = {
    installationId: installation.id,
    owner: repository.owner.login,
    repo: repository.name,
    issueNumber: issue.number,
  };
  const githubApp = getGithubAppManager();
  const isPrComment = Boolean(issue.pull_request);
  const targetPrNumber = isPrComment ? issue.number : command.prNumber;

  // Permission check happens after PR validation - PR authors can submit their own PRs,
  // maintainers can submit on behalf of others. See check below after PR validation.

  if (!targetPrNumber) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      '\nPlease include a PR number, like `/submit 123`, or add `@bountydotnew submit` to your PR description.\n'
    );
    return;
  }

  // Validate PR exists and is from this repo
  const prResult = await validatePullRequest(ctx, targetPrNumber);
  if (!prResult.success) {
    return;
  }
  const pullRequest = prResult.data;

  if (!isPrOpenOrMerged(pullRequest)) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `\nPR #${targetPrNumber} isn't open. Please reopen it before approving.\n`
    );
    return;
  }

  // Resolve bounty issue number (reuses unsubmit resolver - same logic, slightly different messages)
  const bountyIssueNumber = await resolveBountyIssueForUnsubmit(
    ctx,
    isPrComment,
    pullRequest,
    targetPrNumber
  );
  if (bountyIssueNumber === null) {
    return;
  }

  // Validate bounty exists
  const bountyResult = await validateBountyExists(
    { ...ctx, issueNumber: bountyIssueNumber },
    bountyIssueNumber
  );
  if (!bountyResult.success) {
    return;
  }
  const bountyRecord = bountyResult.data;

  if (!isBountyAcceptingSubmissions(bountyRecord)) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `
@${comment.user.login} This bounty already has an approved submission — new submissions are closed.

**If you're the bounty creator** and want to switch winners:
- Use \`/unapprove #PR_NUMBER\` to unapprove the current winner
- Then \`/approve #PR_NUMBER\` to approve a different submission
`
    );
    return;
  }

  if (!isPrOpen(pullRequest)) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `
@${comment.user.login} PR #${targetPrNumber} isn't open.

Please reopen the PR first, then try submitting again with \`/submit ${targetPrNumber}\`.
`
    );
    return;
  }

  if (comment.user.login !== pullRequest.user.login) {
    const permission = await githubApp.getUserPermission(
      installation.id,
      repository.owner.login,
      repository.name,
      comment.user.login
    );
    if (!isMaintainerPermission(permission)) {
      await githubApp.createIssueComment(
        installation.id,
        repository.owner.login,
        repository.name,
        issue.number,
        `
@${comment.user.login} You can't submit someone else's PR.

Only **@${pullRequest.user.login}** (the PR author) or a repo maintainer can submit this PR.
`
      );
      return;
    }
  }

  const submissionResult = await createSubmissionFromPullRequest({
    installationId: installation.id,
    repository,
    bountyRecord,
    pullRequest: {
      number: pullRequest.number,
      title: pullRequest.title,
      body: pullRequest.body,
      html_url: pullRequest.html_url,
      user: { login: pullRequest.user.login },
      head: { sha: pullRequest.head.sha },
      state: pullRequest.state,
    },
    requireSubmitKeyword: false,
    descriptionOverride: command.description,
  });

  if (submissionResult.status === 'skipped') {
    let skipMessage: string;
    if (submissionResult.reason === 'already_submitted') {
      skipMessage = `@${pullRequest.user.login} PR #${targetPrNumber} is already submitted for this bounty. No action needed — just wait for the bounty creator to review it.`;
    } else if (submissionResult.reason === 'too_many_pending') {
      skipMessage = `@${pullRequest.user.login} You already have 2 pending submissions for this bounty. Wait for one to be reviewed before submitting again.`;
    } else {
      skipMessage = `@${pullRequest.user.login} Could not submit this PR. Please try again or check that the PR is open and linked to this issue.`;
    }
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
${skipMessage}
`
    );
  }
}

async function handleBountyApproveCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'approve' }>
) {
  const { issue, repository, installation, comment } = event;

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  const ctx: ValidationContext = {
    installationId: installation.id,
    owner: repository.owner.login,
    repo: repository.name,
    issueNumber: issue.number,
  };
  const githubApp = getGithubAppManager();
  const isPrComment = Boolean(issue.pull_request);
  const targetPrNumber = isPrComment ? issue.number : command.prNumber;

  // Check maintainer permission
  const isMaintainer = await checkMaintainerPermission(ctx, comment.user.login);
  if (!isMaintainer) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `
@${comment.user.login} You don't have permission to approve submissions on this repository.

Only repo **admins**, **maintainers**, or **collaborators with write access** can approve submissions.
`
    );
    return;
  }

  if (!targetPrNumber) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `
@${comment.user.login} Please include a PR number to approve.

**Usage:** \`/approve #PR_NUMBER\`
**Example:** \`/approve 123\`
`
    );
    return;
  }

  // Validate PR
  const prResult = await validatePullRequest(ctx, targetPrNumber);
  if (!prResult.success) {
    return;
  }
  const pullRequest = prResult.data;

  // Resolve bounty issue number
  const bountyIssueNumber = await resolveBountyIssueForUnsubmit(
    ctx,
    isPrComment,
    pullRequest,
    targetPrNumber
  );
  if (bountyIssueNumber === null) {
    return;
  }

  // Validate bounty exists
  const bountyResult = await validateBountyExists(
    { ...ctx, issueNumber: bountyIssueNumber },
    bountyIssueNumber
  );
  if (!bountyResult.success) {
    return;
  }
  const bountyRecord = bountyResult.data;

  if (!isBountyFunded(bountyRecord)) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `
@${comment.user.login} This bounty isn't funded yet.

**To approve submissions**, first fund the bounty at [bounty.new](${baseUrl}/bounty/${bountyRecord.id}).

After funding, run \`/approve ${targetPrNumber}\` again.
`
    );
    return;
  }

  const [submissionRecord] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.githubPullRequestNumber, targetPrNumber)
      )
    )
    .limit(1);

  if (!submissionRecord) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
@${comment.user.login} No submission found for PR #${targetPrNumber}.

The PR author needs to submit first. Ask **@${pullRequest.user.login}** to:
- Add \`@bountydotnew submit\` to their PR description, or
- Comment \`/submit ${targetPrNumber}\` on this issue
`
    );
    return;
  }

  const solverUser = await db
    .select({
      id: user.id,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
    })
    .from(user)
    .where(eq(user.id, submissionRecord.contributorId))
    .limit(1);

  const solver =
    solverUser[0] ||
    (submissionRecord.githubUsername
      ? await db
          .select({
            id: user.id,
            stripeConnectAccountId: user.stripeConnectAccountId,
            stripeConnectOnboardingComplete:
              user.stripeConnectOnboardingComplete,
          })
          .from(user)
          .leftJoin(userProfile, eq(user.id, userProfile.userId))
          .where(
            or(
              eq(user.handle, submissionRecord.githubUsername),
              eq(userProfile.githubUsername, submissionRecord.githubUsername)
            )
          )
          .limit(1)
          .then((rows) => rows[0])
      : undefined);

  if (!isSolverReadyForPayout(solver)) {
    const mention = `@${comment.user.login}`;
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
${mention} The solver needs to connect Stripe before approval. Ask them to visit https://bounty.new/settings/payments, then re‑run \`/approve ${targetPrNumber}\`.
`
    );
    return;
  }

  if (submissionRecord.status === 'approved') {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This submission is already approved. When you're ready, merge the PR and confirm with \`/merge ${targetPrNumber}\`.
`
    );
    return;
  }

  await db
    .update(submission)
    .set({
      status: 'approved',
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submission.id, submissionRecord.id));

  if (bountyRecord.status === 'open') {
    await db
      .update(bounty)
      .set({
        status: 'in_progress',
        assignedToId: submissionRecord.contributorId,
        updatedAt: new Date(),
      })
      .where(eq(bounty.id, bountyRecord.id));
  }

  const approver = comment.user.login;
  const solverUsername = pullRequest.user.login;
  const followup = `
**Submission Approved**

@${solverUsername} Your submission (PR #${targetPrNumber}) has been approved. Once the PR is merged, payment will be released automatically.

@${approver} To complete the payout:
1. Merge PR #${targetPrNumber}
2. Confirm with \`/merge ${targetPrNumber}\` on this issue (or \`@bountydotnew merge\` on the PR)
`;

  // Post on the bounty issue
  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    issue.number,
    followup
  );

  // Also post on the PR itself
  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    targetPrNumber,
    followup
  );
}

async function handleBountyUnapproveCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'unapprove' }>
) {
  const { issue, repository, installation, comment } = event;

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  const ctx: ValidationContext = {
    installationId: installation.id,
    owner: repository.owner.login,
    repo: repository.name,
    issueNumber: issue.number,
  };
  const githubApp = getGithubAppManager();
  const isPrComment = Boolean(issue.pull_request);
  const targetPrNumber = isPrComment ? issue.number : command.prNumber;

  // Check maintainer permission
  const isMaintainer = await checkMaintainerPermission(ctx, comment.user.login);
  if (!isMaintainer) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      "\nSorry, you don't have permission to unapprove submissions on this repository. Only repo admins, maintainers, or writers can do this.\n"
    );
    return;
  }

  if (!targetPrNumber) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      '\nPlease include a PR number, like `/unapprove 123`.\n'
    );
    return;
  }

  // Validate PR
  const prResult = await validatePullRequest(ctx, targetPrNumber);
  if (!prResult.success) {
    return;
  }
  const pullRequest = prResult.data;

  // Resolve bounty issue number
  const bountyIssueNumber = await resolveBountyIssueForUnsubmit(
    ctx,
    isPrComment,
    pullRequest,
    targetPrNumber
  );
  if (bountyIssueNumber === null) {
    return;
  }

  // Validate bounty exists
  const bountyResult = await validateBountyExists(
    { ...ctx, issueNumber: bountyIssueNumber },
    bountyIssueNumber
  );
  if (!bountyResult.success) {
    return;
  }
  const bountyRecord = bountyResult.data;

  if (isBountyReleased(bountyRecord)) {
    await githubApp.createIssueComment(
      ctx.installationId,
      ctx.owner,
      ctx.repo,
      ctx.issueNumber,
      `
This bounty has already been paid out and can’t be unapproved.
`
    );
    return;
  }

  if (bountyRecord.status === 'completed') {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This bounty is already completed and can’t be unapproved.
`
    );
    return;
  }

  const [submissionRecord] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.githubPullRequestNumber, targetPrNumber)
      )
    )
    .limit(1);

  if (!submissionRecord) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn’t find a submission for PR #${targetPrNumber}.
`
    );
    return;
  }

  if (submissionRecord.status !== 'approved') {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
PR #${targetPrNumber} isn’t approved, so there’s nothing to unapprove.
`
    );
    return;
  }

  await db
    .update(submission)
    .set({
      status: 'pending',
      reviewedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(submission.id, submissionRecord.id));

  await db
    .update(bounty)
    .set({
      status: 'open',
      assignedToId: null,
      updatedAt: new Date(),
    })
    .where(eq(bounty.id, bountyRecord.id));

  const submissionCount = await db
    .select({ count: count() })
    .from(submission)
    .where(eq(submission.bountyId, bountyRecord.id));

  if (bountyRecord.githubCommentId) {
    const amount = Number.parseFloat(bountyRecord.amount);
    const isFunded = bountyRecord.paymentStatus === 'held';

    const newComment = isFunded
      ? fundedBountyComment(bountyRecord.id, submissionCount[0]?.count || 0)
      : unfundedBountyComment(
          amount,
          bountyRecord.id,
          bountyRecord.currency,
          submissionCount[0]?.count || 0
        );

    await githubApp.editComment(
      installation.id,
      repository.owner.login,
      repository.name,
      bountyRecord.githubCommentId,
      newComment
    );
  }

  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    issue.number,
    `
Approval withdrawn for PR #${targetPrNumber}. The bounty is open for another submission.
`
  );
}

async function handleBountyReapproveCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'reapprove' }>
) {
  const { issue, repository, installation, comment } = event;

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  const githubApp = getGithubAppManager();
  const isPrComment = Boolean(issue.pull_request);
  const targetPrNumber = isPrComment ? issue.number : command.prNumber;

  const permission = await githubApp.getUserPermission(
    installation.id,
    repository.owner.login,
    repository.name,
    comment.user.login
  );

  if (!isMaintainerPermission(permission)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Sorry, you don't have permission to approve submissions on this repository. Only repo admins, maintainers, or writers can do this.
`
    );
    return;
  }

  if (!targetPrNumber) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Please include a PR number, like \`/reapprove 123\`.
`
    );
    return;
  }

  let pullRequest: GitHubPullRequest;
  try {
    pullRequest = await githubApp.getPullRequest(
      installation.id,
      repository.owner.login,
      repository.name,
      targetPrNumber
    );
  } catch (error) {
    console.error('[GitHub Webhook] Failed to fetch PR for reapprove:', error);
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn't find PR #${targetPrNumber}. Double‑check the number and try again.
`
    );
    return;
  }

  // Note: We allow PRs from forks - that's how open source contributions work!

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pullRequest.body || '')
    : issue.number;

  if (!bountyIssueNumber) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn't tell which issue this PR is for. Add “Fixes #123” to the PR body or reapprove from the issue with \`/reapprove <PR#>\`.
`
    );
    return;
  }

  if (!prMustReferenceIssue(isPrComment, pullRequest.body, issue.number)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
PR #${targetPrNumber} doesn’t reference this issue. Add “Fixes #${issue.number}” (or similar) to the PR description and try again.
`
    );
    return;
  }

  const bountyRecord = await findBountyForIssue({
    issueNumber: bountyIssueNumber,
    owner: repository.owner.login,
    repo: repository.name,
  });

  if (!bountyRecord) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
No bounty found for this issue.
`
    );
    return;
  }

  // Check if already paid first (released or has transfer ID)
  if (isBountyReleased(bountyRecord)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This bounty has already been paid out.
`
    );
    return;
  }

  // Then check if not yet funded (pending)
  if (!isBountyFunded(bountyRecord)) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This bounty isn't funded yet. Fund it at ${baseUrl}/bounty/${bountyRecord.id} before approving submissions.
`
    );
    return;
  }

  const [submissionRecord] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.githubPullRequestNumber, targetPrNumber)
      )
    )
    .limit(1);

  if (!submissionRecord) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn’t find a submission for PR #${targetPrNumber}. Ask the contributor to submit first with \`/submit ${targetPrNumber}\`.
`
    );
    return;
  }

  if (submissionRecord.status === 'approved') {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This submission is already approved. When you're ready, merge the PR and confirm with \`/merge ${targetPrNumber}\`.
`
    );
    return;
  }

  const solverUser = await db
    .select({
      id: user.id,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
    })
    .from(user)
    .where(eq(user.id, submissionRecord.contributorId))
    .limit(1);

  const solver =
    solverUser[0] ||
    (submissionRecord.githubUsername
      ? await db
          .select({
            id: user.id,
            stripeConnectAccountId: user.stripeConnectAccountId,
            stripeConnectOnboardingComplete:
              user.stripeConnectOnboardingComplete,
          })
          .from(user)
          .leftJoin(userProfile, eq(user.id, userProfile.userId))
          .where(
            or(
              eq(user.handle, submissionRecord.githubUsername),
              eq(userProfile.githubUsername, submissionRecord.githubUsername)
            )
          )
          .limit(1)
          .then((rows) => rows[0])
      : undefined);

  if (!isSolverReadyForPayout(solver)) {
    const mention = `@${comment.user.login}`;
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
${mention} The solver needs to connect Stripe before approval. Ask them to visit https://bounty.new/settings/payments, then re‑run \`/reapprove ${targetPrNumber}\`.
`
    );
    return;
  }

  const [existingApproved] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.status, 'approved')
      )
    )
    .limit(1);

  if (existingApproved?.id) {
    await db
      .update(submission)
      .set({
        status: 'pending',
        reviewedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(submission.id, existingApproved.id));
  }

  await db
    .update(submission)
    .set({
      status: 'approved',
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(submission.id, submissionRecord.id));

  await db
    .update(bounty)
    .set({
      status: 'in_progress',
      assignedToId: submissionRecord.contributorId,
      updatedAt: new Date(),
    })
    .where(eq(bounty.id, bountyRecord.id));

  const approver = comment.user.login;
  const followup = `@${approver} Re‑approved. When you're ready, merge the PR and confirm here with \`/merge ${targetPrNumber}\` (or comment \`@bountydotnew merge\` on the PR). Merging releases the payout.`;

  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    issue.number,
    `
${followup}
`
  );
}

async function handleBountyMergeCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'merge' }>
) {
  const { issue, repository, installation, comment } = event;

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  const githubApp = getGithubAppManager();
  const isPrComment = Boolean(issue.pull_request);
  const targetPrNumber = isPrComment ? issue.number : command.prNumber;

  const permission = await githubApp.getUserPermission(
    installation.id,
    repository.owner.login,
    repository.name,
    comment.user.login
  );

  if (!isMaintainerPermission(permission)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Sorry, you don't have permission to confirm merges on this repository. Only repo admins, maintainers, or writers can do this.
`
    );
    return;
  }

  if (!targetPrNumber) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Please include a PR number, like \`/merge 123\`.
`
    );
    return;
  }

  let pullRequest: GitHubPullRequest;
  try {
    pullRequest = await githubApp.getPullRequest(
      installation.id,
      repository.owner.login,
      repository.name,
      targetPrNumber
    );
  } catch (error) {
    console.error('[GitHub Webhook] Failed to fetch PR for merge:', error);
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn't find PR #${targetPrNumber}. Double‑check the number and try again.
`
    );
    return;
  }

  // Note: We allow PRs from forks - that's how open source contributions work!
  // The PR already targets this repository (verified by fetching it via our installation)

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pullRequest.body || '')
    : issue.number;

  if (!bountyIssueNumber) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn't tell which issue this PR is for. Add “Fixes #123” to the PR body or confirm merge from the issue with \`/merge <PR#>\`.
`
    );
    return;
  }

  if (!prMustReferenceIssue(isPrComment, pullRequest.body, issue.number)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
PR #${targetPrNumber} doesn’t reference this issue. Add “Fixes #${issue.number}” (or similar) to the PR description and try again.
`
    );
    return;
  }

  const bountyRecord = await findBountyForIssue({
    issueNumber: bountyIssueNumber,
    owner: repository.owner.login,
    repo: repository.name,
  });

  if (!bountyRecord) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
No bounty found for this issue.
`
    );
    return;
  }

  const [submissionRecord] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.githubPullRequestNumber, targetPrNumber)
      )
    )
    .limit(1);

  if (!submissionRecord) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
I couldn’t find a submission for PR #${targetPrNumber}. Ask the contributor to submit first with \`/submit ${targetPrNumber}\`.
`
    );
    return;
  }

  if (submissionRecord.status !== 'approved') {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Please approve the submission first with \`/approve ${targetPrNumber}\`, then confirm the merge.
`
    );
    return;
  }

  if (!pullRequest.merged) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
PR #${targetPrNumber} isn’t merged yet. Merge it, then run \`/merge ${targetPrNumber}\` again. Merging triggers the payout.
`
    );
    return;
  }

  // Check if already paid first (released or has transfer ID)
  if (isBountyReleased(bountyRecord)) {
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This bounty has already been paid out.
`
    );
    return;
  }

  // Then check if not yet funded (pending)
  if (!isBountyFunded(bountyRecord)) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
This bounty isn't funded yet. Fund it at ${baseUrl}/bounty/${bountyRecord.id}, then run \`/merge ${targetPrNumber}\` to release the payout.
`
    );
    return;
  }

  const solverUser = await db
    .select({
      id: user.id,
      stripeConnectAccountId: user.stripeConnectAccountId,
      stripeConnectOnboardingComplete: user.stripeConnectOnboardingComplete,
    })
    .from(user)
    .where(eq(user.id, submissionRecord.contributorId))
    .limit(1);

  const solver =
    solverUser[0] ||
    (submissionRecord.githubUsername
      ? await db
          .select({
            id: user.id,
            stripeConnectAccountId: user.stripeConnectAccountId,
            stripeConnectOnboardingComplete:
              user.stripeConnectOnboardingComplete,
          })
          .from(user)
          .leftJoin(userProfile, eq(user.id, userProfile.userId))
          .where(
            or(
              eq(user.handle, submissionRecord.githubUsername),
              eq(userProfile.githubUsername, submissionRecord.githubUsername)
            )
          )
          .limit(1)
          .then((rows) => rows[0])
      : undefined);

  if (!isSolverReadyForPayout(solver)) {
    const mention = `@${comment.user.login}`;
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
${mention} The solver needs to connect Stripe before payout. Ask them to visit https://bounty.new/settings/payments, then re‑run \`/merge ${targetPrNumber}\`.
`
    );
    return;
  }

  // Store validated value for use in callback (TypeScript narrowing doesn't carry into callbacks)
  const stripeConnectAccountId = solver.stripeConnectAccountId;
  const amountInCents = Math.round(
    Number.parseFloat(bountyRecord.amount) * 100
  );

  try {
    await withPaymentLock(bountyRecord.id, async () => {
      const alreadyProcessed = await wasOperationPerformed(
        'merge-payout',
        bountyRecord.id,
        String(targetPrNumber)
      );

      if (alreadyProcessed) {
        return;
      }

      const transfer = await createTransfer({
        amount: amountInCents,
        connectAccountId: stripeConnectAccountId,
        bountyId: bountyRecord.id,
      });

      await db
        .update(submission)
        .set({
          status: 'approved',
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(submission.id, submissionRecord.id));

      await db
        .update(bounty)
        .set({
          status: 'completed',
          paymentStatus: 'released',
          stripeTransferId: transfer.id,
          assignedToId: solver.id,
          updatedAt: new Date(),
        })
        .where(eq(bounty.id, bountyRecord.id));

      await db.insert(payout).values({
        userId: solver.id,
        bountyId: bountyRecord.id,
        amount: bountyRecord.amount,
        status: 'processing',
        stripeTransferId: transfer.id,
      });

      await db.insert(transaction).values({
        bountyId: bountyRecord.id,
        type: 'transfer',
        amount: bountyRecord.amount,
        stripeId: transfer.id,
      });

      await markOperationPerformed(
        'merge-payout',
        bountyRecord.id,
        'success',
        String(targetPrNumber)
      );
    });
  } catch (error) {
    if (error instanceof PaymentLockError) {
      await githubApp.createIssueComment(
        installation.id,
        repository.owner.login,
        repository.name,
        issue.number,
        `
Payout is already being processed. Try again in a minute.
`
      );
      return;
    }
    console.error('[GitHub Webhook] Failed to release payout:', error);
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `
Something went wrong releasing the payout. Please try again or contact support.
`
    );
    return;
  }

  const completionMessage = bountyCompletedComment(
    Number.parseFloat(bountyRecord.amount),
    bountyRecord.currency
  );

  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    bountyIssueNumber,
    completionMessage
  );
}

async function handleBountyMoveCommand(
  event: IssueCommentEvent,
  command: Extract<ReturnType<typeof parseBotCommand>, { action: 'move' }>
) {
  const { issue, repository, installation, comment } = event;

  console.log(
    `[GitHub Webhook] Move command: moving bounty from issue #${issue.number} to issue #${command.targetIssueNumber}`
  );

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID');
    return;
  }

  const githubApp = getGithubAppManager();

  // Check if user has permission (same as create command)
  const permission = await githubApp.getUserPermission(
    installation.id,
    repository.owner.login,
    repository.name,
    comment.user.login
  );

  if (!isMaintainerPermission(permission)) {
    console.log(
      `[GitHub Webhook] User ${comment.user.login} does not have permission to move bounties`
    );
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `

Sorry, you don't have permission to move bounties on this repository. Only repo admins, maintainers, or writers can move bounties.

`
    );
    return;
  }

  // Find bounty linked to current issue
  const [bountyRecord] = await db
    .select()
    .from(bounty)
    .where(
      and(
        eq(bounty.githubIssueNumber, issue.number),
        eq(bounty.githubRepoOwner, repository.owner.login),
        eq(bounty.githubRepoName, repository.name)
      )
    )
    .limit(1);

  if (!bountyRecord) {
    console.log(`[GitHub Webhook] No bounty found for issue ${issue.number}`);
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `

No bounty found for this issue. Cannot move.

`
    );
    return;
  }

  // Validate target is an issue, not a PR, and get issue details
  let targetIssue: GitHubIssue;
  try {
    // Use octokit directly to check if it's a PR (issues.get returns PRs with pull_request field)
    const octokit = await githubApp.getInstallationOctokit(installation.id);
    const { data: issueData } = await octokit.rest.issues.get({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: command.targetIssueNumber,
    });

    // Check if it's actually a PR
    if (issueData.pull_request) {
      await githubApp.createIssueComment(
        installation.id,
        repository.owner.login,
        repository.name,
        issue.number,
        `

Cannot move bounty to a pull request. Please specify an issue number.

`
      );
      return;
    }

    // It's an issue, get details using our helper
    targetIssue = await githubApp.getIssue(
      installation.id,
      repository.owner.login,
      repository.name,
      command.targetIssueNumber
    );
  } catch (error) {
    console.error('[GitHub Webhook] Failed to validate target issue:', error);
    await githubApp.createIssueComment(
      installation.id,
      repository.owner.login,
      repository.name,
      issue.number,
      `

Failed to validate target issue #${command.targetIssueNumber}. Please ensure it exists and is an issue (not a pull request).

`
    );
    return;
  }

  // Update bounty to link to new issue
  await db
    .update(bounty)
    .set({
      githubIssueNumber: command.targetIssueNumber,
      title: targetIssue.title,
      description: targetIssue.body || '',
      updatedAt: new Date(),
    })
    .where(eq(bounty.id, bountyRecord.id));

  console.log(
    `[GitHub Webhook] Moved bounty ${bountyRecord.id} to issue #${command.targetIssueNumber}`
  );

  // Delete bot comment from old issue (if exists)
  if (bountyRecord.githubCommentId) {
    try {
      await githubApp.deleteComment(
        installation.id,
        repository.owner.login,
        repository.name,
        Number(bountyRecord.githubCommentId)
      );
    } catch (error) {
      // Comment might already be deleted, ignore error
      console.warn('[GitHub Webhook] Failed to delete old comment:', error);
    }
  }

  // Post new bot comment on target issue
  const amount = Number.parseFloat(bountyRecord.amount);
  const isFunded = bountyRecord.paymentStatus === 'held';

  // Get submission count
  const submissionCount = await db
    .select({ count: count() })
    .from(submission)
    .where(eq(submission.bountyId, bountyRecord.id));

  const newComment = isFunded
    ? fundedBountyComment(bountyRecord.id, submissionCount[0]?.count || 0)
    : unfundedBountyComment(
        amount,
        bountyRecord.id,
        bountyRecord.currency,
        submissionCount[0]?.count || 0
      );

  const botComment = await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    command.targetIssueNumber,
    newComment
  );

  // Update bounty with new comment ID
  await db
    .update(bounty)
    .set({
      githubCommentId: botComment.id,
      updatedAt: new Date(),
    })
    .where(eq(bounty.id, bountyRecord.id));

  // Confirm move on original issue
  await githubApp.createIssueComment(
    installation.id,
    repository.owner.login,
    repository.name,
    issue.number,
    `

Bounty moved to issue #${command.targetIssueNumber}.

`
  );

  console.log('[GitHub Webhook] Move command completed successfully');
}

async function handlePullRequest(event: PullRequestEvent) {
  const { pull_request, repository, installation } = event;

  console.log(
    `[GitHub Webhook] Pull request ${event.action}: ${repository.owner.login}/${repository.name}#${pull_request.number}`
  );

  const installationId = installation?.id;
  if (!installationId) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  // Find the bounty associated with this PR's issue
  // PR body usually contains "Fixes #123" or similar
  const prBody = pull_request.body || '';

  // Extract issue number from PR body (common patterns: Fixes #123, Closes #123, etc.)
  const issueNumber = getIssueNumberFromPrBody(prBody);

  if (!issueNumber) {
    console.log('[GitHub Webhook] No issue number found in PR');
    return;
  }

  // Find the bounty
  const [bountyRecord] = await db
    .select()
    .from(bounty)
    .where(
      and(
        eq(bounty.githubIssueNumber, issueNumber),
        eq(bounty.githubRepoOwner, repository.owner.login),
        eq(bounty.githubRepoName, repository.name)
      )
    )
    .limit(1);

  if (!bountyRecord) {
    console.log(`[GitHub Webhook] No bounty found for issue ${issueNumber}`);
    return;
  }

  if (event.action === 'opened' || event.action === 'reopened') {
    await handlePullRequestOpened(event, bountyRecord, pull_request);
  } else if (event.action === 'closed' && pull_request.merged) {
    await handlePullRequestMerged(event, bountyRecord, pull_request);
  }
}

async function handlePullRequestOpened(
  event: PullRequestEvent,
  bountyRecord: typeof bounty.$inferSelect,
  pull_request: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    user: { login: string };
    head: { sha: string };
    state: string;
  }
) {
  const { repository, installation } = event;
  const installationId = installation?.id;
  if (!installationId) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  // Check early access for auto-submission
  const ctx: ValidationContext = {
    installationId,
    owner: repository.owner.login,
    repo: repository.name,
    issueNumber: bountyRecord.githubIssueNumber!, // Bounty was found by this issue number, so it's non-null
  };
  const earlyAccessCheck = await checkEarlyAccessForUser(
    ctx,
    pull_request.user.login
  );
  if (!earlyAccessCheck.allowed) {
    console.log(
      `[GitHub Webhook] User ${pull_request.user.login} does not have early access, skipping auto-submit`
    );
    return;
  }

  const submissionResult = await createSubmissionFromPullRequest({
    installationId,
    repository,
    bountyRecord,
    pullRequest: {
      number: pull_request.number,
      title: pull_request.title,
      body: pull_request.body,
      html_url: pull_request.html_url,
      user: { login: pull_request.user.login },
      head: { sha: pull_request.head.sha },
      state: pull_request.state,
    },
    requireSubmitKeyword: true,
  });

  if (submissionResult.status === 'skipped') {
    console.log(
      `[GitHub Webhook] Submission skipped for PR ${pull_request.number}: ${submissionResult.reason}`
    );
    return;
  }

  console.log(
    `[GitHub Webhook] Created submission for PR ${pull_request.number}`
  );
}

async function handlePullRequestMerged(
  event: PullRequestEvent,
  bountyRecord: typeof bounty.$inferSelect,
  pull_request: {
    number: number;
    user: { login: string };
    merged_at: string | null;
  }
) {
  const { installation } = event;
  const installationId = installation?.id;
  if (!installationId) {
    console.warn('[GitHub Webhook] No installation ID, skipping comment');
    return;
  }

  console.log(
    `[GitHub Webhook] PR ${pull_request.number} merged, processing payment`
  );

  // Find the submission for this PR
  const [submissionRecord] = await db
    .select()
    .from(submission)
    .where(
      and(
        eq(submission.bountyId, bountyRecord.id),
        eq(submission.githubPullRequestNumber, pull_request.number)
      )
    )
    .limit(1);

  if (!submissionRecord) {
    console.log(
      `[GitHub Webhook] No submission found for PR ${pull_request.number}`
    );
    return;
  }

  console.log(
    '[GitHub Webhook] PR merged; waiting for manual approval + merge confirmation to release payout'
  );
}

async function handleInstallationEvent(event: InstallationEvent) {
  const { installation, action, sender } = event;

  console.log(`[GitHub Webhook] Installation ${action}: ${installation.id}`);

  if (!installation.id) {
    console.warn('[GitHub Webhook] Installation event missing ID');
    return;
  }

  if (action === 'created' && installation.account) {
    // Find the user's GitHub account by sender ID (numeric GitHub user ID)
    const [githubAccount] = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.accountId, sender?.id ? String(sender.id) : ''),
          eq(account.providerId, 'github')
        )
      )
      .limit(1);

    // Get repositories from installation
    const githubApp = getGithubAppManager();
    const repos = await githubApp.getInstallationRepositories(installation.id);

    // Resolve organizationId: use installer's personal team as default
    let installerOrgId: string | undefined;
    if (githubAccount?.userId) {
      const [personalTeam] = await db
        .select({ organizationId: member.organizationId })
        .from(member)
        .innerJoin(organization, eq(organization.id, member.organizationId))
        .where(
          and(
            eq(member.userId, githubAccount.userId),
            eq(organization.isPersonal, true)
          )
        )
        .limit(1);
      installerOrgId = personalTeam?.organizationId;
    }

    // Store installation in database, linked to user if found
    await db
      .insert(githubInstallation)
      .values({
        githubInstallationId: installation.id,
        githubAccountId: githubAccount?.id || null,
        accountLogin: installation.account.login,
        accountType:
          installation.repository_selection === 'all' ? 'Organization' : 'User',
        accountAvatarUrl: installation.account.avatar_url || null,
        repositoryIds: repos.repositories.map((r) => String(r.id)),
        organizationId: installerOrgId ?? null,
      })
      .onConflictDoUpdate({
        target: githubInstallation.githubInstallationId,
        set: {
          accountLogin: installation.account.login,
          accountType:
            installation.repository_selection === 'all'
              ? 'Organization'
              : 'User',
          accountAvatarUrl: installation.account.avatar_url || null,
          repositoryIds: repos.repositories.map((r) => String(r.id)),
          // Don't overwrite organizationId if already set (may have been explicitly assigned)
          ...(installerOrgId ? { organizationId: installerOrgId } : {}),
          updatedAt: new Date(),
        },
      });
  } else if (action === 'deleted') {
    // Remove installation
    await db
      .delete(githubInstallation)
      .where(eq(githubInstallation.githubInstallationId, installation.id));
  }
}

async function handleIssueEdited(event: IssueEditedEvent) {
  const { issue, repository, installation } = event;

  console.log(
    `[GitHub Webhook] Issue edited: ${repository.owner.login}/${repository.name}#${issue.number}`
  );

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  // Find linked bounty
  const [bountyRecord] = await db
    .select()
    .from(bounty)
    .where(
      and(
        eq(bounty.githubIssueNumber, issue.number),
        eq(bounty.githubRepoOwner, repository.owner.login),
        eq(bounty.githubRepoName, repository.name)
      )
    )
    .limit(1);

  if (bountyRecord) {
    // Update bounty title and description from GitHub issue
    await db
      .update(bounty)
      .set({
        title: issue.title,
        description: issue.body || '',
        updatedAt: new Date(),
      })
      .where(eq(bounty.id, bountyRecord.id));

    console.log(
      `[GitHub Webhook] Updated bounty ${bountyRecord.id} from GitHub issue edit`
    );
  }
}

async function handleIssueDeleted(event: IssueDeletedEvent) {
  const { issue, repository, installation } = event;

  console.log(
    `[GitHub Webhook] Issue deleted: ${repository.owner.login}/${repository.name}#${issue.number}`
  );

  if (!installation?.id) {
    console.warn('[GitHub Webhook] No installation ID, skipping');
    return;
  }

  // Find linked bounty
  const [bountyRecord] = await db
    .select()
    .from(bounty)
    .where(
      and(
        eq(bounty.githubIssueNumber, issue.number),
        eq(bounty.githubRepoOwner, repository.owner.login),
        eq(bounty.githubRepoName, repository.name)
      )
    )
    .limit(1);

  if (!bountyRecord) {
    console.log(
      `[GitHub Webhook] No bounty found for deleted issue ${issue.number}`
    );
    return;
  }

  // If unfunded, delete the bounty
  if (
    !bountyRecord.stripePaymentIntentId ||
    bountyRecord.paymentStatus !== 'held'
  ) {
    await db.delete(bounty).where(eq(bounty.id, bountyRecord.id));
    console.log(`[GitHub Webhook] Deleted unfunded bounty ${bountyRecord.id}`);
  } else {
    // If funded, orphan the bounty (clear GitHub link fields but keep the bounty)
    await db
      .update(bounty)
      .set({
        githubIssueNumber: null,
        githubInstallationId: null,
        githubRepoOwner: null,
        githubRepoName: null,
        githubCommentId: null,
        updatedAt: new Date(),
      })
      .where(eq(bounty.id, bountyRecord.id));
    console.log(
      `[GitHub Webhook] Orphaned funded bounty ${bountyRecord.id} (issue deleted)`
    );
  }
}
