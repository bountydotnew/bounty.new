'use client';

import { authClient } from '@bounty/auth/client';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { track } from '@databuddy/sdk';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { AccessGate } from '@/components/access-gate';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { BetaAccessScreen } from '@/components/dashboard/beta-access-screen';
// Dashboard components
import { ErrorBoundary } from '@/components/dashboard/error-boundary';
import { DashboardPageSkeleton } from '@/components/dashboard/skeletons/dashboard-page-skeleton';
import { useDevice } from '@/components/device-provider';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { Onboarding } from '@/components/onboarding';
import { TaskInputForm, type TaskInputFormRef } from '@/components/dashboard/task-input-form';
// Constants and types
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { trpc } from '@/utils/trpc';

track('screen_view', { screen_name: 'dashboard' });

export default function Dashboard() {
  const taskInputRef = useRef<TaskInputFormRef>(null);

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

  const existingSubmissionQuery = useMemo(
    () => trpc.betaApplications.checkExisting.queryOptions(),
    []
  );

  const userDataQuery = useMemo(() => trpc.user.getMe.queryOptions(), []);

  // Queries
  const bounties = useQuery(bountiesQuery);
  const myBounties = useQuery(myBountiesQuery);
  const existingSubmission = useQuery(existingSubmissionQuery);
  const userData = useQuery(userDataQuery);

  const { data: session } = authClient.useSession();
  const { isMobile } = useDevice();
  const { createModalOpen, closeCreateModal } = useBountyModals();
  const [importOpen, setImportOpen] = useState(false);

  // Memoized handlers
  // const handleBountyClick = useCallback(
  //   (bounty: Bounty) => {
  //     router.push(`/bounty/${bounty.id}?from=dashboard`);
  //   },
  //   [router],
  // );

  const handleSubmissionRefetch = useCallback(() => {
    existingSubmission.refetch();
  }, [existingSubmission]);

  // Loading state for critical data
  // const isInitialLoading =
  //   bounties.isLoading || myBounties.isLoading || userData.isLoading;

  // if (isInitialLoading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <Spinner />
  //     </div>
  //   );
  // }

  return (
    <ErrorBoundary>
      <AccessGate
        fallback={
          <BetaAccessScreen
            existingSubmission={existingSubmission.data}
            isMobile={isMobile}
            onSubmissionRefetch={handleSubmissionRefetch}
            sessionUserName={session?.user.name}
            userData={userData.data}
          />
        }
        skeleton={<DashboardPageSkeleton />}
        stage="beta"
      >
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
        {/* <FloatingCreateMenu
          disabled={!session?.user}
          onCreate={() => openCreateModal()}
          onImport={() => setImportOpen(true)}
        /> */}
        <CreateBountyModal
          onOpenChange={closeCreateModal}
          open={createModalOpen}
        />
        <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
      </AccessGate>
    </ErrorBoundary>
  );
}
