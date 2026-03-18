'use client';

import Link from 'next/link';
import React, { useRef, use } from 'react';
import { Button } from '@bounty/ui/components/button';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import { BountyFilters } from '@/components/bounty/bounty-filters';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  BountyListProvider,
  BountyListContext,
} from '@/components/bounty/bounty-list';
import { toast } from 'sonner';

function BountiesPageContent() {
  // Access the bounty list state from context
  const context = use(BountyListContext);
  if (!context) {
    throw new Error(
      'BountiesPageContent must be used within BountyListProvider'
    );
  }

  const { state, actions } = context;
  const lastErrorRef = useRef<Error | null>(null);

  // Show toast notification for validation errors (render-time, fires once per new error)
  if (state.error && state.error !== lastErrorRef.current) {
    lastErrorRef.current = state.error;
    const errorMessage = state.error.message || 'Failed to load bounties';

    if (
      errorMessage.includes('Invalid option') ||
      errorMessage.includes('invalid_value')
    ) {
      toast.error('Invalid filter options. Please reset your filters.', {
        description: 'The selected sort or filter options are invalid.',
      });
      actions.resetFilters();
    } else {
      toast.error('Failed to load bounties', {
        description: errorMessage,
      });
    }
  } else if (!state.error) {
    lastErrorRef.current = null;
  }

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
    <div className="container mx-auto px-4 py-8">
      <AuthGuard>
        <BountyFilters />
        <BountiesFeed.Provider
          bounties={state.bounties}
          isLoading={state.isLoading}
        >
          <BountiesFeed.GridView />
        </BountiesFeed.Provider>
      </AuthGuard>
    </div>
  );
}

export default function BountiesPage() {
  return (
    <BountyListProvider>
      <BountiesPageContent />
    </BountyListProvider>
  );
}
