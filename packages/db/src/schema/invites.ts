import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { accessStageEnum, user } from './auth';

export const invite = pgTable('invite', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  accessStage: accessStageEnum('access_stage').notNull(),
  expiresAt: timestamp('expires_at').notNull().default(sql`now()`),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  usedByUserId: text('used_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
}, (t) => [
  index('invite_email_idx').on(t.email),
  uniqueIndex('invite_token_hash_unique_idx').on(t.tokenHash),
  index('invite_access_stage_idx').on(t.accessStage),
  index('invite_expires_at_idx').on(t.expiresAt),
  index('invite_used_at_idx').on(t.usedAt),
  index('invite_used_by_user_id_idx').on(t.usedByUserId),
  index('invite_created_at_idx').on(t.createdAt),
]);