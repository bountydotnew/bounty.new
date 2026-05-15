'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import NumberFlow from '@bounty/ui/components/number-flow';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { CheckCircle2, Clipboard, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { useMountEffect } from '@bounty/ui';
import { toast } from 'sonner';
import { useConfetti } from '@/context/confetti-context';
import type { WaitlistCookieData } from '@/types/waitlist';
import { trpc, trpcClient } from '@/utils/trpc';
import { MockBrowser } from './mockup';

const WAITLIST_STORAGE_KEY = 'waitlist_data';

function readStoredWaitlist(): WaitlistCookieData | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WaitlistCookieData) : null;
  } catch {
    return null;
  }
}

function writeStoredWaitlist(data: WaitlistCookieData) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures
  }
}

function useWaitlistSubmission() {
  const { celebrate } = useConfetti();
  const [success, setSuccess] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () => trpcClient.earlyAccess.joinWaitlist.mutate(),
    onSuccess: () => {
      setSuccess(true);

      const cookieData: WaitlistCookieData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: '',
      };
      writeStoredWaitlist(cookieData);

      celebrate();
      toast.success("You're on the list!");
    },
    onError: (error: unknown) => {
      // Check for tRPC UNAUTHORIZED errors or "Authentication required" message
      const isAuthError =
        error &&
        typeof error === 'object' &&
        'data' in error &&
        typeof error.data === 'object' &&
        error.data &&
        'code' in error.data &&
        error.data.code === 'UNAUTHORIZED';

      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error && 'message' in error
            ? (error.message as string)
            : '';

      const isAuthMessage =
        message.includes('Authentication required') ||
        message.includes('Must be logged in') ||
        message.includes('UNAUTHORIZED');

      if (isAuthError || isAuthMessage) {
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/',
        });
        return;
      }

      if (
        message.toLowerCase().includes('too many') ||
        message.toLowerCase().includes('slow down')
      ) {
        toast.error('Too many attempts. Please try again later.');
      } else {
        toast.error(message || 'Something went wrong. Please try again.');
      }
    },
  });

  return { mutate, isPending, success, setSuccess };
}

interface WaitlistPageProps {
  compact?: boolean;
}

function WaitlistPage({ compact = false }: WaitlistPageProps) {
  const waitlistSubmission = useWaitlistSubmission();
  const [copied, setCopied] = useState(false);

  useMountEffect(() => {
    const stored = readStoredWaitlist();
    if (stored?.submitted) {
      waitlistSubmission.setSuccess(true);
    }
  });

  function joinWaitlist() {
    waitlistSubmission.mutate();
  }

  const isFormDisabled = waitlistSubmission.isPending;

  const waitlistCountQuery = useQuery({
    ...trpc.earlyAccess.getWaitlistCount.queryOptions(),
    retry: 2,
    retryDelay: 1000,
  });
  const waitlistCount = waitlistCountQuery.data?.count ?? 0;
  const hasWaitlistCount = waitlistCount > 0;
  const waitlistCountLabel = hasWaitlistCount
    ? `#${waitlistCount.toLocaleString()}`
    : 'Reserved';
  const shareText =
    'I joined the bounty.new early access list to turn GitHub issues into paid work.';

  async function copyWaitlistStatus() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        `${shareText} ${hasWaitlistCount ? `Current waitlist: ${waitlistCountLabel}. ` : ''}https://bounty.new`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Could not copy update. Please copy manually.');
    }
  }

  function shareWaitlistStatus() {
    if (typeof window === 'undefined') {
      return;
    }

    const url = new URL('https://x.com/intent/tweet');
    url.searchParams.set('text', shareText);
    url.searchParams.set('url', 'https://bounty.new');
    window.open(url.toString(), '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <div
        className={`flex flex-col items-center justify-center h-full ${compact ? 'px-3 py-4' : 'px-6 py-10'}`}
      >
        <div className={`w-full ${compact ? 'max-w-xs' : 'max-w-sm'}`}>
          {/* Header */}
          <div className={`text-left ${compact ? 'mb-4' : 'mb-8'}`}>
            <h1
              className={`${compact ? 'text-lg' : 'text-2xl'} font-medium text-foreground tracking-tight ${compact ? 'mb-1' : 'mb-2'}`}
            >
              Get early access
            </h1>
            <p
              className={`${compact ? 'text-xs' : 'text-sm'} text-text-muted leading-relaxed`}
            >
              {compact
                ? 'Join the waitlist to get started.'
                : 'Join the waitlist to start creating bounties and getting paid to build.'}
            </p>
          </div>

          {/* Success state */}
          {waitlistSubmission.success ? (
            <div
              className={`relative overflow-hidden border border-border-subtle bg-surface-1/90 shadow-[0_18px_60px_rgba(0,0,0,0.18)] ${
                compact ? 'rounded-xl p-4' : 'rounded-2xl p-6'
              }`}
            >
              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex items-center justify-center rounded-full border border-brand-accent/30 bg-brand-accent/10 text-brand-accent ${
                      compact ? 'h-9 w-9' : 'h-12 w-12'
                    }`}
                  >
                    <CheckCircle2 className={compact ? 'h-5 w-5' : 'h-6 w-6'} />
                  </div>
                  <div className="inline-flex items-center rounded-full border border-brand-accent/25 bg-brand-accent/10 px-2.5 py-1 text-[11px] text-brand-accent-muted">
                    Confirmed
                  </div>
                </div>

                <div className={compact ? 'mt-3' : 'mt-5'}>
                  <h2
                    className={`${compact ? 'text-base' : 'text-xl'} font-medium text-foreground tracking-tight`}
                  >
                    You're on the list
                  </h2>
                  <p
                    className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} text-text-muted leading-relaxed`}
                  >
                    Your early access spot is saved. We'll reach out when it's
                    your turn.
                  </p>
                </div>

                <div
                  className={`grid grid-cols-2 gap-2 ${compact ? 'mt-4' : 'mt-5'}`}
                >
                  <div className="rounded-lg border border-border-subtle bg-background/70 p-3">
                    <p className="text-[11px] text-text-muted">
                      Current waitlist
                    </p>
                    <p
                      className={`${compact ? 'text-lg' : 'text-2xl'} font-medium text-foreground tabular-nums`}
                    >
                      {waitlistCountLabel}
                    </p>
                  </div>
                  <div className="rounded-lg border border-border-subtle bg-background/70 p-3">
                    <p className="text-[11px] text-text-muted">Status</p>
                    <p
                      className={`${compact ? 'text-sm' : 'text-base'} font-medium text-foreground`}
                    >
                      Invite pending
                    </p>
                  </div>
                </div>

                {!compact && (
                  <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Button
                      className="h-8 gap-1.5 bg-background/70 px-3 text-xs text-text-secondary hover:text-foreground"
                      onClick={copyWaitlistStatus}
                      size="sm"
                      variant="outline"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                      {copied ? 'Copied' : 'Copy update'}
                    </Button>
                    <Button
                      className="h-8 gap-1.5 bg-background/70 px-3 text-xs text-text-secondary hover:text-foreground"
                      onClick={shareWaitlistStatus}
                      size="sm"
                      variant="outline"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      Share
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Join button */}
              <div className={compact ? 'mb-3' : 'mb-6'}>
                <Button
                  className={`text-background hover:opacity-90 font-medium ${compact ? 'text-xs w-full' : 'w-full'}`}
                  disabled={isFormDisabled}
                  style={{
                    background: 'var(--foreground)',
                    borderRadius: compact ? '10px' : '14px',
                    padding: compact ? '8px 12px' : '12px 20px',
                    height: compact ? '36px' : '44px',
                  }}
                  onClick={joinWaitlist}
                  type="button"
                >
                  {waitlistSubmission.isPending ? (
                    'Joining...'
                  ) : (
                    <>
                      <GithubIcon
                        className={`${compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1'} text-background`}
                      />{' '}
                      {compact ? 'Join' : 'Join Waitlist'}
                    </>
                  )}
                </Button>
              </div>

              {/* Social proof */}
              <div
                className={`flex items-center ${compact ? 'gap-2' : 'gap-3'}`}
              >
                <div className="-space-x-2 flex">
                  <div
                    className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/nizzy.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                  <div
                    className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/brandon.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                  <div
                    className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/adam.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                  <div
                    className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full border-2 border-background overflow-hidden`}
                  >
                    <Image
                      alt="waitlist"
                      height={compact ? 20 : 28}
                      src="/ryan.jpg"
                      width={compact ? 20 : 28}
                    />
                  </div>
                </div>
                <span
                  className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted`}
                >
                  <NumberFlow value={waitlistCount} />+ on the list
                </span>
              </div>
            </>
          )}

          {/* Footer note */}
          <p
            className={`${compact ? 'text-[10px] mt-4' : 'text-xs mt-8'} text-text-muted`}
          >
            No spam, unsubscribe anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

interface WaitlistDemoProps {
  compact?: boolean;
}

export function WaitlistDemo({ compact = false }: WaitlistDemoProps) {
  return (
    <MockBrowser
      initialUrl="bounty.new/waitlist"
      headlights
      compact={compact}
      className={compact ? 'h-[340px]' : undefined}
    >
      <MockBrowser.Toolbar />
      <div className="flex-1 relative overflow-hidden">
        <MockBrowser.Page url="bounty.new/waitlist">
          <WaitlistPage compact={compact} />
        </MockBrowser.Page>
      </div>
    </MockBrowser>
  );
}
