'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPreview } from '@/components/waitlist/dashboard-preview';
import { useSession } from '@/context/session-context';
import { trpc } from '@/utils/trpc';
import { useQuery } from '@tanstack/react-query';

function DashboardContent() {
  const router = useRouter();
  const { session, isPending: isSessionPending } = useSession();

  const { data: myEntry, isLoading: isLoadingMyEntry } = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    enabled: !!session?.user,
  });

  const handleLogin = () => {
    const callbackUrl = encodeURIComponent('/waitlist/dashboard');
    router.push(`/login?callback=${callbackUrl}`);
  };

  // Loading state
  if (isSessionPending || (!!session?.user && isLoadingMyEntry)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
      </div>
    );
  }

  // Not logged in - show login button
  if (!session?.user) {
    return (
      <div
        className="relative min-h-screen text-foreground"
        style={{
          background:
            'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
        }}
      >
        <div className="flex min-h-screen items-center justify-center px-6 py-20">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-medium text-foreground mb-4">
              Join the waitlist
            </h2>
            <p className="text-text-tertiary text-base mb-6">
              Sign in with GitHub to join the waitlist and create your bounty
              draft.
            </p>
            <button
              onClick={handleLogin}
              className="flex items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-medium text-foreground transition-opacity hover:opacity-90 mx-auto"
              style={{
                backgroundImage:
                  'linear-gradient(180deg, #ccc 0%, #808080 100%)',
              }}
            >
              Sign in with GitHub
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Logged in - always show DashboardPreview (it handles showing form if no bounty)
  if (!myEntry?.id) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen text-foreground"
      style={{
        background:
          'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
      }}
    >
      <div className="flex min-h-screen items-center justify-center px-6 py-20">
        <DashboardPreview entryId={myEntry.id} email={myEntry.email || ''} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          className="relative min-h-screen text-foreground flex items-center justify-center"
          style={{
            background:
              'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
          }}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
