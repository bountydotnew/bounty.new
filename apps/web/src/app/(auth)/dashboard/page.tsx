'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { track } from '@databuddy/sdk';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Plus } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { AccessGate } from '@/components/access-gate';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { BetaAccessScreen } from '@/components/dashboard/beta-access-screen';
import { DashboardSidebar } from '@/components/dashboard/dashboard-sidebar';
// Dashboard components
import { ErrorBoundary } from '@/components/dashboard/error-boundary';
import { DashboardPageSkeleton } from '@/components/dashboard/skeletons/dashboard-page-skeleton';
import { useDevice } from '@/components/device-provider';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import GitHub from '@/components/icons/github';
import { Onboarding } from '@/components/onboarding';
// Constants and types
import { PAGINATION_DEFAULTS, PAGINATION_LIMITS } from '@/constants';
import type { Bounty } from '@/types/dashboard';
import { trpc } from '@/utils/trpc';

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
          myBounties={(myBounties.data?.data ?? []) as unknown as Bounty[]}
        />
        <div className="bg-background">
          <div className="container mx-auto rounded-lg px-4 py-4">
            <div className="mb-4 flex items-center justify-end">
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      className="flex items-center justify-start rounded-md bg-white p-0 text-black hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={!session?.user}
                    >
                      <div className="flex h-7 items-center justify-center gap-1.5 overflow-hidden rounded-tl-md rounded-bl-md bg-white pr-0 pl-3">
                        <div className="justify-start gap-0 p-0 text-center text-black text-sm leading-none">
                          Create Bounty
                        </div>
                      </div>
                      <div className="flex items-center justify-start gap-2.5 self-stretch px-0">
                        <div className="relative h-3 w-px rounded-full bg-[#D0D0D0]" />
                      </div>
                      <div className="flex h-7 items-center justify-center gap-1.5 overflow-hidden rounded-tr-md rounded-br-md pr-2">
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openCreateModal()}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create Bounty
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setImportOpen(true)}>
                      <GitHub className="mr-2 h-4 w-4 fill-current" />
                      Import from GitHub
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-6 rounded-lg py-4 lg:h-[calc(100vh-8rem)] lg:grid-cols-3">
              {/* Center - Bounties Feed */}
              <div className="flex flex-col rounded-lg lg:col-span-2">
                <div className="rounded-lg lg:h-full lg:overflow-y-auto">
                  <BountiesFeed
                    bounties={
                      (bounties.data?.data ?? []) as unknown as Bounty[]
                    }
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
                      myBounties={
                        (myBounties.data?.data ?? []) as unknown as Bounty[]
                      }
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
