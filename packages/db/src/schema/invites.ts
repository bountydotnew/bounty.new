import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const invite = pgTable('invite', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull().default(sql`now()`),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  usedByUserId: text('used_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
});
