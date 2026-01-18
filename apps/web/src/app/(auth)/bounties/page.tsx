'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import React, { useEffect } from 'react';
import { Button } from '@bounty/ui/components/button';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { BountyFilters } from '@/components/bounty/bounty-filters';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { trpc } from '@/utils/trpc';
import { parseAsString, useQueryState } from 'nuqs';
import { useSession } from '@/context/session-context';
import { toast } from 'sonner';

export default function BountiesPage() {
  const { isAuthenticated, isPending: isSessionPending } = useSession();

  const [search] = useQueryState('search', parseAsString);
  const [creatorId] = useQueryState('creatorId', parseAsString);
  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withDefault('created_at'));
  const [sortOrder, setSortOrder] = useQueryState('sortOrder', parseAsString.withDefault('desc'));

  const {
    data: bounties,
    isLoading,
    error,
  } = useQuery({
    ...trpc.bounties.fetchAllBounties.queryOptions({
      page: 1,
      limit: 100, // Higher limit for "view all" page
      search: search || undefined,
      creatorId: creatorId || undefined,
      sortBy: (sortBy as 'created_at' | 'amount' | 'deadline' | 'title') || 'created_at',
      sortOrder: (sortOrder as 'asc' | 'desc') || 'desc',
    }),
    enabled: isAuthenticated && !isSessionPending,
    retry: false,
  });

  // Show toast notification for validation errors
  useEffect(() => {
    if (error) {
      const errorMessage = error.message || 'Failed to load bounties';
      
      // Check if it's a validation error (BAD_REQUEST)
      if (errorMessage.includes('Invalid option') || errorMessage.includes('invalid_value')) {
        toast.error('Invalid filter options. Please reset your filters.', {
          description: 'The selected sort or filter options are invalid.',
        });
        // Reset to defaults
        setSortBy('created_at');
        setSortOrder('desc');
      } else {
        toast.error('Failed to load bounties', {
          description: errorMessage,
        });
      }
    }
  }, [error]);

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
          <BountyFilters />
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
