'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import NumberFlow from '@bounty/ui/components/number-flow';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
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
  const [copiedShareText, setCopiedShareText] = useState(false);

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
  const shareText = `I just joined the bounty.new waitlist at #${waitlistCount}. Build better bounties with me.`;

  function copyShareText() {
    if (typeof window === 'undefined' || !navigator.clipboard) {
      return;
    }

    navigator.clipboard
      .writeText(`${shareText} ${window.location.origin}`)
      .then(() => {
        setCopiedShareText(true);
        window.setTimeout(() => setCopiedShareText(false), 2000);
      })
      .catch(() => {
        toast.error('Could not copy share text.');
      });
  }

  function shareOnX() {
    if (typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams({
      text: shareText,
      url: window.location.origin,
    });
    window.open(
      `https://twitter.com/intent/tweet?${params.toString()}`,
      '_blank'
    );
  }

  return (
    <div className="h-full bg-background overflow-auto">
      <div
        className={`flex flex-col items-center justify-center h-full ${compact ? 'px-3 py-4' : 'px-6 py-10'}`}
      >
        <div className={`w-full ${compact ? 'max-w-xs' : 'max-w-sm'}`}>
          {/* Success state */}
          {waitlistSubmission.success ? (
            <div
              className={`relative overflow-hidden rounded-2xl border border-border-subtle bg-surface-1/80 text-center shadow-2xl shadow-black/20 ${compact ? 'px-4 py-6' : 'px-8 py-10'}`}
            >
              <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent" />
              <div
                className={`mx-auto flex items-center justify-center ${compact ? 'mb-3 h-10 w-10' : 'mb-5 h-14 w-14'} rounded-full bg-brand-accent/10 ring-1 ring-brand-accent/25`}
              >
                <svg
                  aria-hidden="true"
                  className={`${compact ? 'h-5 w-5' : 'h-7 w-7'} text-brand-accent`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2
                className={`${compact ? 'mb-1 text-lg' : 'mb-2 text-2xl'} font-medium tracking-tight text-foreground`}
              >
                You're on the list
              </h2>
              <p
                className={`${compact ? 'mb-4 text-xs' : 'mb-6 text-sm'} text-text-muted`}
              >
                We'll reach out when it's your turn to start creating bounties.
              </p>
              <div
                className={`mx-auto inline-flex items-center gap-2 rounded-full border border-brand-accent/20 bg-brand-accent/10 ${compact ? 'px-3 py-1.5' : 'px-4 py-2'}`}
              >
                <span className="text-xs text-text-muted">Position</span>
                <span
                  className={`${compact ? 'text-sm' : 'text-base'} font-medium text-brand-accent-muted`}
                >
                  #{waitlistCount}
                </span>
              </div>
              <div
                className={`grid grid-cols-2 gap-2 ${compact ? 'mt-4' : 'mt-6'}`}
              >
                <button
                  className={`rounded-xl border border-border-subtle bg-background/80 font-medium text-foreground transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/10 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}`}
                  onClick={shareOnX}
                  type="button"
                >
                  Share on X
                </button>
                <button
                  className={`rounded-xl border border-border-subtle bg-background/80 font-medium text-foreground transition-colors hover:border-brand-accent/40 hover:bg-brand-accent/10 ${compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm'}`}
                  onClick={copyShareText}
                  type="button"
                >
                  {copiedShareText ? 'Copied' : 'Copy text'}
                </button>
              </div>
              <p
                className={`${compact ? 'mt-4 text-[10px]' : 'mt-6 text-xs'} text-text-muted`}
              >
                No spam, unsubscribe anytime.
              </p>
            </div>
          ) : (
            <>
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

              {/* Footer note */}
              <p
                className={`${compact ? 'text-[10px] mt-4' : 'text-xs mt-8'} text-text-muted`}
              >
                No spam, unsubscribe anytime.
              </p>
            </>
          )}
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
