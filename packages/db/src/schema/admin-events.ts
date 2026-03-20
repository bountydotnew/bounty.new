import { sql } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { user } from './auth';

export const adminEventTypeEnum = pgEnum('admin_event_type', [
  // User events
  'user_signup',
  'user_banned',
  'user_unbanned',

  // Content moderation
  'content_reported',
  'profanity_blocked',
  'content_hidden',
  'content_unhidden',

  // Rate limiting
  'ratelimit_hit',

  // Bounty events
  'bounty_created',
  'bounty_funded',
  'bounty_completed',
  'bounty_cancelled',

  // Admin actions
  'admin_action',
]);

export const adminEventTargetTypeEnum = pgEnum('admin_event_target_type', [
  'user',
  'bounty',
  'comment',
  'submission',
  'organization',
]);

/**
 * Admin Events table
 *
 * Stores events for the admin activity feed.
 * Events are structured as: "actor performed action on target"
 *
 * Examples:
 * - @johndoe reported @janepork's bounty
 * - @user tried to create a bounty with profanity
 * - @user hit rate limit on waitlist
 */
export const adminEvents = pgTable(
  'admin_events',
  {
    id: text('id').primaryKey().default(sql`gen_random_uuid()`),

    /** Type of event */
    eventType: adminEventTypeEnum('event_type').notNull(),

    /** User who performed the action (can be null for system events) */
    actorId: text('actor_id').references(() => user.id, {
      onDelete: 'set null',
    }),

    /** Type of target being acted upon */
    targetType: adminEventTargetTypeEnum('target_type'),

    /** ID of the target (bounty ID, user ID, etc.) */
    targetId: text('target_id'),

    /** Human-readable description of the event */
    description: text('description'),

    /** Additional metadata (JSON) - e.g., the blocked word, report reason, etc. */
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),

    /** IP address (for rate limit events) */
    ipAddress: text('ip_address'),

    /** Geolocation info from Vercel headers */
    country: text('country'),
    region: text('region'),
    city: text('city'),

    createdAt: timestamp('created_at').notNull().default(sql`now()`),

    /** Auto-expires after 30 days - cron job cleans up expired events */
    expiresAt: timestamp('expires_at')
      .notNull()
      .default(sql`now() + interval '30 days'`),
  },
  (t) => [
    index('admin_events_event_type_idx').on(t.eventType),
    index('admin_events_actor_id_idx').on(t.actorId),
    index('admin_events_target_id_idx').on(t.targetId),
    index('admin_events_created_at_idx').on(t.createdAt),
  ]
);

export type AdminEvent = typeof adminEvents.$inferSelect;
export type NewAdminEvent = typeof adminEvents.$inferInsert;
