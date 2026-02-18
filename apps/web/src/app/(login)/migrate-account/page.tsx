import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@bounty/auth/server';
import { db, account } from '@bounty/db';
import { eq } from 'drizzle-orm';
import MigrateAccountPage from './page-client';

export const metadata: Metadata = {
  title: 'Migrate Account',
  description: 'Migrate your account to bounty.new',
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  let hasSession = false;
  let hasOAuth = false;
  let safeRedirect = '/dashboard';

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      hasSession = true;

      // Check if user already has OAuth linked
      const accounts = await db
        .select()
        .from(account)
        .where(eq(account.userId, session.user.id));

      hasOAuth = accounts.some(
        (a) => a.providerId === 'github' || a.providerId === 'google'
      );

      if (hasOAuth) {
        const params = await searchParams;
        const redirectParam =
          typeof params.redirect === 'string' ? params.redirect : null;
        safeRedirect =
          redirectParam?.startsWith('/') && !redirectParam?.startsWith('//')
            ? redirectParam
            : '/dashboard';
      }
    }
  } catch {
    // If server-side check fails, redirect to login
  }

  if (!hasSession) {
    redirect('/login');
  }

  if (hasOAuth) {
    redirect(safeRedirect);
  }

  return <MigrateAccountPage />;
}
