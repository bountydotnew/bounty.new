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

export const bounty = pgTable('bounty', {
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
  createdById: text('created_by_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  assignedToId: text('assigned_to_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

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
});

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
});

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
