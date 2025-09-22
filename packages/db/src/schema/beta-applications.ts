import { sql } from 'drizzle-orm';
import { pgEnum, pgTable, text, timestamp, index } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const betaApplicationStatusEnum = pgEnum('beta_application_status', [
  'pending',
  'approved',
  'rejected',
]);

export const betaApplication = pgTable('beta_application', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  twitter: text('twitter').notNull(),
  projectName: text('project_name').notNull(),
  projectLink: text('project_link').notNull(),
  description: text('description').notNull(),
  status: betaApplicationStatusEnum('status').notNull().default('pending'),
  reviewedBy: text('reviewed_by').references(() => user.id, {
    onDelete: 'set null',
  }),
  reviewedAt: timestamp('reviewed_at'),
  reviewNotes: text('review_notes'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('beta_application_user_id_idx').on(t.userId),
  index('beta_application_status_idx').on(t.status),
  index('beta_application_reviewed_by_idx').on(t.reviewedBy),
  index('beta_application_created_at_idx').on(t.createdAt),
  index('beta_application_reviewed_at_idx').on(t.reviewedAt),
]);
