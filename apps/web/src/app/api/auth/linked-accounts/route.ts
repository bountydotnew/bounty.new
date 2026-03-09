import { auth } from '@bounty/auth/server';
import { account, db } from '@bounty/db';
import { eq } from 'drizzle-orm';
import { withEvlog, log } from '@bounty/logging';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

/**
 * GET /api/auth/linked-accounts
 *
 * Returns all linked accounts for the authenticated user.
 */
export const GET = withEvlog(async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userAccounts = await db.query.account.findMany({
      where: eq(account.userId, session.user.id),
      columns: {
        providerId: true,
        accountId: true,
      },
    });

    return NextResponse.json({ accounts: userAccounts });
  } catch (error) {
    log.error('Error fetching linked accounts', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
