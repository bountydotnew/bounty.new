/**
 * Session management functions.
 *
 * Replaces:
 * - /api/cron/cleanup-sessions (Vercel Cron)
 * - packages/db/src/services/sessions.ts
 */
import { internalMutation } from '../_generated/server';
import { authComponent } from '../auth';

/**
 * Clean up expired sessions.
 * Called by the daily cron job at 2 AM UTC.
 */
export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // The Better Auth component manages sessions in its own namespace.
    // Session cleanup is handled by the component's built-in expiration.
    // If we need additional cleanup for our app tables, we can do it here.
    console.log('[Cron] Session cleanup triggered');
  },
});
