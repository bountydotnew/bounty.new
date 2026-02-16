'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { useIntegrations } from '@/hooks/use-integrations';
import { useOrgPath } from '@/hooks/use-org-path';

export default function LinearRootPage() {
  const router = useRouter();
  const {
    hasLinear,
    hasLinearOAuth,
    linearWorkspace,
    linkLinear,
    syncLinearWorkspace,
    isLinearLoading,
  } = useIntegrations();
  const [isSyncing, setIsSyncing] = useState(false);
  const orgPath = useOrgPath();

  // Redirect to workspace-specific route if connected
  useEffect(() => {
    if (hasLinear && linearWorkspace) {
      router.replace(orgPath(`/integrations/linear/${linearWorkspace.id}`));
    }
  }, [hasLinear, linearWorkspace, router, orgPath]);

  // Auto-sync workspace if user has OAuth but no connected workspace
  useEffect(() => {
    if (hasLinearOAuth && !hasLinear && !isLinearLoading && !isSyncing) {
      setIsSyncing(true);
      syncLinearWorkspace().finally(() => {
        setIsSyncing(false);
      });
    }
  }, [
    hasLinearOAuth,
    hasLinear,
    isLinearLoading,
    syncLinearWorkspace,
    isSyncing,
  ]);

  // Show loading state while syncing or loading initial data
  if (isLinearLoading || isSyncing) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-6 h-6 border-2 border-border-default border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show connection UI if not connected
  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
            <LinearIcon className="w-8 h-8 text-text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Connect Linear
          </h1>
          <p className="text-sm text-text-muted mb-8 max-w-sm mx-auto leading-relaxed">
            Link your Linear workspace to create bounties from issues and track
            progress across teams.
          </p>
          <button
            type="button"
            onClick={linkLinear}
            disabled={isLinearLoading}
            className="w-full h-11 px-6 rounded-xl bg-foreground text-sm font-medium text-background hover:opacity-90 transition-colors disabled:opacity-50"
          >
            {isLinearLoading ? 'Connecting...' : 'Connect Linear'}
          </button>
          <p className="text-xs text-text-muted mt-6">
            You'll be redirected to Linear to authorize
          </p>
        </div>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-6 h-6 border-2 border-border-default border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
