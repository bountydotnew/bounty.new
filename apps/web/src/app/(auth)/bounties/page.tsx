'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import React from 'react';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import GitHub from '@/components/icons/github';
import { trpc } from '@/utils/trpc';

export default function BountiesPage() {
  const { data: session } = authClient.useSession();

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

  const router = useRouter();

  const { createModalOpen, openCreateModal, closeCreateModal } =
    useBountyModals();
  const [importOpen, setImportOpen] = React.useState(false);

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl text-red-600">
            Error Loading Bounties
          </h1>
          <p className="text-gray-600">{error.message}</p>
          <Button className="mt-4" onClick={() => router.refresh()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-end">
          <div className="flex gap-2">
            <Button
              disabled={!session?.user}
              onClick={() => setImportOpen(true)}
              variant="outline"
            >
              <GitHub className="h-4 w-4 fill-white" />
              Import from GitHub
            </Button>
            <Button disabled={!session?.user} onClick={() => openCreateModal()}>
              Create Bounty
            </Button>
          </div>
        </div>

        <BountiesFeed
          bounties={bounties?.data}
          error={error}
          isError={error !== null}
          isLoading={isLoading}
          layout="grid"
          title=""
        />
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
