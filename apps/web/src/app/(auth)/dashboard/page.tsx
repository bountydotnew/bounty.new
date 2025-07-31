"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useCallback } from "react";
import { trpc } from "@/utils/trpc";
import { authClient } from "@bounty/auth/client";
import { useDevice } from "@/components/device-provider";
import { Onboarding } from "@/components/onboarding";

// Dashboard components
import { ErrorBoundary } from "@/components/dashboard/error-boundary";
import { LoadingState } from "@/components/dashboard/loading-state";
import { BetaAccessScreen } from "@/components/dashboard/beta-access-screen";
import { BountiesFeed } from "@/components/dashboard/bounties-feed";
import { MyBountiesSidebar } from "@/components/dashboard/my-bounties-sidebar";
import { ActivitySidebar } from "@/components/dashboard/activity-sidebar";

// Constants and types
import { PAGINATION_LIMITS, PAGINATION_DEFAULTS } from "@/constants/dashboard";
import type { Bounty } from "@/types/dashboard";

export default function Dashboard() {
  // Memoized query options for better performance
  const bountiesQuery = useMemo(() => 
    trpc.bounties.fetchAllBounties.queryOptions({ 
      page: PAGINATION_DEFAULTS.PAGE, 
      limit: PAGINATION_LIMITS.ALL_BOUNTIES 
    }), []
  );

  const myBountiesQuery = useMemo(() => 
    trpc.bounties.fetchMyBounties.queryOptions({ 
      page: PAGINATION_DEFAULTS.PAGE, 
      limit: PAGINATION_LIMITS.MY_BOUNTIES 
    }), []
  );

  const existingSubmissionQuery = useMemo(() => 
    trpc.betaApplications.checkExisting.queryOptions(), []
  );

  const userDataQuery = useMemo(() => 
    trpc.user.getMe.queryOptions(), []
  );

  // Queries
  const bounties = useQuery(bountiesQuery);
  const myBounties = useQuery(myBountiesQuery);
  const existingSubmission = useQuery(existingSubmissionQuery);
  const userData = useQuery(userDataQuery);

  const { data: session } = authClient.useSession();
  const { isMobile } = useDevice();

  // Memoized handlers
  const handleBountyClick = useCallback((bounty: Bounty) => {
    // TODO: Navigate to bounty detail page
    console.log('Navigate to bounty:', bounty.id);
  }, []);

  const handleSubmissionRefetch = useCallback(() => {
    existingSubmission.refetch();
  }, [existingSubmission]);

  // Loading state for critical data
  const isInitialLoading = bounties.isLoading || myBounties.isLoading || userData.isLoading;
  
  if (isInitialLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  // Beta access check
  if (userData.data?.betaAccessStatus !== "approved") {
    return (
      <ErrorBoundary>
        <BetaAccessScreen
          userData={userData.data}
          sessionUserName={session?.user.name}
          existingSubmission={existingSubmission.data}
          isMobile={isMobile}
          onSubmissionRefetch={handleSubmissionRefetch}
        />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Onboarding />
      <div className="bg-background">
        <div className="container mx-auto px-4 py-4 rounded-lg">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[calc(100vh-8rem)] rounded-lg py-4">
            {/* Center - Bounties Feed */}
            <div className="lg:col-span-2 lg:overflow-y-auto lg:h-full rounded-lg">
              <BountiesFeed
                bounties={bounties.data?.data as Bounty[] | undefined}
                isLoading={bounties.isLoading}
                isError={bounties.isError}
                error={bounties.error as Error | null | undefined}
                onBountyClick={handleBountyClick}
              />
            </div>

            {/* Right Sidebar - Activity & My Bounties */}
            <div className="lg:col-span-1 lg:overflow-y-auto lg:h-full rounded-lg">
              <div className="space-y-6 lg:pr-2">
                <ActivitySidebar />
                <MyBountiesSidebar
                  myBounties={myBounties.data?.data as Bounty[] | undefined}
                  isLoading={myBounties.isLoading}
                  onBountyClick={handleBountyClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
