'use client';

import Link from 'next/link';
import React, { useEffect, use } from 'react';
import { Button } from '@bounty/ui/components/button';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { BountyFilters } from '@/components/bounty/bounty-filters';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { AuthGuard } from '@/components/auth/auth-guard';
import { BountyListProvider, BountyListContext } from '@/components/bounty/bounty-list';
import { toast } from 'sonner';

function BountiesPageContent() {
  const [importOpen, setImportOpen] = React.useState(false);

  // Access the bounty list state from context
  const context = use(BountyListContext);
  if (!context) {
    throw new Error('BountiesPageContent must be used within BountyListProvider');
  }

  const { state, actions } = context;

  // Show toast notification for validation errors
  useEffect(() => {
    if (state.error) {
      const errorMessage = state.error.message || 'Failed to load bounties';

      // Check if it's a validation error (BAD_REQUEST)
      if (errorMessage.includes('Invalid option') || errorMessage.includes('invalid_value')) {
        toast.error('Invalid filter options. Please reset your filters.', {
          description: 'The selected sort or filter options are invalid.',
        });
        // Reset to defaults
        actions.resetFilters();
      } else {
        toast.error('Failed to load bounties', {
          description: errorMessage,
        });
      }
    }
  }, [state.error, actions]);

  if (state.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="mb-4 font-bold text-2xl text-red-600">
            Error Loading Bounties
          </h1>
          <p className="text-gray-600">{state.error.message}</p>
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
            bounties={state.bounties}
            error={state.error}
            isError={Boolean(state.error)}
            isLoading={state.isLoading}
            layout="grid"
            title=""
          />
        </AuthGuard>
      </div>

      <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
    </>
  );
}

export default function BountiesPage() {
  return (
    <BountyListProvider>
      <BountiesPageContent />
    </BountyListProvider>
  );
}
