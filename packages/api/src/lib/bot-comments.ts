/**
 * Bot Comment Templates
 *
 * All GitHub bot comments live here.
 */

/**
 * Format currency consistently (inlined to avoid circular dependency on @bounty/ui)
 */
function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ============================================================================
// BOUNTY CREATION
// ============================================================================

/**
 * Bounty created, not yet funded.
 */
export function unfundedBountyComment(
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

${formattedAmount} · ${submissionCount} submissions

**Contributors:** Add \`@bountydotnew submit\` to your PR description, or comment \`/submit #PR_NUMBER\` on this issue.

**Bounty creator:** Fund this bounty at [bounty.new](${baseUrl}/bounty/${bountyId}) to start reviewing. After funding, approve with \`/approve #PR_NUMBER\` and confirm with \`/merge #PR_NUMBER\` once merged.

Funding is required before approvals and payouts.
`;
}

/**
 * Bounty is funded and accepting submissions.
 */
export function fundedBountyComment(
  bountyId: string,
  submissionCount = 0
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  const buttonUrl = `${baseUrl}/bounty-button.svg`;
  return `
[![bounty.new](${buttonUrl})](${baseUrl}/bounty/${bountyId})

Funded · ${submissionCount} submissions

**Contributors:** Add \`@bountydotnew submit\` to your PR description, or comment \`/submit #PR_NUMBER\` on this issue.

**Bounty creator:** Approve with \`/approve #PR_NUMBER\`. After merging, confirm with \`/merge #PR_NUMBER\` to release payment.

Payouts are released within 2–3 business days after merge.
`;
}

// ============================================================================
// SUBMISSIONS
// ============================================================================

/**
 * PR submitted for a bounty.
 */
export function submissionReceivedComment(
  isFunded: boolean,
  prAuthor: string,
  prNumber: number,
  amount?: number
): string {
  if (amount === 0) {
    return `
@${prAuthor} PR #${prNumber} submitted. The bounty creator will review it.

This is a free bounty. No payout will be issued.
`;
  }

  if (isFunded) {
    return `
@${prAuthor} PR #${prNumber} submitted. The bounty creator will review it.

After approval and merge, payout is released within 2–3 business days.
`;
  }

  return `
@${prAuthor} PR #${prNumber} submitted.

This bounty isn't funded yet. Your submission stays pending until the creator funds it.
`;
}

/**
 * Submission withdrawn.
 */
export function submissionWithdrawnComment(): string {
  return `
Submission withdrawn.
`;
}

/**
 * Submission withdrawn via command.
 */
export function submissionWithdrawnConfirmation(
  targetPrNumber: number
): string {
  return `
Submission for PR #${targetPrNumber} withdrawn.
`;
}

// ============================================================================
// APPROVALS
// ============================================================================

/**
 * Submission approved.
 */
export function submissionApprovedComment(
  solverUsername: string,
  approver: string,
  targetPrNumber: number,
  amount?: number
): string {
  if (amount === 0) {
    return `
@${solverUsername} PR #${targetPrNumber} approved.

This is a free bounty, so no payout will be issued.
@${approver} Merge PR #${targetPrNumber}, then confirm with \`/merge ${targetPrNumber}\`.
`;
  }

  return `
@${solverUsername} PR #${targetPrNumber} approved. Payout releases after merge.

@${approver} Merge PR #${targetPrNumber}, then confirm with \`/merge ${targetPrNumber}\`.
`;
}

/**
 * Submission already approved.
 */
export function submissionAlreadyApprovedComment(
  targetPrNumber: number
): string {
  return `
Already approved. Merge the PR and confirm with \`/merge ${targetPrNumber}\`.
`;
}

// ============================================================================
// UNAPPROVE
// ============================================================================

/**
 * Approval withdrawn.
 */
export function approvalWithdrawnComment(targetPrNumber: number): string {
  return `
Approval withdrawn for PR #${targetPrNumber}. The bounty is open again.
`;
}

/**
 * Tried to unapprove something that isn't approved.
 */
export function notApprovedComment(targetPrNumber: number): string {
  return `
PR #${targetPrNumber} isn't approved.
`;
}

// ============================================================================
// COMPLETION
// ============================================================================

/**
 * Bounty completed, payout released.
 */
export function bountyCompletedComment(
  amount: number,
  currency = 'USD'
): string {
  const formattedAmount = formatCurrency(amount, currency);
  return `
Bounty completed. ${formattedAmount} released.

Funds arrive in the solver's Stripe account within 2–3 business days.
`;
}

/**
 * Bounty already paid.
 */
export function bountyAlreadyPaidComment(): string {
  return `
This bounty has already been paid out.
`;
}

// ============================================================================
// BOUNTY MOVED
// ============================================================================

/**
 * Bounty moved to another issue.
 */
export function bountyMovedComment(targetIssueNumber: number): string {
  return `
Bounty moved to #${targetIssueNumber}.
`;
}

// ============================================================================
// ERRORS: VALIDATION
// ============================================================================

/**
 * PR not found.
 */
export function prNotFoundComment(prNumber: number): string {
  return `
Couldn't find PR #${prNumber}. Check the number and try again.
`;
}

/**
 * No bounty on this issue.
 */
export const noBountyFoundComment = `
No bounty found for this issue.
`;

/**
 * Bounty already exists.
 */
export function bountyAlreadyExistsComment(bountyId: string): string {
  return `A bounty already exists for this issue: https://bounty.new/bounty/${bountyId}`;
}

// ============================================================================
// ERRORS: SUBMISSION
// ============================================================================

/**
 * Bounty has an approved submission, no new submissions.
 */
export function bountyClosedComment(username: string): string {
  return `
@${username} This bounty already has an approved submission.

To switch winners, use \`/unapprove #PR_NUMBER\` then \`/approve #PR_NUMBER\`.
`;
}

/**
 * PR isn't open.
 */
export function prNotOpenForSubmitComment(
  username: string,
  prNumber: number
): string {
  return `
@${username} PR #${prNumber} isn't open. Reopen it, then run \`/submit ${prNumber}\`.
`;
}

/**
 * Can't submit someone else's PR.
 */
export function cannotSubmitOthersPrComment(
  username: string,
  prAuthor: string
): string {
  return `
@${username} Only @${prAuthor} or a repo maintainer can submit this PR.
`;
}

/**
 * PR already submitted.
 */
export function alreadySubmittedComment(
  prAuthor: string,
  prNumber: number
): string {
  return `@${prAuthor} PR #${prNumber} is already submitted. The bounty creator will review it.`;
}

/**
 * Too many pending submissions.
 */
export function tooManyPendingComment(username: string): string {
  return `@${username} You have 2 pending submissions for this bounty. Wait for one to be reviewed before submitting another.`;
}

/**
 * Generic submission failure.
 */
export function submissionFailedComment(prAuthor: string): string {
  return `@${prAuthor} Couldn't submit this PR. Check that it's open and linked to this issue, then try again.`;
}

/**
 * Can't unsubmit, wrong status.
 */
export function cannotUnsubmitComment(status: string): string {
  return `
Can't unsubmit. This submission is already ${status}.
`;
}

// ============================================================================
// ERRORS: APPROVAL
// ============================================================================

/**
 * No permission to approve.
 */
export function noPermissionToApproveComment(username: string): string {
  return `
@${username} You don't have permission to approve submissions. This requires admin, maintainer, or write access.
`;
}

/**
 * Missing PR number in approve command.
 */
export function approveMissingPrComment(username: string): string {
  return `
@${username} Include a PR number: \`/approve #PR_NUMBER\`
`;
}

/**
 * Bounty not funded, can't approve.
 */
export function bountyNotFundedComment(
  username: string,
  bountyId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  return `
@${username} This bounty isn't funded yet. Fund it at [bounty.new](${baseUrl}/bounty/${bountyId}), then run \`/approve\` again.
`;
}

/**
 * No submission found for approval.
 */
export function noSubmissionFoundComment(
  username: string,
  prNumber: number,
  prAuthor: string
): string {
  return `
@${username} No submission found for PR #${prNumber}.

@${prAuthor} needs to submit first: add \`@bountydotnew submit\` to the PR description, or comment \`/submit ${prNumber}\` on this issue.
`;
}

/**
 * Solver needs Stripe connected before approval.
 */
export function solverNeedsStripeComment(
  username: string,
  prNumber: number
): string {
  return `
${username} The solver needs to connect Stripe before approval: https://bounty.new/settings/payments

Then run \`/approve ${prNumber}\` again.
`;
}

// ============================================================================
// ERRORS: UNSUBMIT
// ============================================================================

/**
 * Missing PR number in unsubmit command.
 */
export const unsubmitMissingPrComment = `
Include a PR number: \`/unsubmit 123\`
`;

/**
 * Can't unsubmit someone else's PR.
 */
export function cannotUnsubmitOthersPrComment(): string {
  return `
Only the PR author or a repo maintainer can unsubmit.
`;
}

// ============================================================================
// ERRORS: MERGE
// ============================================================================

/**
 * Missing PR number in merge command.
 */
export const mergeMissingPrComment = `
Include a PR number: \`/merge 123\`
`;

/**
 * No permission to confirm merge.
 */
export const noPermissionToMergeComment = `
You don't have permission to confirm merges. This requires admin, maintainer, or write access.
`;

/**
 * PR doesn't reference the issue.
 */
export function prDoesNotReferenceIssueComment(issueNumber: number): string {
  return `
This PR doesn't reference the issue. Add "Fixes #${issueNumber}" to the PR description and try again.
`;
}

/**
 * No submission found when trying to merge.
 */
export function noSubmissionForMergeComment(prNumber: number): string {
  return `
No submission found for PR #${prNumber}. The contributor needs to submit first with \`/submit ${prNumber}\`.
`;
}

/**
 * Submission not approved yet.
 */
export function notApprovedForMergeComment(prNumber: number): string {
  return `
Approve the submission first with \`/approve ${prNumber}\`, then confirm the merge.
`;
}

/**
 * PR not merged yet.
 */
export function prNotMergedComment(prNumber: number): string {
  return `
PR #${prNumber} isn't merged yet. Merge it first, then run \`/merge ${prNumber}\`.
`;
}

/**
 * Solver needs Stripe connected for merge payout.
 */
export function solverNeedsStripeForMergeComment(
  username: string,
  prNumber: number
): string {
  return `
${username} The solver needs to connect Stripe before payout: https://bounty.new/settings/payments

Then run \`/merge ${prNumber}\` again.
`;
}

/**
 * Payout already processing.
 */
export const payoutInProgressComment = `
Payout is already processing.
`;

/**
 * Payout failed.
 */
export const payoutErrorComment = `
Something went wrong releasing the payout. Try again or contact support.
`;

/**
 * Bounty not funded, can't merge.
 */
export function bountyNotFundedForMergeComment(bountyId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  return `
This bounty isn't funded yet. Fund it at ${baseUrl}/bounty/${bountyId}, then run \`/merge\` again.
`;
}

// ============================================================================
// ERRORS: REAPPROVE
// ============================================================================

/**
 * No permission to reapprove.
 */
export const noPermissionToReapproveComment = `
You don't have permission to approve submissions. This requires admin, maintainer, or write access.
`;

/**
 * Missing PR number for reapprove.
 */
export const reapproveMissingPrComment = `
Include a PR number: \`/reapprove 123\`
`;

/**
 * Already approved, just merge.
 */
export function reapproveAlreadyApprovedComment(prNumber: number): string {
  return `
Already approved. Merge the PR and confirm with \`/merge ${prNumber}\`.
`;
}

// ============================================================================
// ERRORS: BOUNTY CREATION
// ============================================================================

/**
 * Invalid bounty amount.
 */
export function invalidAmountComment(amount: string): string {
  return `
Invalid amount: ${amount}. Must be between 0 and 1,000,000.
`;
}

/**
 * Invalid currency.
 */
export function invalidCurrencyComment(currency: string): string {
  return `
Invalid currency: ${currency}. Supported: USD, EUR, GBP.
`;
}

/**
 * No permission to create bounties.
 */
export const noPermissionToCreateComment = `
You don't have permission to create bounties. This requires admin, maintainer, or write access.
`;

/**
 * GitHub account not linked.
 */
export const githubNotLinkedComment = `
Your GitHub account isn't linked to a bounty.new account.

Link it at https://bounty.new/integrations, then try again.
`;

// ============================================================================
// ERRORS: MOVE
// ============================================================================

/**
 * No permission to move bounties.
 */
export const noPermissionToMoveComment = `
You don't have permission to move bounties. This requires admin, maintainer, or write access.
`;

/**
 * No bounty to move.
 */
export const noBountyToMoveComment = `
No bounty found on this issue.
`;

/**
 * Can't move to a PR.
 */
export const cannotMoveToPrComment = `
Can't move a bounty to a pull request. Specify an issue number.
`;

/**
 * Failed to validate target issue.
 */
export function failedToValidateTargetComment(
  targetIssueNumber: number
): string {
  return `
Couldn't validate issue #${targetIssueNumber}. Make sure it exists and isn't a pull request.
`;
}

/**
 * PR doesn't reference issue (for move).
 */
export function prDoesNotReferenceIssueForMoveComment(
  prNumber: number
): string {
  return `
PR #${prNumber} doesn't reference this issue. Add "Fixes #${prNumber}" to the PR description and try again.
`;
}

/**
 * Can't determine which issue a PR belongs to.
 */
export function cannotTellIssueComment(): string {
  return `
Couldn't determine which issue this PR is for. Add "Fixes #123" to the PR body, or unsubmit from the issue with \`/unsubmit <PR#>\`.
`;
}

/**
 * Can't determine which issue a PR belongs to (reapprove).
 */
export function cannotTellIssueForReapproveComment(): string {
  return `
Couldn't determine which issue this PR is for. Add "Fixes #123" to the PR body, or reapprove from the issue with \`/reapprove <PR#>\`.
`;
}

// ============================================================================
// ERRORS: GENERAL
// ============================================================================

/**
 * PR doesn't reference this issue.
 */
export function prDoesNotReferenceThisIssueComment(prNumber: number): string {
  return `
PR #${prNumber} doesn't reference this issue. Add "Fixes #${prNumber}" to the PR description and try again.
`;
}

/**
 * Can't tell which issue from PR comment.
 */
export const cannotTellWhichIssueComment = `
Couldn't determine which issue this PR is for. Add "Fixes #123" to the PR body, or unsubmit from the issue with \`/unsubmit <PR#>\`.
`;

/**
 * No submission found for PR.
 */
export function noSubmissionFoundGeneralComment(prNumber: number): string {
  return `
No submission found for PR #${prNumber}.
`;
}

/**
 * Bounty has an approved submission, closed to new ones.
 */
export const bountyNotAcceptingComment = `
This bounty already has an approved submission. To switch winners, use \`/unapprove <PR#>\` then \`/reapprove <PR#>\`.
`;

/**
 * Bounty already completed, can't unapprove.
 */
export const bountyAlreadyCompletedComment = `
This bounty is completed and can't be unapproved.
`;
