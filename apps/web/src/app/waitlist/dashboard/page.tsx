'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { DashboardPreview } from '@/components/waitlist/dashboard-preview';
import { authClient } from '@bounty/auth/client';
import { trpc } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';

function DashboardContent() {
  const router = useRouter();
  const [entryId] = useQueryState('entryId', parseAsString);
  const [email] = useQueryState('email', parseAsString);

  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const { data: myEntry, isLoading: isLoadingMyEntry } = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    enabled: !entryId && !!session?.user,
  });

  const effectiveEntryId = entryId || myEntry?.id;
  const effectiveEmail = email || myEntry?.email;

  if (isSessionPending || (!!session?.user && !entryId && isLoadingMyEntry)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
      </div>
    );
  }

  if (!effectiveEntryId) {
    router.push('/');
    return null;
  }

  return (
    <div className="relative min-h-screen text-white" style={{
      background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
    }}>
      <div className="flex min-h-screen items-center justify-center px-6 py-20">
        <DashboardPreview
          entryId={effectiveEntryId}
          email={effectiveEmail ? decodeURIComponent(effectiveEmail) : ''}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen text-white flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
      }}>
        <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
