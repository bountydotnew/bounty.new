import { sql } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import {
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
export const difficultyEnum = pgEnum('difficulty', [
  'beginner',
  'intermediate',
  'advanced',
  'expert',
]);

export const bounty = pgTable('bounty', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('USD'),
  status: bountyStatusEnum('status').notNull().default('draft'),
  difficulty: difficultyEnum('difficulty').notNull().default('intermediate'),
  deadline: timestamp('deadline'),
  tags: text('tags').array(),
  repositoryUrl: text('repository_url'),
  issueUrl: text('issue_url'),
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  assignedToId: text('assigned_to_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('bounty_status_idx').on(t.status),
  index('bounty_difficulty_idx').on(t.difficulty),
  index('bounty_created_by_id_idx').on(t.createdById),
  index('bounty_assigned_to_id_idx').on(t.assignedToId),
  index('bounty_created_at_idx').on(t.createdAt),
  index('bounty_updated_at_idx').on(t.updatedAt),
  index('bounty_deadline_idx').on(t.deadline),
  index('bounty_amount_idx').on(t.amount),
  index('bounty_currency_idx').on(t.currency),
]);

export const submission = pgTable('submission', {
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
  status: submissionStatusEnum('status').notNull().default('pending'),
  reviewNotes: text('review_notes'),
  submittedAt: timestamp('submitted_at').notNull().default(sql`now()`),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('submission_bounty_id_idx').on(t.bountyId),
  index('submission_contributor_id_idx').on(t.contributorId),
  index('submission_status_idx').on(t.status),
  index('submission_submitted_at_idx').on(t.submittedAt),
  index('submission_reviewed_at_idx').on(t.reviewedAt),
  index('submission_created_at_idx').on(t.createdAt),
]);

export const bountyApplication = pgTable('bounty_application', {
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
}, (t) => [
  index('bounty_application_bounty_id_idx').on(t.bountyId),
  index('bounty_application_applicant_id_idx').on(t.applicantId),
  index('bounty_application_is_accepted_idx').on(t.isAccepted),
  index('bounty_application_applied_at_idx').on(t.appliedAt),
  index('bounty_application_responded_at_idx').on(t.respondedAt),
  uniqueIndex('bounty_application_unique_idx').on(t.bountyId, t.applicantId),
]);

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
    index('bounty_vote_bounty_id_idx').on(t.bountyId),
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
    index('bounty_comment_like_comment_id_idx').on(t.commentId),
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
    index('bounty_bookmark_bounty_id_idx').on(t.bountyId),
    index('bounty_bookmark_user_id_idx').on(t.userId),
  ]
);
