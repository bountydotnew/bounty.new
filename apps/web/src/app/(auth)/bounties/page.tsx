'use client';

import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Dices, Plus } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useBountyModals } from '@bounty/ui/lib/bounty-utils';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { CreateBountyModal } from '@/components/bounty/create-bounty-modal';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import GitHub from '@/components/icons/github';
import { AccessGate } from '@/components/access-gate';
import { BetaAccessScreen } from '@/components/dashboard/beta-access-screen';
import type { AccessStage } from '@/types/access';
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
        <div className="mb-6 flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link href="/api/bounty/random">
              <Dices className="mr-2 h-4 w-4" />
              I'm Feeling Lucky
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
        </div>

// at the top of apps/web/src/app/(auth)/bounties/page.tsx
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";
import AccessGate from "...";
import BetaAccessScreen from "...";
import { AccessStage } from "...";
// …other imports…

export default function BountiesPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  // …the rest of your component…
  
        <AccessGate
          fallback={
            <BetaAccessScreen
              isMobile={false}
              onSubmissionRefetch={() => router.refresh()}
            />
          }
          stage={"beta" as AccessStage}
        >
          <BountiesFeed
            bounties={bounties?.data}
            error={error}
            isError={error !== null}
            isLoading={isLoading}
            layout="grid"
            title=""
          />
        </AccessGate>
  
  // …more JSX…
}
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
