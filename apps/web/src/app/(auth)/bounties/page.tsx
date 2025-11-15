'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Dices, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useMediaQuery } from '@bounty/ui/hooks/use-media-query';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import GitHub from '@/components/icons/github';
import { AccessGate } from '@/components/access-gate';
import { BetaAccessScreen } from '@/components/dashboard/beta-access-screen';
import { trpc } from '@/utils/trpc';

export default function BountiesPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const {
    data: bounties,
    isLoading,
    error,
  } = useQuery(
    trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 50,
    })
  );

  // Fetch current user data for BetaAccessScreen
  const {
    data: currentUserData,
    isLoading: isUserLoading,
  } = useQuery({
    ...trpc.user.getCurrentUser.queryOptions(),
    enabled: !!session?.user,
  });

  // Fetch beta application submission status
  const {
    data: betaSubmissionData,
    refetch: refetchSubmission,
  } = useQuery({
    ...trpc.betaApplications.checkExisting.queryOptions(),
    enabled: !!session?.user,
  });

  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();
  const [importOpen, setImportOpen] = React.useState(false);

  // Prepare userData for BetaAccessScreen
  const userData = currentUserData?.data?.user
    ? {
        name: currentUserData.data.user.name ?? undefined,
        betaAccessStatus: 'none' as const, // Default, could be enhanced
        accessStage: 'none' as const, // Default, could be enhanced
      }
    : undefined;

  const existingSubmission = betaSubmissionData
    ? { hasSubmitted: betaSubmissionData.hasSubmitted }
    : undefined;

  // Show loading state while user data is being fetched
  if (isUserLoading && session?.user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl text-red-600">
            Error Loading Bounties
          </h1>
          <p className="text-gray-600">{error.message}</p>
          <Button className="mt-4" asChild>
            <Link href="/bounties">Try Again</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* <div className="mb-6 flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/api/bounty/random">
              <Dices className="mr-2 h-4 w-4" />
              I&apos;m Feeling Lucky
            </Link>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button disabled={!session?.user}>
                <Plus className="mr-2 h-4 w-4" />
                Create Bounty
                <ChevronDown className="ml-2 h-4 w-4" />
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
        </div> */}

        <AccessGate
          fallback={
            <BetaAccessScreen
              existingSubmission={existingSubmission}
              isMobile={isMobile}
              onSubmissionRefetch={async () => {
                await refetchSubmission();
                router.refresh();
              }}
              sessionUserName={session?.user?.name ?? undefined}
              userData={userData}
            />
          }
          stage="beta"
        >
          <BountiesFeed
            bounties={bounties?.data}
            error={error}
            isError={Boolean(error)}
            isLoading={isLoading}
            layout="grid"
            title=""
          />
        </AccessGate>
  
      </div>

      <CreateBountyModal
        onOpenChange={closeCreateModal}
        open={createModalOpen}
      />
      <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
      {/* <FloatingCreateMenu
        disabled={!session?.user}
        onCreate={() => openCreateModal()}
        onImport={() => setImportOpen(true)}
      /> */}
    </>
  );
}
