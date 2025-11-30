'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import React from 'react';
import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { trpc } from '@/utils/trpc';

export default function BountiesPage() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const isAuthenticated = !!session?.user;

  const {
    data: bounties,
    isLoading,
    error,
  } = useQuery({
    ...trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 50,
    }),
    enabled: isAuthenticated && !isSessionPending,
  });

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
        <AuthGuard>
          <BountiesFeed
            bounties={bounties?.data}
            error={error}
            isError={Boolean(error)}
            isLoading={isLoading}
            layout="grid"
            title=""
          />
        </AuthGuard>
      </div>

      <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
    </>
  );
}
