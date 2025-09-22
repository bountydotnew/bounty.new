import { sql } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core';

export const betaAccessStatusEnum = pgEnum('beta_access_status', [
  'none',
  'pending',
  'approved',
  'denied',
]);

export const accessStageEnum = pgEnum('access_stage', [
  'none',
  'alpha',
  'beta',
  'production',
]);

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  hasAccess: boolean('has_access').notNull().default(false),
  betaAccessStatus: betaAccessStatusEnum('beta_access_status')
    .notNull()
    .default('none'),
  accessStage: accessStageEnum('access_stage').notNull().default('none'),
  role: text('role').notNull().default('user'),
  banned: boolean('banned').notNull().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  // Note: Consider using timestamptz for timezone-aware timestamps in production
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('user_email_idx').on(t.email),
  index('user_has_access_idx').on(t.hasAccess),
  index('user_beta_access_status_idx').on(t.betaAccessStatus),
  index('user_access_stage_idx').on(t.accessStage),
  index('user_role_idx').on(t.role),
  index('user_banned_idx').on(t.banned),
  index('user_created_at_idx').on(t.createdAt),
]);

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  impersonatedBy: text('impersonated_by'),
}, (t) => [
  index('session_user_id_idx').on(t.userId),
  index('session_expires_at_idx').on(t.expiresAt),
  index('session_token_idx').on(t.token),
  index('session_created_at_idx').on(t.createdAt),
]);

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('account_user_id_idx').on(t.userId),
  index('account_provider_id_idx').on(t.providerId),
  uniqueIndex('account_provider_account_unique_idx').on(t.providerId, t.accountId),
]);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
}, (t) => [
  index('verification_identifier_idx').on(t.identifier),
  index('verification_value_idx').on(t.value),
  index('verification_expires_at_idx').on(t.expiresAt),
]);

export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  hasAccess: boolean('has_access').notNull().default(false),
  ipAddress: text('ip_address'),
}, (t) => [
  uniqueIndex('waitlist_email_unique_idx').on(t.email),
  index('waitlist_has_access_idx').on(t.hasAccess),
  index('waitlist_created_at_idx').on(t.createdAt),
]);
