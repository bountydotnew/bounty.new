import { useBounties } from '../hooks/useBounties';
import { useSendMessage } from '../hooks/use-vscode-message';
import { BountyCard } from './BountyCard';
import { Button, Spinner } from './ui';
import { BountyLogo } from './icons/BountyLogo';
import type { Bounty } from '../types';

interface BountiesViewProps {
  onOpenBounty: (bounty: Bounty) => void;
}

export function BountiesView({ onOpenBounty }: BountiesViewProps) {
  const { bounties, isLoading, error, refresh } = useBounties();
  const sendMessage = useSendMessage();

  const handleLogout = () => {
    sendMessage('logout');
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-2">
          <BountyLogo className="h-7 w-7 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="icon"
            onClick={refresh}
            title="Refresh bounties"
            aria-label="Refresh"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
          <Button
            variant="icon"
            onClick={handleLogout}
            title="Logout"
            aria-label="Logout"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Spinner />
            <p className="text-sm text-muted-foreground">Loading bounties...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="max-w-md p-4 text-sm bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
            <Button onClick={refresh} className="mt-4">
              Try Again
            </Button>
          </div>
        ) : bounties.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-sm text-muted-foreground">No bounties found</p>
            <Button onClick={refresh} className="mt-4">
              Refresh
            </Button>
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {bounties.map((bounty) => (
              <BountyCard
                key={bounty.id}
                bounty={bounty}
                onClick={() => onOpenBounty(bounty)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
