'use client';

import { authClient } from '@bounty/auth/client';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { AccessGate } from '@/components/access-gate';
import { DashboardPageSkeleton } from '@/components/dashboard/skeletons/dashboard-page-skeleton';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { BetaAccessScreen } from '@/components/dashboard/beta-access-screen';
import { Button } from '@bounty/ui/components/button';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
// Dashboard components
import { ErrorBoundary } from '@/components/dashboard/error-boundary';
import { useDevice } from '@/components/device-provider';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import GitHub from '@/components/icons/github';
import { Onboarding } from '@/components/onboarding';
import { TrackedButton } from '@bounty/ui/components/tracked-button';
// Constants and types
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { trpc } from '@/utils/trpc';
import { track } from "@databuddy/sdk"

track('screen_view', { screen_name: 'dashboard' });

export default function Dashboard() {
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
  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();
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
        <div className="bg-background">
          <div className="container mx-auto rounded-lg px-4 py-4">
            <div className="mb-4 flex items-center justify-end">
              <div className="flex gap-2">
                <TrackedButton
                  disabled={!session?.user}
                  onClick={() => setImportOpen(true)}
                  trackEventName="import_from_github"
                  trackProperties={{ type: 'import_from_github' }}
                  variant="outline"
                >
                  <GitHub className="h-4 w-4 fill-white" />
                  Import from GitHub
                </TrackedButton>
                <TrackedButton
                  disabled={!session?.user}
                  onClick={() => openCreateModal()}
                  trackEventName="create_bounty"
                  trackProperties={{ type: 'create_bounty' }}
                >
                  Create Bounty
                </TrackedButton>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 rounded-lg py-4 lg:h-[calc(100vh-8rem)] lg:grid-cols-3">
              {/* Center - Bounties Feed */}
              <div className="flex flex-col rounded-lg lg:col-span-2">
                <div className="rounded-lg lg:h-full lg:overflow-y-auto">
                  <BountiesFeed
                    bounties={bounties.data?.data ?? []}
                    className="lg:pr-2"
                    error={
                      bounties.error instanceof Error
                        ? bounties.error
                        : undefined
                    }
                    isError={bounties.isError}
                    isLoading={bounties.isLoading}
                    layout="list"
                  />
                </div>
              </div>

              {/* Right Sidebar - Activity & My Bounties (Desktop Only) */}
              <div className="hidden rounded-lg lg:col-span-1 lg:block">
                <div className="sticky top-0 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
                  <div className="space-y-6 lg:pr-2">
                    <DashboardSidebar
                      isLoadingMyBounties={myBounties.isLoading}
                      myBounties={myBounties.data?.data ?? []}
                    />
                  </div>
                </div>
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
