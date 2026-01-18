import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

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

export const deviceCodeStatusEnum = pgEnum('device_code_status', [
  'pending',
  'approved',
  'denied',
]);

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  handle: text('handle').unique(),
  isProfilePrivate: boolean('is_profile_private').notNull().default(false),
  hasAccess: boolean('has_access').notNull().default(false),
  betaAccessStatus: betaAccessStatusEnum('beta_access_status')
    .notNull()
    .default('none'),
  accessStage: accessStageEnum('access_stage').notNull().default('none'),
  role: text('role').notNull().default('user'),
  banned: boolean('banned').notNull().default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  // Stripe fields
  stripeCustomerId: text('stripe_customer_id'),
  stripeConnectAccountId: text('stripe_connect_account_id'),
  stripeConnectOnboardingComplete: boolean('stripe_connect_onboarding_complete')
    .notNull()
    .default(false),
  // Note: Consider using timestamptz for timezone-aware timestamps in production
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

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
});

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
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').default(sql`now()`),
  updatedAt: timestamp('updated_at').default(sql`now()`),
});

export const waitlist = pgTable('waitlist', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  hasAccess: boolean('has_access').notNull().default(false),
  ipAddress: text('ip_address'),
  // OTP verification fields
  otpCode: text('otp_code'),
  otpExpiresAt: timestamp('otp_expires_at'),
  otpAttempts: integer('otp_attempts').notNull().default(0),
  emailVerified: boolean('email_verified').notNull().default(false),
  // Bounty draft fields
  bountyTitle: text('bounty_title'),
  bountyDescription: text('bounty_description'),
  bountyAmount: text('bounty_amount'),
  bountyDeadline: timestamp('bounty_deadline'),
  bountyGithubIssueUrl: text('bounty_github_issue_url'),
  // User linkage (after GitHub OAuth)
  userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
  // Waitlist position
  position: integer('position'),
});

export const deviceCode = pgTable('device_code', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  deviceCode: text('device_code').notNull().unique(),
  userCode: text('user_code').notNull().unique(),
  userId: text('user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  clientId: text('client_id'),
  scope: text('scope'),
  status: deviceCodeStatusEnum('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at').notNull(),
  lastPolledAt: timestamp('last_polled_at'),
  pollingInterval: integer('polling_interval'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const emailOTP = pgTable('email_otp', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  otpCode: text('otp_code').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  verified: boolean('verified').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

/**
 * OAuth state tokens for CSRF protection during OAuth flows
 * Used to validate that OAuth callbacks match initiated flows
 */
export const oauthState = pgTable('oauth_state', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  state: text('state').notNull().unique(),
  provider: text('provider').notNull(), // 'discord', 'github', etc.
  providerId: text('provider_id'), // The external provider's user ID (e.g., Discord user ID)
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});
