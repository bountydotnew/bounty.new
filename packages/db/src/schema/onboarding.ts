import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { user } from './auth';

export const onboardingState = pgTable('onboarding_state', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(),
  completedStep1: boolean('completed_step_1').notNull().default(false),
  completedStep2: boolean('completed_step_2').notNull().default(false),
  completedStep3: boolean('completed_step_3').notNull().default(false),
  completedStep4: boolean('completed_step_4').notNull().default(false),
  source: text('source'), // How they found us (from step 3): twitter, github, friend, hacker_news, other
  claimedWaitlistDiscount: boolean('claimed_waitlist_discount').notNull().default(false),
  // Tour / product onboarding (guided walkthrough)
  completedOnboarding: boolean('completed_onboarding').notNull().default(false),
  // Getting Started checklist items
  gsConnectedTools: boolean('gs_connected_tools').notNull().default(false),
  gsSetupPayouts: boolean('gs_setup_payouts').notNull().default(false),
  gsCreatedBounty: boolean('gs_created_bounty').notNull().default(false),
  gsInvitedMember: boolean('gs_invited_member').notNull().default(false),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const onboardingCoupon = pgTable('onboarding_coupon', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' })
    .unique(),
  code: text('code').notNull().unique(), // 20% off Pro plan code
  used: boolean('used').notNull().default(false),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
});

export type OnboardingState = typeof onboardingState.$inferSelect;
export type NewOnboardingState = typeof onboardingState.$inferInsert;
export type OnboardingCoupon = typeof onboardingCoupon.$inferSelect;
export type NewOnboardingCoupon = typeof onboardingCoupon.$inferInsert;
