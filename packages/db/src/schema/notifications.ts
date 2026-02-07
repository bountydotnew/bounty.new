import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const notificationTypeEnum = pgEnum('notification_type', [
  'system',
  'bounty_comment',
  'submission_received',
  'submission_approved',
  'submission_rejected',
  'bounty_awarded',
  'beta_application_approved',
  'beta_application_rejected',
  'custom',
]);

export const notification = pgTable(
  'notification',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    type: notificationTypeEnum('type').notNull(),
    title: text('title').notNull(),
    message: text('message').notNull(),
    data: jsonb('data').$type<{
      bountyId?: string;
      submissionId?: string;
      commentId?: string;
      linkTo?: string;
      applicationId?: string;
      // User who performed the action
      userId?: string;
      userName?: string;
      userImage?: string;
      [key: string]: unknown;
    } | null>(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('notification_user_id_idx').on(t.userId),
    // Composite: covers getNotificationsForUser (unread) and getUnreadNotificationCount
    // WHERE user_id = ? AND read = false ORDER BY created_at DESC
    index('notification_user_unread_idx').on(t.userId, t.read, t.createdAt),
    // notification_read_idx, notification_type_idx, notification_created_at_idx removed:
    // low-cardinality single-column indexes with 0 scans; replaced by composite above
  ]
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
