import { cleanupExpiredSessions, getExpiredSessionCount } from '@bounty/db';
import { env } from '@bounty/env/server';
import { withEvlog, log } from '@bounty/logging';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * Cron job to clean up expired sessions from the database
 * Runs daily at 2 AM UTC
 * Secured with CRON_SECRET environment variable
 */
export const GET = withEvlog(async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret) {
    log.error('[Cron] CRON_SECRET environment variable is not set');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    log.warn('[Cron] Unauthorized cron job attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get count of expired sessions before cleanup
    const expiredCount = await getExpiredSessionCount();

    // Clean up expired sessions (no buffer - delete all expired)
    const deletedCount = await cleanupExpiredSessions(0);

    log.info('[Cron] Cleaned up expired sessions', { deletedCount, expiredCount });

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      expiredBeforeCleanup: expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    log.error('[Cron] Error cleaning up expired sessions', { error });
    return NextResponse.json(
      {
        error: 'Failed to clean up sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});
