'use client';

import { track } from '@databuddy/sdk';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/auth-guard';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import GithubImportModal from '@/components/bounty/github-import-modal';
// Dashboard components
import { ErrorBoundary } from '@/components/dashboard/error-boundary';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { Onboarding } from '@/components/onboarding';
import {
  TaskInputForm,
  type TaskInputFormRef,
} from '@/components/dashboard/task-input-form';
// Constants and types
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { trpc } from '@/utils/trpc';
import { useSession } from '@/context/session-context';
track('screen_view', { screen_name: 'dashboard' });

export default function Dashboard() {
  const router = useRouter();
  const taskInputRef = useRef<TaskInputFormRef>(null);

  // Check onboarding state from database
  const { data: onboardingState, isLoading: onboardingLoading } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (!onboardingLoading && onboardingState) {
      const isComplete =
        onboardingState.completedStep1 &&
        onboardingState.completedStep2 &&
        onboardingState.completedStep3 &&
        onboardingState.completedStep4;

      if (!isComplete) {
        // Find first incomplete step
        if (!onboardingState.completedStep1) {
          router.push('/onboarding/step/1');
        } else if (!onboardingState.completedStep2) {
          router.push('/onboarding/step/2');
        } else if (!onboardingState.completedStep3) {
          router.push('/onboarding/step/3');
        } else if (!onboardingState.completedStep4) {
          router.push('/onboarding/step/4');
        }
      }
    }
  }, [onboardingState, onboardingLoading, router]);

  // Focus textarea if hash is present (for navigation from other pages)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#focus-textarea' || hash === '#new-bounty') {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        taskInputRef.current?.focus();
        window.history.replaceState(null, '', window.location.pathname);
      }, 100);
    }

    // Listen for custom event to focus textarea (when already on dashboard)
    const handleFocusTextarea = () => {
      setTimeout(() => {
        taskInputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('focus-textarea', handleFocusTextarea);
    return () => {
      window.removeEventListener('focus-textarea', handleFocusTextarea);
    };
  }, []);

  // Memoized query options for better performance
  const bountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchAllBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.ALL_BOUNTIES,
      }),
    []
  );

  const myBountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchMyBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.MY_BOUNTIES,
      }),
    []
  );

  const { isAuthenticated, isPending: isSessionPending } = useSession();

  // Queries - only run when authenticated, with staleTime to prevent refetching
  const bounties = useQuery({
    ...bountiesQuery,
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000, // 2 minutes - bounties can change frequently
  });
  const myBounties = useQuery({
    ...myBountiesQuery,
    enabled: isAuthenticated && !isSessionPending,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
  const [importOpen, setImportOpen] = useState(false);

  return (
    <ErrorBoundary>
      <AuthGuard>
        <Onboarding />
        <Header
          isMyBountiesLoading={myBounties.isLoading}
          myBounties={myBounties.data?.data ?? []}
        />

        <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
          {/* Horizontal border line above textarea */}
          <div className="h-px w-full shrink-0 bg-[#232323]" />

          <TaskInputForm ref={taskInputRef} />

          {/* Horizontal border line below textarea */}
          <div className="h-px w-full shrink-0 bg-[#232323]" />

          {/* Bounty list section with vertical borders */}
          <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-[#232323] mx-auto py-4 min-w-0">
            <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
              <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
                <BountiesFeed
                  bounties={bounties.data?.data ?? []}
                  className="lg:pr-2"
                  error={
                    bounties.error instanceof Error ? bounties.error : undefined
                  }
                  isError={bounties.isError}
                  isLoading={bounties.isLoading}
                  layout="list"
                />
              </div>
            </div>
          </div>
        </div>
        <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
      </AuthGuard>
    </ErrorBoundary>
  );
}
