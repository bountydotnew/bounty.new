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
      [key: string]: unknown;
    } | null>(),
    read: boolean('read').notNull().default(false),
    createdAt: timestamp('created_at').notNull().default(sql`now()`),
    updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  },
  (t) => [
    index('notification_user_id_idx').on(t.userId),
    index('notification_read_idx').on(t.read),
    index('notification_type_idx').on(t.type),
    index('notification_created_at_idx').on(t.createdAt),
  ]
);

export const notificationRelations = relations(notification, ({ one }) => ({
  user: one(user, {
    fields: [notification.userId],
    references: [user.id],
  }),
}));
