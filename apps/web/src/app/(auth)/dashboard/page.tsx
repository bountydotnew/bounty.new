import type { Metadata } from 'next';
import { getServerSession } from '@bounty/auth/server-utils';
import { createServerCaller } from '@bounty/api/src/server-caller';
import { DashboardClient } from './dashboard-client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard — bounty',
  description: 'Manage your bounties and track submissions',
};

export default async function DashboardPage() {
  let initialAllBounties: unknown;
  try {
    const session = await getServerSession();
    if (session?.user?.id) {
      const caller = await createServerCaller(session.user.id);
      initialAllBounties = await caller.bounties.fetchAllBounties({
        page: 1,
        limit: 10,
      });
    }
  } catch {
    // Client will fetch if server prefetch fails
  }

  return <DashboardClient initialAllBounties={initialAllBounties} />;
}
