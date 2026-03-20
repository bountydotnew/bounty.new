import { relations, sql } from 'drizzle-orm';
import { index, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const moderationStatusEnum = pgEnum('moderation_status', [
  'pending',
  'approved',
  'rejected',
  'auto_flagged',
]);

export const moderationContentTypeEnum = pgEnum('moderation_content_type', [
  'bounty',
  'comment',
  'submission',
  'user',
]);

export const moderationFlags = pgTable(
  'moderation_flags',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    /** Type of content being flagged */
    contentType: moderationContentTypeEnum('content_type').notNull(),
    /** ID of the flagged content (bounty, comment, or submission) */
    contentId: text('content_id').notNull(),
    /** Reason for flagging (e.g., 'profanity', 'spam', 'harassment') */
    reason: text('reason').notNull(),
    /** The specific text that triggered the flag */
    flaggedText: text('flagged_text'),
    /** User who reported this content (null for auto-flagged) */
    reporterId: text('reporter_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    /** Current moderation status */
    status: moderationStatusEnum('status').default('pending').notNull(),
    /** Admin who reviewed the flag */
    reviewedBy: text('reviewed_by').references(() => user.id, {
      onDelete: 'set null',
    }),
    /** When the flag was reviewed */
    reviewedAt: timestamp('reviewed_at'),
    /** Admin notes about the review decision */
    reviewNotes: text('review_notes'),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('moderation_flags_status_idx').on(t.status),
    index('moderation_flags_content_type_idx').on(t.contentType),
    index('moderation_flags_content_id_idx').on(t.contentId),
    index('moderation_flags_created_at_idx').on(t.createdAt),
    index('moderation_flags_reporter_id_idx').on(t.reporterId),
  ]
);

export const moderationFlagsRelations = relations(moderationFlags, ({ one }) => ({
  reporter: one(user, {
    fields: [moderationFlags.reporterId],
    references: [user.id],
    relationName: 'reporter',
  }),
  reviewer: one(user, {
    fields: [moderationFlags.reviewedBy],
    references: [user.id],
    relationName: 'reviewer',
  }),
}));

export type ModerationFlag = typeof moderationFlags.$inferSelect;
export type NewModerationFlag = typeof moderationFlags.$inferInsert;
