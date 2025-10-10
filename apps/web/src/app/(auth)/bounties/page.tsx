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
import { useMutation, useQuery } from '@tanstack/react-query';
import { ChevronDown, Plus, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { toast } from 'sonner';
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

  const { mutate: getRandomBounty, isPending: isLoadingRandom } = useMutation(
    trpc.bounties.randomBounty.mutationOptions({
      onSuccess: (response) => {
        if (response.success && response.data) {
          router.push(`/bounty/${response.data.id}`);
        }
      },
      onError: (error) => {
        toast.error(error.message || 'No open bounties available');
      },
    })
  );

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
        <div className="mb-6 flex items-center justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => getRandomBounty()}
            disabled={isLoadingRandom}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoadingRandom ? 'Finding...' : "I'm Feeling Lucky"}
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
