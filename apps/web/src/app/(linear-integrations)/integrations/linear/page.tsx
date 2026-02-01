'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LinearIcon } from '@bounty/ui';
import { useIntegrations } from '@/hooks/use-integrations';

export default function LinearRootPage() {
  const router = useRouter();
  const { hasLinear, linearWorkspace, linkLinear, isLinearLoading } = useIntegrations();

  // Redirect to workspace-specific route if connected
  useEffect(() => {
    if (hasLinear && linearWorkspace) {
      router.replace(`/integrations/linear/${linearWorkspace.id}`);
    }
  }, [hasLinear, linearWorkspace, router]);

  // Show connection UI if not connected
  if (!hasLinear) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-6">
            <LinearIcon className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Connect Linear
          </h1>
          <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto leading-relaxed">
            Link your Linear workspace to create bounties from issues and track progress across teams.
          </p>
          <button
            onClick={linkLinear}
            disabled={isLinearLoading}
            className="w-full h-11 px-6 rounded-xl bg-white text-sm font-medium text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
          >
            {isLinearLoading ? 'Connecting...' : 'Connect Linear'}
          </button>
          <p className="text-xs text-neutral-500 mt-6">
            You'll be redirected to Linear to authorize
          </p>
        </div>
      </div>
    );
  }

  // Loading state while redirecting
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-6 h-6 border-2 border-neutral-700 border-t-white rounded-full animate-spin" />
    </div>
  );
}
