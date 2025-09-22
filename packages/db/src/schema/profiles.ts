import { sql } from 'drizzle-orm';
import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
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
  uniqueIndex('user_profile_user_id_unique_idx').on(t.userId),
  index('user_profile_github_username_idx').on(t.githubUsername),
  index('user_profile_location_idx').on(t.location),
  index('user_profile_available_for_work_idx').on(t.availableForWork),
  index('user_profile_hourly_rate_idx').on(t.hourlyRate),
  index('user_profile_timezone_idx').on(t.timezone),
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
}, (t) => [
  uniqueIndex('user_reputation_user_id_unique_idx').on(t.userId),
  index('user_reputation_total_earned_idx').on(t.totalEarned),
  index('user_reputation_bounties_completed_idx').on(t.bountiesCompleted),
  index('user_reputation_average_rating_idx').on(t.averageRating),
  index('user_reputation_success_rate_idx').on(t.successRate),
  index('user_reputation_completion_rate_idx').on(t.completionRate),
]);

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
  uniqueIndex('user_rating_unique_idx').on(t.ratedUserId, t.raterUserId, t.bountyId),
]);
