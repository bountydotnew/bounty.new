import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
  bigint,
  boolean,
  decimal,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const bountyStatusEnum = pgEnum('bounty_status', [
  'draft',
  'open',
  'in_progress',
  'completed',
  'cancelled',
]);
export const submissionStatusEnum = pgEnum('submission_status', [
  'pending',
  'approved',
  'rejected',
  'revision_requested',
]);
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'held',
  'released',
  'refunded',
  'failed',
]);

export const cancellationRequestStatusEnum = pgEnum('cancellation_request_status', [
  'pending',
  'approved',
  'rejected',
  'withdrawn',
]);

export const bounty = pgTable(
  'bounty',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    title: text('title').notNull(),
    description: text('description').notNull(),
    amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
    currency: text('currency').notNull().default('USD'),
    status: bountyStatusEnum('status').notNull().default('draft'),
    deadline: timestamp('deadline'),
    tags: text('tags').array(),
    repositoryUrl: text('repository_url'),
    issueUrl: text('issue_url'),
    // GitHub App integration fields
    githubIssueNumber: integer('github_issue_number'),
    githubInstallationId: integer('github_installation_id'),
    githubRepoOwner: text('github_repo_owner'),
    githubRepoName: text('github_repo_name'),
    githubCommentId: bigint('github_comment_id', { mode: 'number' }), // For editing bot comments
    // Linear integration fields
    linearIssueId: text('linear_issue_id').unique(),
    linearIssueIdentifier: text('linear_issue_identifier'), // e.g., "ENG-123"
    linearIssueUrl: text('linear_issue_url'),
    linearAccountId: text('linear_account_id'), // Reference to linear_account.id
    linearCommentId: text('linear_comment_id'), // For editing bot comments
    submissionKeyword: text('submission_keyword').default('@bountydotnew submit'),
    createdById: text('created_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    assignedToId: text('assigned_to_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    isFeatured: boolean('is_featured').default(false).notNull(),
    // Stripe payment fields
    stripePaymentIntentId: text('stripe_payment_intent_id'),
    stripeCheckoutSessionId: text('stripe_checkout_session_id'),
    stripeTransferId: text('stripe_transfer_id'),
    paymentStatus: paymentStatusEnum('payment_status').default('pending'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    // Speeds up ORDER BY created_at DESC which is used in nearly all listing queries
    index('bounty_created_at_idx').on(t.createdAt),
    // Composite: status filter + date sort (the most common listing query pattern)
    // Also satisfies status-only queries since status is the leading column
    index('bounty_status_created_at_idx').on(t.status, t.createdAt),
    // Composite: user's bounties sorted by date (getBountiesByUserId, getHighlights)
    // Also satisfies createdById-only queries since createdById is the leading column
    index('bounty_created_by_id_created_at_idx').on(t.createdById, t.createdAt),
    // GIN index for array overlap queries on tags (fetchAllBounties tag filtering)
    index('bounty_tags_idx').using('gin', t.tags),
  ]
);

export const submission = pgTable(
  'submission',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    contributorId: text('contributor_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    deliverableUrl: text('deliverable_url').notNull(),
    pullRequestUrl: text('pull_request_url'),
    // GitHub PR integration fields
    githubPullRequestNumber: integer('github_pull_request_number'),
    githubPullRequestId: bigint('github_pull_request_id', { mode: 'number' }),
    githubCommentId: bigint('github_comment_id', { mode: 'number' }),
    githubUsername: text('github_username'),
    githubHeadSha: text('github_head_sha'), // For tracking the commit
    status: submissionStatusEnum('status').notNull().default('pending'),
    reviewNotes: text('review_notes'),
    submittedAt: timestamp('submitted_at').notNull().default(sql`now()`),
    reviewedAt: timestamp('reviewed_at'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    // Speeds up getBountyStatsMany count queries and submission lookups per bounty
    index('submission_bounty_id_idx').on(t.bountyId),
    // Speeds up lookups by contributor (user's submissions)
    index('submission_contributor_id_idx').on(t.contributorId),
    // Speeds up filtering submissions by status
    index('submission_status_idx').on(t.status),
  ]
);

export const bountyApplication = pgTable(
  'bounty_application',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    applicantId: text('applicant_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    message: text('message').notNull(),
    isAccepted: boolean('is_accepted').default(false),
    appliedAt: timestamp('applied_at').notNull().default(sql`now()`),
    respondedAt: timestamp('responded_at'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    // Speeds up duplicate application check (WHERE bounty_id = ? AND applicant_id = ?)
    // Also satisfies bountyId-only queries since it is the leading column
    uniqueIndex('bounty_application_unique_idx').on(t.bountyId, t.applicantId),
  ]
);

export const bountyVote = pgTable(
  'bounty_vote',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex('bounty_vote_unique_idx').on(t.bountyId, t.userId),
    // bounty_vote_bounty_id_idx removed: redundant with bounty_vote_unique_idx (leading column)
    index('bounty_vote_user_id_idx').on(t.userId),
  ]
);

export const bountyComment = pgTable(
  'bounty_comment',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    parentId: text('parent_id').references(
      (): AnyPgColumn => bountyComment.id,
      { onDelete: 'cascade' }
    ),
    content: text('content').notNull(),
    originalContent: text('original_content'),
    editCount: integer('edit_count').notNull().default(0),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('bounty_comment_bounty_id_idx').on(t.bountyId),
    index('bounty_comment_user_id_idx').on(t.userId),
    index('bounty_comment_parent_id_idx').on(t.parentId),
  ]
);

export const bountyCommentLike = pgTable(
  'bounty_comment_like',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    commentId: text('comment_id')
      .notNull()
      .references(() => bountyComment.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex('bounty_comment_like_unique_idx').on(t.commentId, t.userId),
    // bounty_comment_like_comment_id_idx removed: redundant with unique_idx (leading column)
    index('bounty_comment_like_user_id_idx').on(t.userId),
  ]
);

export const bountyBookmark = pgTable(
  'bounty_bookmark',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    uniqueIndex('bounty_bookmark_unique_idx').on(t.bountyId, t.userId),
    // bounty_bookmark_bounty_id_idx removed: redundant with unique_idx (leading column)
    index('bounty_bookmark_user_id_idx').on(t.userId),
  ]
);

export const cancellationRequest = pgTable(
  'cancellation_request',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    bountyId: text('bounty_id')
      .notNull()
      .references(() => bounty.id, { onDelete: 'cascade' }),
    requestedById: text('requested_by_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    status: cancellationRequestStatusEnum('status').notNull().default('pending'),
    processedById: text('processed_by_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    processedAt: timestamp('processed_at'),
    refundAmount: decimal('refund_amount', { precision: 15, scale: 2 }),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('cancellation_request_bounty_id_idx').on(t.bountyId),
    index('cancellation_request_status_idx').on(t.status),
  ]
);
