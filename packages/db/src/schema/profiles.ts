import { sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { user } from './auth';
import { bounty } from './bounties';

export const userProfile = pgTable('user_profile', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  bio: text('bio'),
  location: text('location'),
  website: text('website'),
  githubUsername: text('github_username'),
  twitterUsername: text('twitter_username'),
  linkedinUrl: text('linkedin_url'),
  skills: text('skills').array(),
  preferredLanguages: text('preferred_languages').array(),
  hourlyRate: decimal('hourly_rate', { precision: 10, scale: 2 }),
  currency: text('currency').default('USD'),
  timezone: text('timezone'),
  availableForWork: boolean('available_for_work').default(true),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('user_profile_github_username_idx').on(t.githubUsername),
  index('user_profile_available_for_work_idx').on(t.availableForWork),
  index('user_profile_skills_gin_idx').using('gin', t.skills),
  index('user_profile_preferred_languages_gin_idx').using('gin', t.preferredLanguages),
]);

export const userReputation = pgTable('user_reputation', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  totalEarned: decimal('total_earned', { precision: 12, scale: 2 }).default(
    sql`0.00`
  ),
  bountiesCompleted: integer('bounties_completed').default(0),
  bountiesCreated: integer('bounties_created').default(0),
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }).default(
    sql`0.00`
  ),
  totalRatings: integer('total_ratings').default(0),
  successRate: decimal('success_rate', { precision: 5, scale: 2 }).default(
    sql`0.00`
  ),
  responseTime: integer('response_time'),
  completionRate: decimal('completion_rate', {
    precision: 5,
    scale: 2,
  }).default(sql`0.00`),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
});

export const userRating = pgTable('user_rating', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ratedUserId: text('rated_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  raterUserId: text('rater_user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  bountyId: text('bounty_id')
    .notNull()
    .references(() => bounty.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().default(sql`now()`),
  updatedAt: timestamp('updated_at').notNull().default(sql`now()`),
}, (t) => [
  index('user_rating_rated_user_id_idx').on(t.ratedUserId),
  index('user_rating_rater_user_id_idx').on(t.raterUserId),
  index('user_rating_bounty_id_idx').on(t.bountyId),
  index('user_rating_rating_idx').on(t.rating),
  index('user_rating_created_at_idx').on(t.createdAt),
]);
