/**
 * Bot Comment Templates
 *
 * All GitHub bot comments live here.
 * Tone: friendly, concise, helpful. Like a teammate, not a system notification.
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

**Want to work on this?** Add \`@bountydotnew submit\` to your PR description, or comment \`/submit #PR_NUMBER\` on this issue.

**Created this bounty?** Fund it at [bounty.new](${baseUrl}/bounty/${bountyId}) to start reviewing submissions. Once funded, approve a PR with \`/approve #PR_NUMBER\` and confirm with \`/merge #PR_NUMBER\` after it's merged.

The bounty needs to be funded before approvals or payouts can happen.
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

**Want to work on this?** Add \`@bountydotnew submit\` to your PR description, or comment \`/submit #PR_NUMBER\` on this issue.

**Ready to pay out?** Approve a submission with \`/approve #PR_NUMBER\`, then merge the PR. Payment releases automatically on merge.

Payouts land within 2-3 business days.
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
Hey @${prAuthor}, got your submission for PR #${prNumber}! The bounty creator will take a look.

This is a free bounty, so there's no payout attached.
`;
  }

  if (isFunded) {
    return `
Hey @${prAuthor}, got your submission for PR #${prNumber}! The bounty creator will take a look.

When the PR gets merged, payout happens automatically. Funds land within 2-3 business days.
`;
  }

  return `
Hey @${prAuthor}, got your submission for PR #${prNumber}!

Heads up: this bounty isn't funded yet, so your submission will stay pending until the creator funds it.
`;
}

/**
 * Submission withdrawn.
 */
export function submissionWithdrawnComment(): string {
  return `
Submission withdrawn. No worries!
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
@${solverUsername} PR #${targetPrNumber} is approved!

This is a free bounty, so no payout will be issued.
@${approver} Go ahead and merge PR #${targetPrNumber}, then confirm with \`/merge ${targetPrNumber}\`.
`;
  }

  return `
@${solverUsername} PR #${targetPrNumber} is approved! Payout releases automatically when the PR is merged.

@${approver} Merge PR #${targetPrNumber} whenever you're ready to release the payout.
`;
}

/**
 * Submission already approved.
 */
export function submissionAlreadyApprovedComment(
  _targetPrNumber: number
): string {
  return `
This one's already approved. Just merge the PR to release the payout.
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
Approval for PR #${targetPrNumber} has been withdrawn. The bounty is open for submissions again.
`;
}

/**
 * Tried to unapprove something that isn't approved.
 */
export function notApprovedComment(targetPrNumber: number): string {
  return `
PR #${targetPrNumber} isn't currently approved, so there's nothing to unapprove.
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
Bounty complete! ${formattedAmount} is on its way.

Funds should land in the solver's Stripe account within 2-3 business days.
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
Hmm, I couldn't find PR #${prNumber}. Double-check the number and try again?
`;
}

/**
 * No bounty on this issue.
 */
export const noBountyFoundComment = `
There's no bounty on this issue.
`;

/**
 * Bounty already exists.
 */
export function bountyAlreadyExistsComment(bountyId: string): string {
  return `This issue already has a bounty: https://bounty.new/bounty/${bountyId}`;
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

Want to pick a different winner? Use \`/unapprove #PR_NUMBER\` first, then \`/approve #PR_NUMBER\` on the new one.
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
@${username} PR #${prNumber} isn't open. Reopen it and then run \`/submit ${prNumber}\`.
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
  return `@${prAuthor} PR #${prNumber} is already submitted. Sit tight while the bounty creator reviews it!`;
}

/**
 * Too many pending submissions.
 */
export function tooManyPendingComment(username: string): string {
  return `@${username} You already have 2 pending submissions for this bounty. Wait for one to be reviewed before submitting another.`;
}

/**
 * Generic submission failure.
 */
export function submissionFailedComment(prAuthor: string): string {
  return `@${prAuthor} Something went wrong submitting this PR. Make sure it's open and linked to this issue, then try again.`;
}

/**
 * Can't unsubmit, wrong status.
 */
export function cannotUnsubmitComment(status: string): string {
  return `
Can't unsubmit — this submission is already ${status}.
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
@${username} You need admin, maintainer, or write access to approve submissions.
`;
}

/**
 * Missing PR number in approve command.
 */
export function approveMissingPrComment(username: string): string {
  return `
@${username} Which PR? Try \`/approve #PR_NUMBER\`
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
@${username} This bounty needs to be funded first. Fund it at [bounty.new](${baseUrl}/bounty/${bountyId}), then run \`/approve\` again.
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

@${prAuthor} can submit by adding \`@bountydotnew submit\` to the PR description, or commenting \`/submit ${prNumber}\` on this issue.
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
${username} The solver needs to set up Stripe before we can approve: https://bounty.new/settings/payments

Once that's done, run \`/approve ${prNumber}\` again.
`;
}

// ============================================================================
// ERRORS: UNSUBMIT
// ============================================================================

/**
 * Missing PR number in unsubmit command.
 */
export const unsubmitMissingPrComment = `
Which PR? Try \`/unsubmit 123\`
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
Which PR? Try \`/merge 123\`
`;

/**
 * No permission to confirm merge.
 */
export const noPermissionToMergeComment = `
You need admin, maintainer, or write access to confirm merges.
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
${username} The solver needs to set up Stripe before payout: https://bounty.new/settings/payments

Once that's done, run \`/merge ${prNumber}\` again.
`;
}

/**
 * Payout already processing.
 */
export const payoutInProgressComment = `
Payout is already being processed. Hang tight!
`;

/**
 * Payout failed.
 */
export const payoutErrorComment = `
Something went wrong releasing the payout. Try again, or reach out to support if it keeps happening.
`;

/**
 * Bounty not funded, can't merge.
 */
export function bountyNotFundedForMergeComment(bountyId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  return `
This bounty needs to be funded first. Fund it at ${baseUrl}/bounty/${bountyId}, then run \`/merge\` again.
`;
}

// ============================================================================
// ERRORS: REAPPROVE
// ============================================================================

/**
 * No permission to reapprove.
 */
export const noPermissionToReapproveComment = `
You need admin, maintainer, or write access to approve submissions.
`;

/**
 * Missing PR number for reapprove.
 */
export const reapproveMissingPrComment = `
Which PR? Try \`/reapprove 123\`
`;

/**
 * Already approved, just merge.
 */
export function reapproveAlreadyApprovedComment(prNumber: number): string {
  return `
Already approved! Just merge the PR and confirm with \`/merge ${prNumber}\`.
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
Invalid amount: ${amount}. It needs to be between 0 and 1,000,000.
`;
}

/**
 * Invalid currency.
 */
export function invalidCurrencyComment(currency: string): string {
  return `
"${currency}" isn't a supported currency. We support USD, EUR, and GBP.
`;
}

/**
 * No permission to create bounties.
 */
export const noPermissionToCreateComment = `
You need admin, maintainer, or write access to create bounties.
`;

/**
 * GitHub account not linked.
 */
export const githubNotLinkedComment = `
Your GitHub account isn't linked to a bounty.new account yet.

Link it at https://bounty.new/integrations, then try again.
`;

// ============================================================================
// ERRORS: MOVE
// ============================================================================

/**
 * No permission to move bounties.
 */
export const noPermissionToMoveComment = `
You need admin, maintainer, or write access to move bounties.
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
Can't move a bounty to a pull request. Use an issue number instead.
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
Couldn't figure out which issue this PR is for. Add "Fixes #123" to the PR body, or unsubmit from the issue directly with \`/unsubmit <PR#>\`.
`;
}

/**
 * Can't determine which issue a PR belongs to (reapprove).
 */
export function cannotTellIssueForReapproveComment(): string {
  return `
Couldn't figure out which issue this PR is for. Add "Fixes #123" to the PR body, or reapprove from the issue with \`/reapprove <PR#>\`.
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
Couldn't figure out which issue this PR is for. Add "Fixes #123" to the PR body, or unsubmit from the issue with \`/unsubmit <PR#>\`.
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
This bounty already has an approved submission. Want to switch? Use \`/unapprove <PR#>\` then \`/reapprove <PR#>\`.
`;

/**
 * Bounty already completed, can't unapprove.
 */
export const bountyAlreadyCompletedComment = `
This bounty is already completed and can't be unapproved.
`;
