import { desc, eq, and, gte, sql } from 'drizzle-orm';
import { db } from '../index';
import {
  adminEvents,
  type NewAdminEvent,
  type AdminEvent,
} from '../schema/admin-events';
import { user } from '../schema/auth';

type EventType = NewAdminEvent['eventType'];
type TargetType = NonNullable<NewAdminEvent['targetType']>;

interface LogEventOptions {
  eventType: EventType;
  actorId?: string | null;
  targetType?: TargetType;
  targetId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  /** Geolocation from Vercel headers */
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
}

/**
 * Log an admin event to the database
 *
 * @example
 * // User signup
 * await logAdminEvent({
 *   eventType: 'user_signup',
 *   actorId: newUser.id,
 *   description: 'New user signed up',
 * });
 *
 * @example
 * // Content reported
 * await logAdminEvent({
 *   eventType: 'content_reported',
 *   actorId: reporterId,
 *   targetType: 'bounty',
 *   targetId: bountyId,
 *   description: 'User reported a bounty',
 *   metadata: { reason: 'spam' },
 * });
 *
 * @example
 * // Profanity blocked
 * await logAdminEvent({
 *   eventType: 'profanity_blocked',
 *   actorId: userId,
 *   description: 'User attempted to use profanity',
 *   metadata: { blockedWord: 'f***', field: 'title' },
 * });
 */
export async function logAdminEvent(options: LogEventOptions): Promise<AdminEvent> {
  const [event] = await db
    .insert(adminEvents)
    .values({
      eventType: options.eventType,
      actorId: options.actorId ?? null,
      targetType: options.targetType ?? null,
      targetId: options.targetId ?? null,
      description: options.description ?? null,
      metadata: options.metadata ?? null,
      ipAddress: options.ipAddress ?? null,
      country: options.geo?.country ?? null,
      region: options.geo?.region ?? null,
      city: options.geo?.city ?? null,
    })
    .returning();

  return event;
}

/**
 * Get admin events with pagination and optional filtering
 */
export async function getAdminEvents(options: {
  limit?: number;
  offset?: number;
  eventType?: EventType;
  actorId?: string;
  targetId?: string;
  since?: Date;
} = {}): Promise<{
  events: (AdminEvent & {
    actor: { id: string; name: string | null; image: string | null; handle: string | null } | null;
  })[];
  total: number;
}> {
  const { limit = 50, offset = 0, eventType, actorId, targetId, since } = options;

  const conditions = [];
  if (eventType) {
    conditions.push(eq(adminEvents.eventType, eventType));
  }
  if (actorId) {
    conditions.push(eq(adminEvents.actorId, actorId));
  }
  if (targetId) {
    conditions.push(eq(adminEvents.targetId, targetId));
  }
  if (since) {
    conditions.push(gte(adminEvents.createdAt, since));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [events, countResult] = await Promise.all([
    db
      .select({
        id: adminEvents.id,
        eventType: adminEvents.eventType,
        actorId: adminEvents.actorId,
        targetType: adminEvents.targetType,
        targetId: adminEvents.targetId,
        description: adminEvents.description,
        metadata: adminEvents.metadata,
        ipAddress: adminEvents.ipAddress,
        createdAt: adminEvents.createdAt,
        actor: {
          id: user.id,
          name: user.name,
          image: user.image,
          handle: user.handle,
        },
      })
      .from(adminEvents)
      .leftJoin(user, eq(adminEvents.actorId, user.id))
      .where(whereClause)
      .orderBy(desc(adminEvents.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(adminEvents)
      .where(whereClause),
  ]);

  return {
    events: events.map((e) => ({
      ...e,
      actor: e.actor?.id ? e.actor : null,
    })),
    total: countResult[0]?.count ?? 0,
  };
}

/**
 * Get event counts by type for the last N days
 */
export async function getEventStats(days = 7): Promise<Record<string, number>> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const results = await db
    .select({
      eventType: adminEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(adminEvents)
    .where(gte(adminEvents.createdAt, since))
    .groupBy(adminEvents.eventType);

  return results.reduce(
    (acc, { eventType, count }) => {
      acc[eventType] = count;
      return acc;
    },
    {} as Record<string, number>
  );
}
