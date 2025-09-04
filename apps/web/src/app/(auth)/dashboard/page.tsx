"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback, useState } from "react";
import { trpc } from "@/utils/trpc";
import { authClient } from "@bounty/auth/client";
import { useDevice } from "@/components/device-provider";
import { Onboarding } from "@/components/onboarding";
// Dashboard components
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { BetaAccessScreen } from "@/components/dashboard/beta-access-screen";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { BountiesFeed } from "@/components/bounty/bounties-feed";
import { AccessGate } from "@/components/access-gate";
import { Header } from "@/components/dual-sidebar/sidebar-header";
import { Button } from "@/components/ui/button";
import { useBountyModals } from "@/lib/bounty-utils";
import { CreateBountyModal } from "@/components/bounty/create-bounty-modal";
import GithubImportModal from "@/components/bounty/github-import-modal";
import GitHub from "@/components/icons/github";
import { FloatingCreateMenu } from "@/components/bounty/floating-create-menu";

// Constants and types
import { PAGINATION_LIMITS, PAGINATION_DEFAULTS } from "@/constants/dashboard";
import type { Bounty } from "@/types/dashboard";

export default function Dashboard() {
  // Memoized query options for better performance
  const bountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchAllBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.ALL_BOUNTIES,
      }),
    [],
  );

  const myBountiesQuery = useMemo(
    () =>
      trpc.bounties.fetchMyBounties.queryOptions({
        page: PAGINATION_DEFAULTS.PAGE,
        limit: PAGINATION_LIMITS.MY_BOUNTIES,
      }),
    [],
  );

  const existingSubmissionQuery = useMemo(
    () => trpc.betaApplications.checkExisting.queryOptions(),
    [],
  );

  const userDataQuery = useMemo(() => trpc.user.getMe.queryOptions(), []);

  // Queries
  const bounties = useQuery(bountiesQuery);
  const myBounties = useQuery(myBountiesQuery);
  const existingSubmission = useQuery(existingSubmissionQuery);
  const userData = useQuery(userDataQuery);

  const { data: session } = authClient.useSession();
  const { isMobile } = useDevice();
  const { createModalOpen, openCreateModal, closeCreateModal } = useBountyModals();
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
        stage="beta"
        fallback={
          <BetaAccessScreen
            userData={userData.data}
            sessionUserName={session?.user.name}
            existingSubmission={existingSubmission.data}
            isMobile={isMobile}
            onSubmissionRefetch={handleSubmissionRefetch}
          />
        }
      >
        <Onboarding />
        <Header
          myBounties={myBounties.data?.data ?? []}
          isMyBountiesLoading={myBounties.isLoading}
        />
        <div className="bg-background">
          <div className="container mx-auto px-4 py-4 rounded-lg">
            <div className="flex justify-end items-center mb-4">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!session?.user}
                  onClick={() => setImportOpen(true)}
                >
                  <GitHub className="h-4 w-4 fill-white" />
                  Import from GitHub
                </Button>
                <Button disabled={!session?.user} onClick={() => openCreateModal()}>
                  Create Bounty
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-8rem)] rounded-lg py-4">
              {/* Center - Bounties Feed */}
              <div className="lg:col-span-2 flex flex-col rounded-lg">
                <div className="lg:overflow-y-auto lg:h-full rounded-lg">
                  <BountiesFeed
                    layout="list"
                    bounties={bounties.data?.data ?? []}
                    isLoading={bounties.isLoading}
                    isError={bounties.isError}
                    error={bounties.error instanceof Error ? bounties.error : undefined}
                    className="lg:pr-2"
                  />
                </div>
              </div>

              {/* Right Sidebar - Activity & My Bounties (Desktop Only) */}
              <div className="hidden lg:block lg:col-span-1 rounded-lg">
                <div className="sticky top-0 lg:h-[calc(100vh-8rem)] lg:overflow-y-auto">
                  <div className="space-y-6 lg:pr-2">
                    <DashboardSidebar
                      myBounties={myBounties.data?.data ?? []}
                      isLoadingMyBounties={myBounties.isLoading}
                      onBountyClick={(bounty) => {
                        console.log("Bounty clicked:", bounty);
                        // setIsOpen(false);
                      }}
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
        <CreateBountyModal open={createModalOpen} onOpenChange={closeCreateModal} />
        <GithubImportModal open={importOpen} onOpenChange={setImportOpen} />
      </AccessGate>
    </ErrorBoundary>
  );
}
