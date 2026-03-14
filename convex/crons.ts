/**
 * Convex cron jobs.
 *
 * Replaces:
 * - Vercel Cron /api/cron/cleanup-sessions (daily at 2 AM UTC)
 */
import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

// Clean up expired sessions daily at 2:00 AM UTC
// Replaces the Vercel Cron at /api/cron/cleanup-sessions
crons.daily(
  'cleanup expired sessions',
  { hourUTC: 2, minuteUTC: 0 },
  internal.functions.sessions.cleanupExpiredSessions
);

export default crons;
