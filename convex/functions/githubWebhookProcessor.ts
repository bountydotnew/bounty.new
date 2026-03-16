'use node';
/**
 * GitHub webhook processor — runs in Node.js runtime.
 *
 * Called by the httpAction in githubWebhookHandler.ts after signature
 * verification. This file uses "use node" because Octokit and Stripe
 * require Node.js APIs (Buffer, crypto, etc.).
 *
 * All DB operations go through internal mutations in githubWebhook.ts.
 * All GitHub API calls go through lib/github-app.ts.
 */
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { v, ConvexError } from 'convex/values';
import {
  createIssueComment,
  editComment,
  deleteComment,
  createReaction,
  getUserPermission,
  getPullRequest,
  getIssue,
  isMaintainerPermission,
} from '../lib/githubApp';
import {
  parseBotCommand,
  isValidBountyAmount,
  isValidCurrency,
} from '../lib/botCommands';
import {
  unfundedBountyComment,
  fundedBountyComment,
  submissionReceivedComment,
  submissionWithdrawnComment,
  submissionWithdrawnConfirmation,
  submissionApprovedComment,
  approvalWithdrawnComment,
  bountyCompletedComment,
  bountyMovedComment,
  noBountyFoundComment,
  bountyAlreadyExistsComment,
  bountyClosedComment,
  noSubmissionFoundGeneralComment,
  noSubmissionFoundComment,
  solverNeedsStripeComment,
  submissionAlreadyApprovedComment,
  submissionApprovedFollowupComment,
  notApprovedComment,
  bountyAlreadyPaidComment,
  bountyNotFundedForReapproveComment,
  noSubmissionFoundForReapproveComment,
  reapproveAlreadyApprovedComment,
  solverNeedsStripeForReapproveComment,
  reapproveFollowupComment,
  noSubmissionForMergeComment,
  notApprovedForMergeComment,
  prNotMergedComment,
  prNotFoundComment,
  prNotOpenForSubmitComment,
  cannotSubmitOthersPrComment,
  cannotUnsubmitOthersPrComment,
  cannotUnsubmitComment,
  failedToValidateTargetComment,
  noPermissionToApproveComment,
  approveMissingPrComment,
  bountyNotFundedComment,
  bountyNotFundedForMergeWithPrComment,
  invalidAmountComment,
  invalidCurrencyComment,
  noTeamFoundComment,
  // String constants (no parens when used)
  submitMissingPrComment,
  unsubmitMissingPrComment,
  noPermissionToCreateComment,
  githubNotLinkedComment,
  noPermissionToUnapproveComment,
  unapproveMissingPrComment,
  bountyAlreadyPaidForUnapproveComment,
  bountyAlreadyCompletedComment,
  noPermissionToReapproveComment,
  reapproveMissingPrComment,
  noPermissionToMergeComment,
  mergeMissingPrComment,
  payoutErrorComment,
  noPermissionToMoveComment,
  noBountyToMoveComment,
  cannotMoveToPrComment,
} from '../lib/botComments';
import { toCents } from '../lib/money';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ISSUE_REFERENCE_PATTERN =
  /(?:fixes|closes|resolves|related to)\s+#?(\d+)/i;

// ---------------------------------------------------------------------------
// Helper: post comment (swallows errors)
// ---------------------------------------------------------------------------

async function postComment(
  installationId: number,
  owner: string,
  repo: string,
  issueNumber: number,
  body: string
) {
  try {
    return await createIssueComment(
      installationId,
      owner,
      repo,
      issueNumber,
      body
    );
  } catch (e) {
    console.error('[GitHub Webhook] Failed to post comment:', e);
    return null;
  }
}

function getIssueNumberFromPrBody(body: string | null): number | null {
  if (!body) return null;
  const match = body.match(ISSUE_REFERENCE_PATTERN);
  if (!match) return null;
  const num = Number.parseInt(match[1] || '0', 10);
  return num > 0 ? num : null;
}

// ---------------------------------------------------------------------------
// Main entry point — called by httpAction
// ---------------------------------------------------------------------------

export const processWebhookEvent = internalAction({
  args: { eventJson: v.string() },
  handler: async (ctx, args) => {
    const event = JSON.parse(args.eventJson);

    if (event.issue && event.comment && event.action === 'created') {
      await handleIssueComment(ctx, event);
    } else if (event.pull_request) {
      await handlePullRequest(ctx, event);
    } else if (event.issue && event.action === 'edited' && !event.comment) {
      await handleIssueEdited(ctx, event);
    } else if (event.issue && event.action === 'deleted' && !event.comment) {
      await handleIssueDeleted(ctx, event);
    } else if (
      event.installation &&
      event.sender &&
      (event.action === 'created' || event.action === 'deleted')
    ) {
      await handleInstallationEvent(ctx, event);
    }
  },
});

// ---------------------------------------------------------------------------
// Issue Comment Handler (dispatches to bot commands)
// ---------------------------------------------------------------------------

async function handleIssueComment(ctx: any, event: any) {
  const installationId = event.installation?.id;
  if (!installationId) return;

  const commentAuthor = event.comment.user?.login;
  if (!commentAuthor || commentAuthor.includes('[bot]')) return;

  const command = parseBotCommand(event.comment.body);
  if (!command) return;

  const owner = event.repository.owner.login;
  const repo = event.repository.name;
  const issueNumber = event.issue.number;

  // Add eyes reaction
  try {
    await createReaction(installationId, owner, repo, event.comment.id, 'eyes');
  } catch {
    /* non-critical */
  }

  const bctx = { ctx, installationId, owner, repo, issueNumber, commentAuthor };

  switch (command.action) {
    case 'create':
      await handleCreate(bctx, command);
      break;
    case 'submit':
      await handleSubmit(bctx, command, event);
      break;
    case 'unsubmit':
      await handleUnsubmit(bctx, command, event);
      break;
    case 'approve':
      await handleApprove(bctx, command, event);
      break;
    case 'unapprove':
      await handleUnapprove(bctx, command, event);
      break;
    case 'reapprove':
      await handleReapprove(bctx, command, event);
      break;
    case 'merge':
      await handleMerge(bctx, command, event);
      break;
    case 'move':
      await handleMove(bctx, command);
      break;
  }
}

// ---------------------------------------------------------------------------
// /create command
// ---------------------------------------------------------------------------

async function handleCreate(bctx: any, command: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;

  if (!isValidBountyAmount(command.amount)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      invalidAmountComment(String(command.amount))
    );
    return;
  }
  if (!isValidCurrency(command.currency)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      invalidCurrencyComment(command.currency)
    );
    return;
  }

  const permission = await getUserPermission(
    installationId,
    owner,
    repo,
    commentAuthor
  );
  if (!isMaintainerPermission(permission)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noPermissionToCreateComment
    );
    return;
  }

  const user = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: commentAuthor }
  );
  if (!user) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      githubNotLinkedComment
    );
    return;
  }

  const existing = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber, owner, repo }
  );
  if (existing) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyAlreadyExistsComment(existing._id as string)
    );
    return;
  }

  // Resolve organization
  const installation = await ctx.runQuery(
    internal.functions.githubWebhook.findInstallation,
    { installationId }
  );
  let orgId = installation?.organizationId;
  if (!orgId) {
    const personalOrg = await ctx.runQuery(
      internal.functions.githubWebhook.findPersonalOrg,
      { userId: user._id }
    );
    if (!personalOrg) {
      await postComment(
        installationId,
        owner,
        repo,
        issueNumber,
        noTeamFoundComment()
      );
      return;
    }
    orgId = personalOrg._id;
  }

  // Get issue details
  let issueTitle = `Bounty #${issueNumber}`;
  let issueBody = '';
  try {
    const issue = await getIssue(installationId, owner, repo, issueNumber);
    issueTitle = issue.title || issueTitle;
    issueBody = issue.body || '';
  } catch {
    /* use defaults */
  }

  const amountCents = toCents(command.amount);
  const bountyId = await ctx.runMutation(
    internal.functions.githubWebhook.createBountyFromCommand,
    {
      title: issueTitle,
      description: issueBody,
      amountCents,
      currency: command.currency,
      createdById: user._id,
      organizationId: orgId,
      githubIssueNumber: issueNumber,
      githubInstallationId: installationId,
      githubRepoOwner: owner,
      githubRepoName: repo,
    }
  );

  const commentBody = unfundedBountyComment(
    command.amount,
    bountyId as string,
    command.currency,
    0
  );
  const comment = await postComment(
    installationId,
    owner,
    repo,
    issueNumber,
    commentBody
  );
  if (comment) {
    await ctx.runMutation(
      internal.functions.githubWebhook.setBountyGithubCommentId,
      { bountyId, githubCommentId: comment.id }
    );
  }
}

// ---------------------------------------------------------------------------
// /submit command
// ---------------------------------------------------------------------------

async function handleSubmit(bctx: any, command: any, event: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;
  const isPrComment = !!event.issue.pull_request;
  const targetPrNumber = isPrComment ? issueNumber : command.prNumber;

  if (!targetPrNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      submitMissingPrComment
    );
    return;
  }

  let pr: any;
  try {
    pr = await getPullRequest(installationId, owner, repo, targetPrNumber);
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotFoundComment(targetPrNumber)
    );
    return;
  }

  if (!(pr.state === 'open' || pr.merged)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotOpenForSubmitComment(commentAuthor, targetPrNumber)
    );
    return;
  }

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pr.body)
    : issueNumber;
  if (!bountyIssueNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: bountyIssueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }
  if (bounty.status === 'in_progress' || bounty.status === 'completed') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyClosedComment(commentAuthor)
    );
    return;
  }

  const prAuthor = pr.user?.login;
  if (commentAuthor.toLowerCase() !== prAuthor?.toLowerCase()) {
    const perm = await getUserPermission(
      installationId,
      owner,
      repo,
      commentAuthor
    );
    if (!isMaintainerPermission(perm)) {
      await postComment(
        installationId,
        owner,
        repo,
        issueNumber,
        cannotSubmitOthersPrComment(commentAuthor, prAuthor || '')
      );
      return;
    }
  }

  const existingSub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: targetPrNumber }
  );
  if (existingSub) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      'This PR has already been submitted.'
    );
    return;
  }

  const contributor = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: prAuthor || commentAuthor }
  );
  if (!contributor) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      githubNotLinkedComment
    );
    return;
  }

  const pendingCount = await ctx.runQuery(
    internal.functions.githubWebhook.countPendingSubmissions,
    { bountyId: bounty._id, userId: contributor._id }
  );
  if (pendingCount >= 2) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      'You already have 2 pending submissions.'
    );
    return;
  }

  const submissionId = await ctx.runMutation(
    internal.functions.githubWebhook.createSubmission,
    {
      bountyId: bounty._id,
      contributorId: contributor._id,
      description: pr.title || 'Submitted via GitHub',
      pullRequestUrl: pr.html_url,
      prNumber: targetPrNumber,
      githubUsername: prAuthor || commentAuthor,
      githubHeadSha: pr.head?.sha,
      pullRequestTitle: pr.title,
    }
  );

  const subCount = await ctx.runQuery(
    internal.functions.githubWebhook.getSubmissionCount,
    { bountyId: bounty._id }
  );
  const isFunded = bounty.paymentStatus === 'held';
  const amount = Number(bounty.amountCents) / 100;

  const botComment = await postComment(
    installationId,
    owner,
    repo,
    bountyIssueNumber,
    submissionReceivedComment(
      isFunded,
      prAuthor || commentAuthor,
      targetPrNumber,
      amount
    )
  );
  if (botComment) {
    await ctx.runMutation(
      internal.functions.githubWebhook.setSubmissionGithubCommentId,
      { submissionId, githubCommentId: botComment.id }
    );
  }

  if (bounty.githubCommentId) {
    const updatedBody = isFunded
      ? fundedBountyComment(bounty._id as string, subCount)
      : unfundedBountyComment(
          amount,
          bounty._id as string,
          bounty.currency,
          subCount
        );
    try {
      await editComment(
        installationId,
        owner,
        repo,
        bounty.githubCommentId,
        updatedBody
      );
    } catch {}
  }
}

// ---------------------------------------------------------------------------
// /unsubmit command
// ---------------------------------------------------------------------------

async function handleUnsubmit(bctx: any, command: any, event: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;
  const isPrComment = !!event.issue.pull_request;
  const targetPrNumber = isPrComment ? issueNumber : command.prNumber;

  if (!targetPrNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      unsubmitMissingPrComment
    );
    return;
  }

  let pr: any;
  try {
    pr = await getPullRequest(installationId, owner, repo, targetPrNumber);
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotFoundComment(targetPrNumber)
    );
    return;
  }

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pr.body)
    : issueNumber;
  if (!bountyIssueNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: bountyIssueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const prAuthor = pr.user?.login;
  if (commentAuthor.toLowerCase() !== prAuthor?.toLowerCase()) {
    const perm = await getUserPermission(
      installationId,
      owner,
      repo,
      commentAuthor
    );
    if (!isMaintainerPermission(perm)) {
      await postComment(
        installationId,
        owner,
        repo,
        issueNumber,
        cannotUnsubmitOthersPrComment()
      );
      return;
    }
  }

  const sub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: targetPrNumber }
  );
  if (!sub) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noSubmissionFoundGeneralComment(targetPrNumber)
    );
    return;
  }
  if (sub.status !== 'pending') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      cannotUnsubmitComment(sub.status)
    );
    return;
  }

  await ctx.runMutation(internal.functions.githubWebhook.deleteSubmission, {
    submissionId: sub._id,
  });

  if (sub.githubCommentId) {
    try {
      await editComment(
        installationId,
        owner,
        repo,
        sub.githubCommentId,
        submissionWithdrawnComment()
      );
    } catch {}
  }

  const subCount = await ctx.runQuery(
    internal.functions.githubWebhook.getSubmissionCount,
    { bountyId: bounty._id }
  );
  if (bounty.githubCommentId) {
    const isFunded = bounty.paymentStatus === 'held';
    const amount = Number(bounty.amountCents) / 100;
    const body = isFunded
      ? fundedBountyComment(bounty._id as string, subCount)
      : unfundedBountyComment(
          amount,
          bounty._id as string,
          bounty.currency,
          subCount
        );
    try {
      await editComment(
        installationId,
        owner,
        repo,
        bounty.githubCommentId,
        body
      );
    } catch {}
  }

  await postComment(
    installationId,
    owner,
    repo,
    issueNumber,
    submissionWithdrawnConfirmation(targetPrNumber)
  );
}

// ---------------------------------------------------------------------------
// /approve command
// ---------------------------------------------------------------------------

async function handleApprove(bctx: any, command: any, event: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;

  const perm = await getUserPermission(
    installationId,
    owner,
    repo,
    commentAuthor
  );
  if (!isMaintainerPermission(perm)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noPermissionToApproveComment(commentAuthor)
    );
    return;
  }

  const isPrComment = !!event.issue.pull_request;
  const targetPrNumber = isPrComment ? issueNumber : command.prNumber;
  if (!targetPrNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      approveMissingPrComment(commentAuthor)
    );
    return;
  }

  let pr: any;
  try {
    pr = await getPullRequest(installationId, owner, repo, targetPrNumber);
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotFoundComment(targetPrNumber)
    );
    return;
  }

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pr.body)
    : issueNumber;
  if (!bountyIssueNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: bountyIssueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }
  if (bounty.paymentStatus !== 'held') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyNotFundedComment(commentAuthor, bounty._id as string)
    );
    return;
  }

  const sub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: targetPrNumber }
  );
  if (!sub) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noSubmissionFoundComment(commentAuthor, targetPrNumber, '')
    );
    return;
  }
  if (sub.status === 'approved') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      submissionAlreadyApprovedComment(targetPrNumber)
    );
    return;
  }

  // Resolve solver and check Stripe
  const solver = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: sub.githubUsername || '' }
  );
  if (solver && !solver.stripeConnectAccountId) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      solverNeedsStripeComment(sub.githubUsername || '', targetPrNumber)
    );
    return;
  }

  await ctx.runMutation(
    internal.functions.githubWebhook.approveSubmissionFromWebhook,
    {
      submissionId: sub._id,
      bountyId: bounty._id,
      solverId: solver?._id || sub.contributorId,
    }
  );

  const amount = Number(bounty.amountCents) / 100;
  await postComment(
    installationId,
    owner,
    repo,
    bountyIssueNumber,
    submissionApprovedFollowupComment(
      sub.githubUsername || commentAuthor,
      commentAuthor,
      targetPrNumber
    )
  );
}

// ---------------------------------------------------------------------------
// /unapprove command
// ---------------------------------------------------------------------------

async function handleUnapprove(bctx: any, command: any, event: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;

  const perm = await getUserPermission(
    installationId,
    owner,
    repo,
    commentAuthor
  );
  if (!isMaintainerPermission(perm)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noPermissionToUnapproveComment
    );
    return;
  }

  const isPrComment = !!event.issue.pull_request;
  const targetPrNumber = isPrComment ? issueNumber : command.prNumber;
  if (!targetPrNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      unapproveMissingPrComment
    );
    return;
  }

  let pr: any;
  try {
    pr = await getPullRequest(installationId, owner, repo, targetPrNumber);
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotFoundComment(targetPrNumber)
    );
    return;
  }

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pr.body)
    : issueNumber;
  if (!bountyIssueNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: bountyIssueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }
  if (bounty.paymentStatus === 'released' || bounty.stripeTransferId) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyAlreadyPaidForUnapproveComment
    );
    return;
  }
  if (bounty.status === 'completed') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyAlreadyCompletedComment
    );
    return;
  }

  const sub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: targetPrNumber }
  );
  if (!sub) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noSubmissionFoundGeneralComment(targetPrNumber)
    );
    return;
  }
  if (sub.status !== 'approved') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      notApprovedComment(targetPrNumber)
    );
    return;
  }

  await ctx.runMutation(
    internal.functions.githubWebhook.unapproveSubmissionFromWebhook,
    { submissionId: sub._id, bountyId: bounty._id }
  );
  await postComment(
    installationId,
    owner,
    repo,
    bountyIssueNumber,
    approvalWithdrawnComment(targetPrNumber)
  );
}

// ---------------------------------------------------------------------------
// /reapprove command
// ---------------------------------------------------------------------------

async function handleReapprove(bctx: any, command: any, event: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;

  const perm = await getUserPermission(
    installationId,
    owner,
    repo,
    commentAuthor
  );
  if (!isMaintainerPermission(perm)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noPermissionToReapproveComment
    );
    return;
  }

  const isPrComment = !!event.issue.pull_request;
  const targetPrNumber = isPrComment ? issueNumber : command.prNumber;
  if (!targetPrNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      reapproveMissingPrComment
    );
    return;
  }

  let pr: any;
  try {
    pr = await getPullRequest(installationId, owner, repo, targetPrNumber);
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotFoundComment(targetPrNumber)
    );
    return;
  }

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pr.body)
    : issueNumber;
  if (!bountyIssueNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: bountyIssueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }
  if (bounty.paymentStatus === 'released' || bounty.stripeTransferId) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyAlreadyPaidComment()
    );
    return;
  }
  if (bounty.paymentStatus !== 'held') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyNotFundedForReapproveComment(bounty._id as string)
    );
    return;
  }

  const sub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: targetPrNumber }
  );
  if (!sub) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noSubmissionFoundForReapproveComment(targetPrNumber)
    );
    return;
  }
  if (sub.status === 'approved') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      reapproveAlreadyApprovedComment(targetPrNumber)
    );
    return;
  }

  const solver = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: sub.githubUsername || '' }
  );
  if (solver && !solver.stripeConnectAccountId) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      solverNeedsStripeForReapproveComment(
        sub.githubUsername || '',
        targetPrNumber
      )
    );
    return;
  }

  const currentApproved = await ctx.runQuery(
    internal.functions.githubWebhook.findApprovedSubmission,
    { bountyId: bounty._id }
  );
  await ctx.runMutation(internal.functions.githubWebhook.reapproveSubmission, {
    currentApprovedId: currentApproved?._id,
    newSubmissionId: sub._id,
    bountyId: bounty._id,
    solverId: solver?._id || sub.contributorId,
  });

  await postComment(
    installationId,
    owner,
    repo,
    bountyIssueNumber,
    reapproveFollowupComment(sub.githubUsername || '', targetPrNumber)
  );
}

// ---------------------------------------------------------------------------
// /merge command
// ---------------------------------------------------------------------------

async function handleMerge(bctx: any, command: any, event: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;

  const perm = await getUserPermission(
    installationId,
    owner,
    repo,
    commentAuthor
  );
  if (!isMaintainerPermission(perm)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noPermissionToMergeComment
    );
    return;
  }

  const isPrComment = !!event.issue.pull_request;
  const targetPrNumber = isPrComment ? issueNumber : command.prNumber;
  if (!targetPrNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      mergeMissingPrComment
    );
    return;
  }

  let pr: any;
  try {
    pr = await getPullRequest(installationId, owner, repo, targetPrNumber);
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotFoundComment(targetPrNumber)
    );
    return;
  }

  const bountyIssueNumber = isPrComment
    ? getIssueNumberFromPrBody(pr.body)
    : issueNumber;
  if (!bountyIssueNumber) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: bountyIssueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyFoundComment
    );
    return;
  }

  const sub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: targetPrNumber }
  );
  if (!sub) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noSubmissionForMergeComment(targetPrNumber)
    );
    return;
  }
  if (sub.status !== 'approved') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      notApprovedForMergeComment(targetPrNumber)
    );
    return;
  }
  if (!pr.merged) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      prNotMergedComment(targetPrNumber)
    );
    return;
  }
  if (bounty.paymentStatus === 'released' || bounty.stripeTransferId) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyAlreadyPaidComment()
    );
    return;
  }

  const amountCents = Number(bounty.amountCents);
  const isFreeBounty = amountCents === 0;
  if (!isFreeBounty && bounty.paymentStatus !== 'held') {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      bountyNotFundedForMergeWithPrComment(bounty._id as string, targetPrNumber)
    );
    return;
  }

  const hasCancellation = await ctx.runQuery(
    internal.functions.githubWebhook.hasPendingCancellation,
    { bountyId: bounty._id }
  );
  if (hasCancellation) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      'Cannot merge — pending cancellation request.'
    );
    return;
  }

  const solver = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: sub.githubUsername || '' }
  );
  if (
    !(
      isFreeBounty ||
      (solver?.stripeConnectAccountId &&
        solver?.stripeConnectOnboardingComplete)
    )
  ) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      solverNeedsStripeComment(sub.githubUsername || '', targetPrNumber)
    );
    return;
  }

  try {
    let transferId: string;
    if (isFreeBounty) {
      transferId = `free_bounty_${bounty._id}`;
    } else {
      const Stripe = (await import('stripe')).default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const transfer = await stripeClient.transfers.create(
        {
          amount: amountCents,
          currency: bounty.currency.toLowerCase(),
          destination: solver!.stripeConnectAccountId!,
          metadata: { bountyId: bounty._id as string },
        },
        { idempotencyKey: `merge-payout:${bounty._id}` }
      );
      transferId = transfer.id;
    }

    await ctx.runMutation(
      internal.functions.githubWebhook.finalizeMergeFromWebhook,
      {
        bountyId: bounty._id,
        submissionId: sub._id,
        solverId: solver?._id || sub.contributorId,
        transferId,
        amountCents: BigInt(amountCents),
        isFreeBounty,
      }
    );

    await postComment(
      installationId,
      owner,
      repo,
      bountyIssueNumber,
      bountyCompletedComment(amountCents / 100, bounty.currency)
    );
  } catch (error) {
    console.error('[GitHub Webhook] Merge payout error:', error);
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      payoutErrorComment
    );
  }
}

// ---------------------------------------------------------------------------
// /move command
// ---------------------------------------------------------------------------

async function handleMove(bctx: any, command: any) {
  const { ctx, installationId, owner, repo, issueNumber, commentAuthor } = bctx;

  const perm = await getUserPermission(
    installationId,
    owner,
    repo,
    commentAuthor
  );
  if (!isMaintainerPermission(perm)) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noPermissionToMoveComment
    );
    return;
  }

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber, owner, repo }
  );
  if (!bounty) {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      noBountyToMoveComment
    );
    return;
  }

  const targetIssueNumber = command.targetIssueNumber;
  let targetIssue: any;
  try {
    targetIssue = await getIssue(
      installationId,
      owner,
      repo,
      targetIssueNumber
    );
    if (targetIssue.pull_request) {
      await postComment(
        installationId,
        owner,
        repo,
        issueNumber,
        cannotMoveToPrComment
      );
      return;
    }
  } catch {
    await postComment(
      installationId,
      owner,
      repo,
      issueNumber,
      failedToValidateTargetComment(targetIssueNumber)
    );
    return;
  }

  if (bounty.githubCommentId) {
    try {
      await deleteComment(installationId, owner, repo, bounty.githubCommentId);
    } catch {}
  }

  const isFunded = bounty.paymentStatus === 'held';
  const amount = Number(bounty.amountCents) / 100;
  const subCount = await ctx.runQuery(
    internal.functions.githubWebhook.getSubmissionCount,
    { bountyId: bounty._id }
  );
  const commentBody = isFunded
    ? fundedBountyComment(bounty._id as string, subCount)
    : unfundedBountyComment(
        amount,
        bounty._id as string,
        bounty.currency,
        subCount
      );
  const newComment = await postComment(
    installationId,
    owner,
    repo,
    targetIssueNumber,
    commentBody
  );

  await ctx.runMutation(internal.functions.githubWebhook.moveBounty, {
    bountyId: bounty._id,
    newIssueNumber: targetIssueNumber,
    newTitle: targetIssue.title || bounty.title,
    newDescription: targetIssue.body || bounty.description,
    newGithubCommentId: newComment?.id,
  });

  await postComment(
    installationId,
    owner,
    repo,
    issueNumber,
    bountyMovedComment(targetIssueNumber)
  );
}

// ---------------------------------------------------------------------------
// Pull Request events
// ---------------------------------------------------------------------------

async function handlePullRequest(ctx: any, event: any) {
  const installationId = event.installation?.id;
  if (!installationId) return;
  const owner = event.repository.owner.login;
  const repo = event.repository.name;
  const pr = event.pull_request;

  const issueNumber = getIssueNumberFromPrBody(pr.body);
  if (!issueNumber) return;

  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber, owner, repo }
  );
  if (!bounty) return;

  if (event.action === 'opened' || event.action === 'reopened') {
    await handlePrOpened(ctx, event, bounty, installationId, owner, repo);
  } else if (event.action === 'closed' && pr.merged) {
    await handlePrMerged(
      ctx,
      event,
      bounty,
      issueNumber,
      installationId,
      owner,
      repo
    );
  }
}

async function handlePrOpened(
  ctx: any,
  event: any,
  bounty: any,
  installationId: number,
  owner: string,
  repo: string
) {
  const pr = event.pull_request;
  const prAuthor = pr.user?.login;
  if (!prAuthor) return;
  if (bounty.status === 'in_progress' || bounty.status === 'completed') return;

  const existingSub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: pr.number }
  );
  if (existingSub) return;

  const contributor = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: prAuthor }
  );
  if (!contributor) return;

  await ctx.runMutation(internal.functions.githubWebhook.createSubmission, {
    bountyId: bounty._id,
    contributorId: contributor._id,
    description: pr.title || 'Auto-submitted via PR',
    pullRequestUrl: pr.html_url,
    prNumber: pr.number,
    githubUsername: prAuthor,
    githubHeadSha: pr.head?.sha,
    pullRequestTitle: pr.title,
  });

  if (bounty.githubCommentId) {
    const subCount = await ctx.runQuery(
      internal.functions.githubWebhook.getSubmissionCount,
      { bountyId: bounty._id }
    );
    const isFunded = bounty.paymentStatus === 'held';
    const amount = Number(bounty.amountCents) / 100;
    const body = isFunded
      ? fundedBountyComment(bounty._id as string, subCount)
      : unfundedBountyComment(
          amount,
          bounty._id as string,
          bounty.currency,
          subCount
        );
    try {
      await editComment(
        installationId,
        owner,
        repo,
        bounty.githubCommentId,
        body
      );
    } catch {}
  }
}

async function handlePrMerged(
  ctx: any,
  event: any,
  bounty: any,
  bountyIssueNumber: number,
  installationId: number,
  owner: string,
  repo: string
) {
  const pr = event.pull_request;
  const mergerLogin = event.sender?.login;

  const sub = await ctx.runQuery(
    internal.functions.githubWebhook.findSubmissionByPr,
    { bountyId: bounty._id, prNumber: pr.number }
  );
  if (!sub) return;
  if (bounty.paymentStatus === 'released' || bounty.stripeTransferId) return;

  const amountCents = Number(bounty.amountCents);
  const isFreeBounty = amountCents === 0;
  const needsImplicitApproval = sub.status !== 'approved';

  if (needsImplicitApproval && !isFreeBounty) {
    const perm = await getUserPermission(
      installationId,
      owner,
      repo,
      mergerLogin || ''
    );
    if (!isMaintainerPermission(perm)) {
      await postComment(
        installationId,
        owner,
        repo,
        bountyIssueNumber,
        `PR #${pr.number} was merged but not approved. Use \`/approve #${pr.number}\` then \`/merge #${pr.number}\`.`
      );
      return;
    }
  }

  if (!isFreeBounty && bounty.paymentStatus !== 'held') return;

  const hasCancellation = await ctx.runQuery(
    internal.functions.githubWebhook.hasPendingCancellation,
    { bountyId: bounty._id }
  );
  if (hasCancellation) return;

  const solver = await ctx.runQuery(
    internal.functions.githubWebhook.findUserByGithubLogin,
    { login: sub.githubUsername || '' }
  );
  if (
    !(
      isFreeBounty ||
      (solver?.stripeConnectAccountId &&
        solver?.stripeConnectOnboardingComplete)
    )
  ) {
    await postComment(
      installationId,
      owner,
      repo,
      bountyIssueNumber,
      `PR #${pr.number} was merged but solver needs Stripe setup. Use \`/merge #${pr.number}\` after setup.`
    );
    return;
  }

  try {
    let transferId: string;
    if (isFreeBounty) {
      transferId = `free_bounty_${bounty._id}`;
    } else {
      const Stripe = (await import('stripe')).default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);
      const transfer = await stripeClient.transfers.create(
        {
          amount: amountCents,
          currency: bounty.currency.toLowerCase(),
          destination: solver!.stripeConnectAccountId!,
          metadata: { bountyId: bounty._id as string },
        },
        { idempotencyKey: `auto-merge-payout:${bounty._id}` }
      );
      transferId = transfer.id;
    }

    await ctx.runMutation(
      internal.functions.githubWebhook.finalizeMergeFromWebhook,
      {
        bountyId: bounty._id,
        submissionId: sub._id,
        solverId: solver?._id || sub.contributorId,
        transferId,
        amountCents: BigInt(amountCents),
        isFreeBounty,
        needsImplicitApproval,
      }
    );

    await postComment(
      installationId,
      owner,
      repo,
      bountyIssueNumber,
      bountyCompletedComment(amountCents / 100, bounty.currency)
    );
  } catch (error) {
    console.error('[GitHub Webhook] Auto-merge payout error:', error);
    await postComment(
      installationId,
      owner,
      repo,
      bountyIssueNumber,
      `Payment failed on auto-merge. Retry with \`/merge #${pr.number}\`.`
    );
  }
}

// ---------------------------------------------------------------------------
// Issue edited / deleted + Installation events
// ---------------------------------------------------------------------------

async function handleIssueEdited(ctx: any, event: any) {
  const owner = event.repository.owner.login;
  const repo = event.repository.name;
  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: event.issue.number, owner, repo }
  );
  if (!bounty) return;
  await ctx.runMutation(internal.functions.githubWebhook.syncBountyFromIssue, {
    bountyId: bounty._id,
    title: event.issue.title || bounty.title,
    description: event.issue.body || bounty.description,
  });
}

async function handleIssueDeleted(ctx: any, event: any) {
  const owner = event.repository.owner.login;
  const repo = event.repository.name;
  const bounty = await ctx.runQuery(
    internal.functions.githubWebhook.findBountyForIssue,
    { issueNumber: event.issue.number, owner, repo }
  );
  if (!bounty) return;
  await ctx.runMutation(internal.functions.githubWebhook.handleIssueDeleted, {
    bountyId: bounty._id,
  });
}

async function handleInstallationEvent(ctx: any, event: any) {
  const installationId = event.installation?.id;
  if (!installationId) return;

  if (event.action === 'deleted') {
    await ctx.runMutation(
      internal.functions.githubWebhook.deleteGithubInstallation,
      { githubInstallationId: installationId }
    );
    return;
  }

  const account = event.installation.account;
  const senderLogin = event.sender?.login;
  let organizationId: any;

  if (senderLogin) {
    const user = await ctx.runQuery(
      internal.functions.githubWebhook.findUserByGithubLogin,
      { login: senderLogin }
    );
    if (user) {
      const personalOrg = await ctx.runQuery(
        internal.functions.githubWebhook.findPersonalOrg,
        { userId: user._id }
      );
      organizationId = personalOrg?._id;
    }
  }

  await ctx.runMutation(
    internal.functions.githubWebhook.upsertGithubInstallation,
    {
      githubInstallationId: installationId,
      accountLogin: account?.login,
      accountType: account?.type,
      accountAvatarUrl: account?.avatar_url,
      organizationId,
    }
  );
}
