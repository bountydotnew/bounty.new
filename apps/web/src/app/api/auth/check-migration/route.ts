import { auth } from '@bounty/auth/server';
import { account, db } from '@bounty/db';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/check-migration
 *
 * Checks if the authenticated user needs to migrate their account
 * by linking an OAuth provider.
 *
 * Returns:
 * - needsMigration: true if user only has email/password auth
 * - hasOAuth: true if user has at least one OAuth provider linked
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has any OAuth accounts (non-email providers)
    const userAccounts = await db.query.account.findMany({
      where: eq(account.userId, session.user.id),
      columns: {
        providerId: true,
      },
    });

    const hasOAuth = userAccounts.some(
      (acc) => acc.providerId !== 'email'
    );

    return NextResponse.json({
      needsMigration: !hasOAuth,
      hasOAuth,
    });
  } catch (error) {
    console.error('Error checking migration status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
