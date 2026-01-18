// Bot command parser for GitHub issue comments
// Handles commands like:
// - @bountydotnew 100
// - @bountydotnew 100 USD
// - @bountydotnew submit
// - @bountydotnew submit This is my submission

export interface BountyCreateCommand {
  action: 'create';
  amount: number;
  currency: string;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountySubmitCommand {
  action: 'submit';
  description?: string;
  prNumber?: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountyUnsubmitCommand {
  action: 'unsubmit';
  prNumber?: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountyApproveCommand {
  action: 'approve';
  prNumber?: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountyUnapproveCommand {
  action: 'unapprove';
  prNumber?: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountyReapproveCommand {
  action: 'reapprove';
  prNumber?: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountyMergeCommand {
  action: 'merge';
  prNumber?: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export interface BountyMoveCommand {
  action: 'move';
  targetIssueNumber: number;
  match: string;
  startIndex: number;
  endIndex: number;
}

export type BountyCommand =
  | BountyCreateCommand
  | BountySubmitCommand
  | BountyUnsubmitCommand
  | BountyApproveCommand
  | BountyUnapproveCommand
  | BountyReapproveCommand
  | BountyMergeCommand
  | BountyMoveCommand
  | null;

// Regex patterns
const BOT_MENTION_PATTERN = /@bountydotnew\b/i;
const ISSUE_URL_PATTERN = /github\.com\/([^/]+)\/([^/]+)\/issues\/(\d+)/i;
const PULL_REQUEST_URL_PATTERN = /github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/i;

// Combined regex for bounty creation: @bountydotnew [amount] [currency?]
const BOUNTY_CREATE_PATTERN =
  /@bountydotnew\s+(\d{1,13}(?:[.,]\d{1,2})?)\s*(USD|EUR|GBP)?/i;

// Regex for submission: /submit #123 or @bountydotnew submit #123 [description?]
const SUBMIT_ISSUE_PATTERN = /(?:^|\s)\/submit\s+#?(\d+)/i;
const SUBMIT_PATTERN = /@bountydotnew\s+submit(?:\s+#?(\d+))?(?:\s+(.+?))?$/im;

// Regex for unsubmit: /unsubmit #123 or @bountydotnew unsubmit #123
const UNSUBMIT_ISSUE_PATTERN = /(?:^|\s)\/unsubmit\s+#?(\d+)/i;
const UNSUBMIT_PATTERN = /@bountydotnew\s+unsubmit(?:\s+#?(\d+))?$/im;

// Regex for approval: /approve #123 or @bountydotnew approve
const APPROVE_ISSUE_PATTERN = /(?:^|\s)\/approve\s+#?(\d+)/i;
const APPROVE_PATTERN = /@bountydotnew\s+approve\b/i;

// Regex for unapprove: /unapprove #123 or @bountydotnew unapprove
const UNAPPROVE_ISSUE_PATTERN = /(?:^|\s)\/unapprove\s+#?(\d+)/i;
const UNAPPROVE_PATTERN = /@bountydotnew\s+unapprove\b/i;

// Regex for reapprove: /reapprove #123 or @bountydotnew reapprove
const REAPPROVE_ISSUE_PATTERN = /(?:^|\s)\/reapprove\s+#?(\d+)/i;
const REAPPROVE_PATTERN = /@bountydotnew\s+reapprove\b/i;

// Regex for merge confirmation: /merge #123 or @bountydotnew merge
const MERGE_ISSUE_PATTERN = /(?:^|\s)\/merge\s+#?(\d+)/i;
const MERGE_PATTERN = /@bountydotnew\s+merge\b/i;

// Regex for move: @bountydotnew move #123
const MOVE_PATTERN = /@bountydotnew\s+move\s+#?(\d+)/i;

/**
 * Parse a comment body for bounty bot commands
 */
export function parseBotCommand(commentBody: string): BountyCommand {
  if (!commentBody || typeof commentBody !== 'string') {
    return null;
  }

  const hasMention = BOT_MENTION_PATTERN.test(commentBody);
  const hasSlashCommand = [
    SUBMIT_ISSUE_PATTERN,
    UNSUBMIT_ISSUE_PATTERN,
    APPROVE_ISSUE_PATTERN,
    UNAPPROVE_ISSUE_PATTERN,
    REAPPROVE_ISSUE_PATTERN,
    MERGE_ISSUE_PATTERN,
  ].some((pattern) => pattern.test(commentBody));

  if (hasMention || hasSlashCommand) {
    return (
      parseCreateCommand(commentBody) ||
      parseSubmitCommand(commentBody) ||
      parseUnsubmitCommand(commentBody) ||
      parseApproveCommand(commentBody) ||
      parseUnapproveCommand(commentBody) ||
      parseReapproveCommand(commentBody) ||
      parseMergeCommand(commentBody) ||
      parseMoveCommand(commentBody)
    );
  }

  return null;
}

function parseCreateCommand(commentBody: string): BountyCreateCommand | null {
  const createMatch = commentBody.match(BOUNTY_CREATE_PATTERN);
  if (!createMatch) {
    return null;
  }
  const amountStr = createMatch[1]?.replace(',', '.') || '0';
  const amount = Number.parseFloat(amountStr);
  if (amount <= 0) {
    return null;
  }
  const currency = createMatch[2]?.toUpperCase() || 'USD';
  return {
    action: 'create',
    amount,
    currency,
    match: createMatch[0],
    startIndex: createMatch.index || 0,
    endIndex: (createMatch.index || 0) + createMatch[0].length,
  };
}

function parseSubmitCommand(commentBody: string): BountySubmitCommand | null {
  const submitIssueMatch = commentBody.match(SUBMIT_ISSUE_PATTERN);
  if (submitIssueMatch) {
    const prNumber = Number.parseInt(submitIssueMatch[1] || '0', 10);
    if (prNumber > 0) {
      return {
        action: 'submit',
        prNumber,
        match: submitIssueMatch[0],
        startIndex: submitIssueMatch.index || 0,
        endIndex: (submitIssueMatch.index || 0) + submitIssueMatch[0].length,
      };
    }
  }

  const submitMatch = commentBody.match(SUBMIT_PATTERN);
  if (!submitMatch) {
    return null;
  }
  const command: BountySubmitCommand = {
    action: 'submit',
    match: submitMatch[0],
    startIndex: submitMatch.index || 0,
    endIndex: (submitMatch.index || 0) + submitMatch[0].length,
  };
  const prNumber = submitMatch[1] ? Number.parseInt(submitMatch[1], 10) : undefined;
  if (prNumber && prNumber > 0) {
    command.prNumber = prNumber;
  }
  const description = (submitMatch[2] || '').trim();
  if (description) {
    command.description = description;
  }
  return command;
}

function parseUnsubmitCommand(commentBody: string): BountyUnsubmitCommand | null {
  const unsubmitIssueMatch = commentBody.match(UNSUBMIT_ISSUE_PATTERN);
  if (unsubmitIssueMatch) {
    const prNumber = Number.parseInt(unsubmitIssueMatch[1] || '0', 10);
    if (prNumber > 0) {
      return {
        action: 'unsubmit',
        prNumber,
        match: unsubmitIssueMatch[0],
        startIndex: unsubmitIssueMatch.index || 0,
        endIndex: (unsubmitIssueMatch.index || 0) + unsubmitIssueMatch[0].length,
      };
    }
  }

  const unsubmitMatch = commentBody.match(UNSUBMIT_PATTERN);
  if (!unsubmitMatch) {
    return null;
  }

  const command: BountyUnsubmitCommand = {
    action: 'unsubmit',
    match: unsubmitMatch[0],
    startIndex: unsubmitMatch.index || 0,
    endIndex: (unsubmitMatch.index || 0) + unsubmitMatch[0].length,
  };
  const prNumber = unsubmitMatch[1] ? Number.parseInt(unsubmitMatch[1], 10) : undefined;
  if (prNumber && prNumber > 0) {
    command.prNumber = prNumber;
  }
  return command;
}

function parseApproveCommand(commentBody: string): BountyApproveCommand | null {
  const approveIssueMatch = commentBody.match(APPROVE_ISSUE_PATTERN);
  if (approveIssueMatch) {
    const prNumber = Number.parseInt(approveIssueMatch[1] || '0', 10);
    if (prNumber > 0) {
      return {
        action: 'approve',
        prNumber,
        match: approveIssueMatch[0],
        startIndex: approveIssueMatch.index || 0,
        endIndex: (approveIssueMatch.index || 0) + approveIssueMatch[0].length,
      };
    }
  }

  const approveMatch = commentBody.match(APPROVE_PATTERN);
  if (!approveMatch) {
    return null;
  }
  return {
    action: 'approve',
    match: approveMatch[0],
    startIndex: approveMatch.index || 0,
    endIndex: (approveMatch.index || 0) + approveMatch[0].length,
  };
}

function parseUnapproveCommand(commentBody: string): BountyUnapproveCommand | null {
  const unapproveIssueMatch = commentBody.match(UNAPPROVE_ISSUE_PATTERN);
  if (unapproveIssueMatch) {
    const prNumber = Number.parseInt(unapproveIssueMatch[1] || '0', 10);
    if (prNumber > 0) {
      return {
        action: 'unapprove',
        prNumber,
        match: unapproveIssueMatch[0],
        startIndex: unapproveIssueMatch.index || 0,
        endIndex: (unapproveIssueMatch.index || 0) + unapproveIssueMatch[0].length,
      };
    }
  }

  const unapproveMatch = commentBody.match(UNAPPROVE_PATTERN);
  if (!unapproveMatch) {
    return null;
  }
  return {
    action: 'unapprove',
    match: unapproveMatch[0],
    startIndex: unapproveMatch.index || 0,
    endIndex: (unapproveMatch.index || 0) + unapproveMatch[0].length,
  };
}

function parseReapproveCommand(commentBody: string): BountyReapproveCommand | null {
  const reapproveIssueMatch = commentBody.match(REAPPROVE_ISSUE_PATTERN);
  if (reapproveIssueMatch) {
    const prNumber = Number.parseInt(reapproveIssueMatch[1] || '0', 10);
    if (prNumber > 0) {
      return {
        action: 'reapprove',
        prNumber,
        match: reapproveIssueMatch[0],
        startIndex: reapproveIssueMatch.index || 0,
        endIndex: (reapproveIssueMatch.index || 0) + reapproveIssueMatch[0].length,
      };
    }
  }

  const reapproveMatch = commentBody.match(REAPPROVE_PATTERN);
  if (!reapproveMatch) {
    return null;
  }
  return {
    action: 'reapprove',
    match: reapproveMatch[0],
    startIndex: reapproveMatch.index || 0,
    endIndex: (reapproveMatch.index || 0) + reapproveMatch[0].length,
  };
}

function parseMergeCommand(commentBody: string): BountyMergeCommand | null {
  const mergeIssueMatch = commentBody.match(MERGE_ISSUE_PATTERN);
  if (mergeIssueMatch) {
    const prNumber = Number.parseInt(mergeIssueMatch[1] || '0', 10);
    if (prNumber > 0) {
      return {
        action: 'merge',
        prNumber,
        match: mergeIssueMatch[0],
        startIndex: mergeIssueMatch.index || 0,
        endIndex: (mergeIssueMatch.index || 0) + mergeIssueMatch[0].length,
      };
    }
  }

  const mergeMatch = commentBody.match(MERGE_PATTERN);
  if (!mergeMatch) {
    return null;
  }
  return {
    action: 'merge',
    match: mergeMatch[0],
    startIndex: mergeMatch.index || 0,
    endIndex: (mergeMatch.index || 0) + mergeMatch[0].length,
  };
}

function parseMoveCommand(commentBody: string): BountyMoveCommand | null {
  const moveMatch = commentBody.match(MOVE_PATTERN);
  if (!moveMatch) {
    return null;
  }
  const targetIssueNumber = Number.parseInt(moveMatch[1] || '0', 10);
  if (targetIssueNumber <= 0) {
    return null;
  }
  return {
    action: 'move',
    targetIssueNumber,
    match: moveMatch[0],
    startIndex: moveMatch.index || 0,
    endIndex: (moveMatch.index || 0) + moveMatch[0].length,
  };
}

/**
 * Check if a PR description contains the submission keyword
 */
export function containsSubmissionKeyword(
  prBody: string | null | undefined,
  keyword = '@bountydotnew submit'
): boolean {
  if (!prBody) {
    return false;
  }

  // Check for the keyword (case-insensitive)
  const pattern = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  return pattern.test(prBody);
}

/**
 * Extract submission description from PR body
 */
export function extractSubmissionDescription(
  prBody: string | null | undefined,
  keyword = '@bountydotnew submit'
): string {
  if (!prBody) {
    return '';
  }

  // Find the keyword and extract text after it
  const pattern = new RegExp(
    `${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(.+?)(?:\\n|$)`,
    'i'
  );
  const match = prBody.match(pattern);

  return match?.[1]?.trim() || '';
}

/**
 * Validate bounty amount
 */
export function isValidBountyAmount(amount: number): boolean {
  return (
    Number.isFinite(amount) &&
    amount > 0 &&
    amount <= 1_000_000 // Max 1 million
  );
}

/**
 * Validate currency code
 */
export function isValidCurrency(currency: string): boolean {
  return ['USD', 'EUR', 'GBP'].includes(currency.toUpperCase());
}

/**
 * Parse issue URL to extract owner, repo, and issue number
 */
export function parseIssueUrl(
  issueUrl: string
): { owner: string; repo: string; issueNumber: number } | null {
  const match = issueUrl.match(ISSUE_URL_PATTERN);

  if (!match) {
    return null;
  }

  return {
    owner: match[1] || '',
    repo: match[2] || '',
    issueNumber: Number.parseInt(match[3] || '0', 10),
  };
}

/**
 * Parse PR URL to extract owner, repo, and PR number
 */
export function parsePullRequestUrl(
  prUrl: string
): { owner: string; repo: string; prNumber: number } | null {
  const match = prUrl.match(PULL_REQUEST_URL_PATTERN);

  if (!match) {
    return null;
  }

  return {
    owner: match[1] || '',
    repo: match[2] || '',
    prNumber: Number.parseInt(match[3] || '0', 10),
  };
}
