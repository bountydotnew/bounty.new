import { sql } from 'drizzle-orm';
import { boolean, integer, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const roleEnum = pgEnum('waitlist_role', ['creator', 'developer']);

export const waitlistEntry = pgTable('waitlist_entry', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  otpCode: text('otp_code'),
  otpExpiresAt: timestamp('otp_expires_at'),
  otpAttempts: integer('otp_attempts').notNull().default(0),
  name: text('name'),
  username: text('username').unique(),
  role: roleEnum('role'),
  githubId: text('github_id'),
  githubUsername: text('github_username'),
  position: integer('position').notNull(),
  referralCode: text('referral_code').notNull().unique(),
  referredBy: text('referred_by').references((): any => waitlistEntry.id, { onDelete: 'set null' }),
  onboardingCompletedAt: timestamp('onboarding_completed_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const bountyDraftStatusEnum = pgEnum('bounty_draft_status', ['draft', 'pending_review', 'approved']);

export const bountyDraft = pgTable('bounty_draft', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  waitlistEntryId: text('waitlist_entry_id')
    .notNull()
    .references(() => waitlistEntry.id, { onDelete: 'cascade' }),
  title: text('title'),
  description: text('description'),
  price: integer('price'), // in cents
  difficulty: text('difficulty'), // easy, medium, hard
  githubIssueUrl: text('github_issue_url'),
  status: bountyDraftStatusEnum('status').notNull().default('draft'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});
