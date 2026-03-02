/**
 * Bot Comment Templates
 *
 * Central source of truth for all GitHub bot comments.
 * Edit these messages to change how the bot responds to commands.
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
// BOUNTY CREATION COMMENTS
// ============================================================================

/**
 * Comment posted when a bounty is created but not yet funded
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

${formattedAmount} • ${submissionCount} submissions

**For Contributors:**
Submit your solution by adding \`@bountydotnew submit\` to your PR description, or comment \`/submit #PR_NUMBER\` on this issue.

**For Bounty Creator:**
Fund this bounty at [bounty.new](${baseUrl}/bounty/${bountyId}) to start accepting submissions. After funding: approve with \`/approve #PR_NUMBER\`, then \`/merge #PR_NUMBER\` after merge.

> **Note:** Funding is required before approvals and payouts.
`;
}

/**
 * Comment posted when a bounty becomes funded
 */
export function fundedBountyComment(
  bountyId: string,
  submissionCount = 0
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  const buttonUrl = `${baseUrl}/bounty-button.svg`;
  return `
[![bounty.new](${buttonUrl})](${baseUrl}/bounty/${bountyId})

**Funded** • ${submissionCount} submissions

**For Contributors:**
Submit your solution by adding \`@bountydotnew submit\` to your PR description, or comment \`/submit #PR_NUMBER\` on this issue.

**For Bounty Creator:**
Review submissions and approve with \`/approve #PR_NUMBER\` on this issue. After merging the PR, confirm with \`/merge #PR_NUMBER\` to release payment.

> **Payout timing:** Once a PR is merged, payouts are released within 2-3 business days while funds clear from the original payment.
`;
}

// ============================================================================
// SUBMISSION COMMENTS
// ============================================================================

/**
 * Comment posted when a PR is submitted for a bounty
 */
export function submissionReceivedComment(
  isFunded: boolean,
  prAuthor: string,
  prNumber: number
): string {
  if (isFunded) {
    return `
**Submission Received**

@${prAuthor} Your PR #${prNumber} has been submitted for this bounty. The bounty creator will review it shortly.

You'll be notified here when your submission is approved. Once approved and merged, payment will be released within 2-3 business days while funds clear.
`;
  }

  return `
**Submission Received**

@${prAuthor} Your PR #${prNumber} has been submitted for this bounty.

**Note**: This bounty isn't funded yet. Your submission will remain pending until the bounty creator funds it. You'll be notified when funding is complete.
`;
}

/**
 * Comment posted when a submission is withdrawn
 */
export function submissionWithdrawnComment(): string {
  return `

Submission withdrawn.

`;
}

/**
 * Comment posted when a submission is successfully withdrawn via command
 */
export function submissionWithdrawnConfirmation(
  targetPrNumber: number
): string {
  return `

Submission for PR #${targetPrNumber} has been withdrawn.

`;
}

// ============================================================================
// APPROVAL COMMENTS
// ============================================================================

/**
 * Comment posted when a submission is approved
 */
export function submissionApprovedComment(
  solverUsername: string,
  approver: string,
  targetPrNumber: number
): string {
  return `
**Submission Approved**

@${solverUsername} Your submission (PR #${targetPrNumber}) has been approved. Once the PR is merged, payment will be released within 2-3 business days while funds clear.

@${approver} To complete the payout:
1. Merge PR #${targetPrNumber}
2. Confirm with \`/merge ${targetPrNumber}\` on this issue (or \`@bountydotnew merge\` on the PR)
`;
}

/**
 * Comment posted when a submission is already approved (user tries to approve again)
 */
export function submissionAlreadyApprovedComment(
  targetPrNumber: number
): string {
  return `

This submission is already approved. When you're ready, merge the PR and confirm with \`/merge ${targetPrNumber}\`.

`;
}

// ============================================================================
// UNAPPROVE COMMENTS
// ============================================================================

/**
 * Comment posted when a submission approval is withdrawn
 */
export function approvalWithdrawnComment(targetPrNumber: number): string {
  return `

Approval withdrawn for PR #${targetPrNumber}. The bounty is open for another submission.

`;
}

/**
 * Comment posted when trying to unapprove a submission that isn't approved
 */
export function notApprovedComment(targetPrNumber: number): string {
  return `

PR #${targetPrNumber} isn't approved, so there's nothing to unapprove.

`;
}

// ============================================================================
// COMPLETION COMMENTS
// ============================================================================

/**
 * Comment posted when a bounty is completed and paid out
 */
export function bountyCompletedComment(
  amount: number,
  currency = 'USD'
): string {
  const formattedAmount = formatCurrency(amount, currency);
  return `

Bounty completed! Payment of ${formattedAmount} released.

The solver will receive funds in their Stripe account within 2-3 business days.

`;
}

/**
 * Comment posted when trying to act on an already paid bounty
 */
export function bountyAlreadyPaidComment(): string {
  return `

This bounty has already been paid out.

`;
}

// ============================================================================
// BOUNTY MOVED COMMENT
// ============================================================================

/**
 * Comment posted when a bounty is moved to a different issue
 */
export function bountyMovedComment(targetIssueNumber: number): string {
  return `

Bounty moved to issue #${targetIssueNumber}.

`;
}

// ============================================================================
// ERROR MESSAGES - VALIDATION
// ============================================================================

/**
 * Error: PR not found
 */
export function prNotFoundComment(prNumber: number): string {
  return `
I couldn't find PR #${prNumber}. Double-check the number and try again.
`;
}

/**
 * Error: No bounty found for this issue
 */
export const noBountyFoundComment = `

No bounty found for this issue.

`;

/**
 * Error: Bounty already exists
 */
export function bountyAlreadyExistsComment(bountyId: string): string {
  return `A bounty already exists for this issue. View it at https://bounty.new/bounty/${bountyId}`;
}

// ============================================================================
// ERROR MESSAGES - SUBMISSION
// ============================================================================

/**
 * Error: Bounty already has approved submission
 */
export function bountyClosedComment(username: string): string {
  return `
@${username} This bounty already has an approved submission — new submissions are closed.

**If you're the bounty creator** and want to switch winners:
- Use \`/unapprove #PR_NUMBER\` to unapprove the current winner
- Then \`/approve #PR_NUMBER\` to approve a different submission
`;
}

/**
 * Error: PR is not open (for submission)
 */
export function prNotOpenForSubmitComment(
  username: string,
  prNumber: number
): string {
  return `
@${username} PR #${prNumber} isn't open.

Please reopen the PR first, then try submitting again with \`/submit ${prNumber}\`.
`;
}

/**
 * Error: User can't submit someone else's PR
 */
export function cannotSubmitOthersPrComment(
  username: string,
  prAuthor: string
): string {
  return `
@${username} You can't submit someone else's PR.

Only **@${prAuthor}** (the PR author) or a repo maintainer can submit this PR.
`;
}

/**
 * Error: PR already submitted
 */
export function alreadySubmittedComment(
  prAuthor: string,
  prNumber: number
): string {
  return `@${prAuthor} PR #${prNumber} is already submitted for this bounty. No action needed — just wait for the bounty creator to review it.`;
}

/**
 * Error: Too many pending submissions
 */
export function tooManyPendingComment(username: string): string {
  return `@${username} You already have 2 pending submissions for this bounty. Wait for one to be reviewed before submitting again.`;
}

/**
 * Error: Generic submission failure
 */
export function submissionFailedComment(prAuthor: string): string {
  return `@${prAuthor} Could not submit this PR. Please try again or check that the PR is open and linked to this issue.`;
}

/**
 * Error: Submission can't be withdrawn (not pending status)
 */
export function cannotUnsubmitComment(status: string): string {
  return `

This submission can't be unsubmitted because it's already ${status}.

`;
}

// ============================================================================
// ERROR MESSAGES - APPROVAL
// ============================================================================

/**
 * Error: User doesn't have permission to approve
 */
export function noPermissionToApproveComment(username: string): string {
  return `
@${username} You don't have permission to approve submissions on this repository.

Only repo **admins**, **maintainers**, or **collaborators with write access** can approve submissions.
`;
}

/**
 * Error: Missing PR number in approve command
 */
export function approveMissingPrComment(username: string): string {
  return `
@${username} Please include a PR number to approve.

**Usage:** \`/approve #PR_NUMBER\`
**Example:** \`/approve 123\`
`;
}

/**
 * Error: Bounty not funded
 */
export function bountyNotFundedComment(
  username: string,
  bountyId: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  return `
@${username} This bounty isn't funded yet.

**To approve submissions**, first fund the bounty at [bounty.new](${baseUrl}/bounty/${bountyId}).

After funding, run \`/approve\` again.
`;
}

/**
 * Error: No submission found for approval
 */
export function noSubmissionFoundComment(
  username: string,
  prNumber: number,
  prAuthor: string
): string {
  return `
@${username} No submission found for PR #${prNumber}.

The PR author needs to submit first. Ask **@${prAuthor}** to:
- Add \`@bountydotnew submit\` to their PR description, or
- Comment \`/submit ${prNumber}\` on this issue
`;
}

/**
 * Error: Solver needs to connect Stripe
 */
export function solverNeedsStripeComment(
  username: string,
  prNumber: number
): string {
  return `
${username} The solver needs to connect Stripe before approval. Ask them to visit https://bounty.new/settings/payments, then re-run \`/approve ${prNumber}\`.
`;
}

// ============================================================================
// ERROR MESSAGES - UNSUBMIT
// ============================================================================

/**
 * Error: Missing PR number in unsubmit command
 */
export const unsubmitMissingPrComment = `

Please include a PR number, like \`/unsubmit 123\`.

`;

/**
 * Error: Cannot unsubmit someone else's PR
 */
export function cannotUnsubmitOthersPrComment(): string {
  return `

Only the PR author (or a repo maintainer) can unsubmit this PR.

`;
}

// ============================================================================
// ERROR MESSAGES - MERGE
// ============================================================================

/**
 * Error: Missing PR number in merge command
 */
export const mergeMissingPrComment = `

Please include a PR number, like \`/merge 123\`.

`;

/**
 * Error: No permission to confirm merge
 */
export const noPermissionToMergeComment = `

Sorry, you don't have permission to confirm merges on this repository. Only repo admins, maintainers, or writers can do this.

`;

/**
 * Error: PR doesn't reference the issue (for merge)
 */
export function prDoesNotReferenceIssueComment(issueNumber: number): string {
  return `

PR doesn't reference this issue. Add "Fixes #${issueNumber}" (or similar) to the PR description and try again.

`;
}

/**
 * Error: No submission found when trying to merge
 */
export function noSubmissionForMergeComment(prNumber: number): string {
  return `
I couldn't find a submission for PR #${prNumber}. Ask the contributor to submit first with \`/submit ${prNumber}\`.
`;
}

/**
 * Error: Submission not approved yet
 */
export function notApprovedForMergeComment(prNumber: number): string {
  return `

Please approve the submission first with \`/approve ${prNumber}\`, then confirm the merge.

`;
}

/**
 * Error: PR not merged yet
 */
export function prNotMergedComment(prNumber: number): string {
  return `

PR #${prNumber} isn't merged yet. Merge it, then run \`/merge ${prNumber}\` again. Merging triggers the payout.

`;
}

/**
 * Error: Solver needs to connect Stripe (for merge)
 */
export function solverNeedsStripeForMergeComment(
  username: string,
  prNumber: number
): string {
  return `
${username} The solver needs to connect Stripe before payout. Ask them to visit https://bounty.new/settings/payments, then re-run \`/merge ${prNumber}\`.
`;
}

/**
 * Error: Payout already being processed
 */
export const payoutInProgressComment = `

Payout is already being processed. Try again in a minute.

`;

/**
 * Error: Something went wrong with payout
 */
export const payoutErrorComment = `

Something went wrong releasing the payout. Please try again or contact support.

`;

/**
 * Error: Bounty not funded (for merge)
 */
export function bountyNotFundedForMergeComment(bountyId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://bounty.new';
  return `
This bounty isn't funded yet. Fund it at ${baseUrl}/bounty/${bountyId}, then run \`/merge\` to release the payout.
`;
}

// ============================================================================
// ERROR MESSAGES - REAPPROVE
// ============================================================================

/**
 * Error: No permission to reapprove
 */
export const noPermissionToReapproveComment = `

Sorry, you don't have permission to approve submissions on this repository. Only repo admins, maintainers, or writers can do this.

`;

/**
 * Error: Missing PR number for reapprove
 */
export const reapproveMissingPrComment = `

Please include a PR number, like \`/reapprove 123\`.

`;

/**
 * Error: Reapproving already approved submission
 */
export function reapproveAlreadyApprovedComment(prNumber: number): string {
  return `

This submission is already approved. When you're ready, merge the PR and confirm with \`/merge ${prNumber}\`.

`;
}

// ============================================================================
// ERROR MESSAGES - BOUNTY CREATION
// ============================================================================

/**
 * Error: Invalid bounty amount
 */
export function invalidAmountComment(amount: string): string {
  return `

Invalid bounty amount: ${amount}. Amount must be greater than 0 and less than or equal to 1,000,000.

`;
}

/**
 * Error: Invalid currency
 */
export function invalidCurrencyComment(currency: string): string {
  return `

Invalid currency: ${currency}. Supported currencies are USD, EUR, and GBP.

`;
}

/**
 * Error: No permission to create bounties
 */
export const noPermissionToCreateComment = `

Sorry, you don't have permission to create bounties on this repository. Only repo admins, maintainers, or writers can do this.

`;

/**
 * Error: GitHub account not linked
 */
export const githubNotLinkedComment = `

Could not create bounty: Your GitHub account is not linked to a bounty.new account.

Please visit https://bounty.new/integrations to link your GitHub account, then try again.

`;

// ============================================================================
// ERROR MESSAGES - MOVE COMMAND
// ============================================================================

/**
 * Error: No permission to move bounties
 */
export const noPermissionToMoveComment = `

Sorry, you don't have permission to move bounties on this repository. Only repo admins, maintainers, or writers can move bounties.

`;

/**
 * Error: No bounty to move
 */
export const noBountyToMoveComment = `

No bounty found for this issue. Cannot move.

`;

/**
 * Error: Cannot move to a PR
 */
export const cannotMoveToPrComment = `

Cannot move bounty to a pull request. Please specify an issue number.

`;

/**
 * Error: Failed to validate target issue
 */
export function failedToValidateTargetComment(
  targetIssueNumber: number
): string {
  return `

Failed to validate target issue #${targetIssueNumber}. Please ensure it exists and is an issue (not a pull request).

`;
}

/**
 * Error: PR doesn't reference issue (for move)
 */
export function prDoesNotReferenceIssueForMoveComment(
  prNumber: number
): string {
  return `

PR #${prNumber} doesn't reference this issue. Add "Fixes #${prNumber}" (or similar) to the PR description and try again.

`;
}

/**
 * Error: Can't tell which issue PR is for
 */
export function cannotTellIssueComment(): string {
  return `

I couldn't tell which issue this PR is for. Add "Fixes #123" to the PR body or unsubmit from the issue with \`/unsubmit <PR#>\`.

`;
}

/**
 * Error: Can't tell which issue PR is for (for reapprove)
 */
export function cannotTellIssueForReapproveComment(): string {
  return `

I couldn't tell which issue this PR is for. Add "Fixes #123" to the PR body or reapprove from the issue with \`/reapprove <PR#>\`.

`;
}

// ============================================================================
// ERROR MESSAGES - GENERAL
// ============================================================================

/**
 * Error: Cannot tell which issue PR is for (general)
 */
export function prDoesNotReferenceThisIssueComment(prNumber: number): string {
  return `
PR #${prNumber} doesn't reference this issue. Add "Fixes #${prNumber}" (or similar) to the PR description and try again.
`;
}

/**
 * Error: Cannot tell which issue PR is for (from PR comment)
 */
export const cannotTellWhichIssueComment = `

I couldn't tell which issue this PR is for. Add "Fixes #123" to the PR body or unsubmit from the issue with \`/unsubmit <PR#>\`.

`;

/**
 * Error: No submission found for PR (general)
 */
export function noSubmissionFoundGeneralComment(prNumber: number): string {
  return `
I couldn't find a submission for PR #${prNumber}.

`;
}

/**
 * Error: Bounty in_progress or completed
 */
export const bountyNotAcceptingComment = `

This bounty already has an approved submission. New submissions are closed. If you need to switch winners, use \`/unapprove <PR#>\` or \`/reapprove <PR#>\`.

`;

/**
 * Error: Bounty already completed
 */
export const bountyAlreadyCompletedComment = `

This bounty is already completed and can't be unapproved.

`;
