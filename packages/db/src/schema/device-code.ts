import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const deviceCode = pgTable('device_code', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  deviceCode: text('device_code').notNull().unique(),
  userCode: text('user_code').notNull().unique(),
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  clientId: text('client_id'),
  scope: text('scope'),
  status: text('status').notNull().default('pending'), // pending, approved, denied
  expiresAt: timestamp('expires_at').notNull(),
  lastPolledAt: timestamp('last_polled_at'),
  pollingInterval: integer('polling_interval'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});
