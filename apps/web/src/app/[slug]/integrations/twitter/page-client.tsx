'use client';

import { TwitterIcon } from '@bounty/ui';
import { useIntegrations } from '@/hooks/use-integrations';
import { Button } from '@bounty/ui/components/button';
import { Loader2, Link as LinkIcon, Unlink } from 'lucide-react';

export default function TwitterRootPage() {
  const {
    twitterAccount,
    hasTwitter,
    isTwitterLoading,
    linkTwitter,
    unlinkTwitter,
  } = useIntegrations();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-2 mb-6">
          <TwitterIcon className="w-8 h-8 text-text-primary" />
        </div>

        <h1 className="text-2xl font-semibold text-foreground mb-2">
          X (Twitter) Integration
        </h1>

        {hasTwitter && twitterAccount ? (
          <>
            <p className="text-sm text-text-secondary mb-6 max-w-sm mx-auto leading-relaxed">
              Connected as @{twitterAccount.username}
            </p>

            <div className="bg-surface-1 border border-border-subtle rounded-xl p-6 mb-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <TwitterIcon className="w-5 h-5 text-text-secondary" />
                <span className="text-foreground font-medium">
                  @{twitterAccount.username}
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => unlinkTwitter()}
              disabled={isTwitterLoading}
              className="w-full"
            >
              {isTwitterLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Disconnecting...
                </>
              ) : (
                <>
                  <Unlink className="w-4 h-4 mr-2" />
                  Disconnect
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
              Link your X account to enable bounty creation from tweets. When
              someone replies to your bounty tweet with @bountydotnew, a bounty
              will be created automatically.
            </p>

            <Button
              onClick={() => linkTwitter()}
              disabled={isTwitterLoading}
              className="w-full"
            >
              {isTwitterLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Connect X
                </>
              )}
            </Button>

            <p className="text-xs text-text-tertiary mt-6">
              You'll be redirected to X to authorize
            </p>
          </>
        )}
      </div>
    </div>
  );
}
