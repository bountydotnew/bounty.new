import { logAdminEvent } from '@bounty/db';
import { track, type TrackProps } from './client';

// =============================================================================
// Admin Event Types
// =============================================================================

type AdminEventType =
  | 'user_signup'
  | 'user_banned'
  | 'user_unbanned'
  | 'content_reported'
  | 'profanity_blocked'
  | 'content_hidden'
  | 'content_unhidden'
  | 'ratelimit_hit'
  | 'bounty_created'
  | 'bounty_funded'
  | 'bounty_completed'
  | 'bounty_cancelled'
  | 'admin_action';

type TargetType = 'user' | 'bounty' | 'comment' | 'submission' | 'organization';

interface AdminEventOptions {
  /** User who performed the action */
  actorId?: string | null;
  /** Type of target being acted upon */
  targetType?: TargetType;
  /** ID of the target */
  targetId?: string;
  /** Human-readable description */
  description?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** IP address (for rate limit events) */
  ipAddress?: string;
  /** Geolocation from Vercel headers */
  geo?: {
    country?: string;
    region?: string;
    city?: string;
  };
  /** Also track to analytics (default: true) */
  trackAnalytics?: boolean;
}

/**
 * Track an admin event - logs to both the database (for admin panel)
 * and optionally to analytics.
 *
 * NOTE: This is a server-only function. Do not import in client components.
 *
 * @example
 * // User signup
 * await trackAdminEvent('user_signup', {
 *   actorId: user.id,
 *   description: `${user.name} signed up`,
 * });
 *
 * @example
 * // Profanity blocked
 * await trackAdminEvent('profanity_blocked', {
 *   actorId: userId,
 *   targetType: 'bounty',
 *   description: 'Attempted to use profanity in bounty title',
 *   metadata: { blockedWord: 'f***', field: 'title' },
 * });
 *
 * @example
 * // Content reported
 * await trackAdminEvent('content_reported', {
 *   actorId: reporterId,
 *   targetType: 'bounty',
 *   targetId: bountyId,
 *   description: 'Reported bounty for spam',
 *   metadata: { reason: 'spam' },
 * });
 */
export async function trackAdminEvent(
  eventType: AdminEventType,
  options: AdminEventOptions = {}
): Promise<void> {
  const { trackAnalytics = true, geo, ...eventOptions } = options;

  // Log to database for admin panel
  try {
    await logAdminEvent({
      eventType,
      ...eventOptions,
      geo,
    });
  } catch (error) {
    console.error('Failed to log admin event:', error);
  }

  // Also track to analytics if enabled
  if (trackAnalytics) {
    try {
      const metadata = options.metadata ?? {};
      const safeMetadata: TrackProps = {};

      // Safely copy metadata properties
      for (const [key, value] of Object.entries(metadata)) {
        if (value !== null && value !== undefined) {
          const v = value;
          if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            safeMetadata[key] = v;
          }
        }
      }

      await track(`admin_${eventType}`, {
        actor_id: options.actorId ?? undefined,
        target_type: options.targetType ?? undefined,
        target_id: options.targetId ?? undefined,
        ...safeMetadata,
      });
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }
}
