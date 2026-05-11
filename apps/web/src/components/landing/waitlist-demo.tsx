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

function WaitlistCount({
  count,
  isLoading = false,
  unavailableLabel = 'Count unavailable',
}: {
  count: number | undefined;
  isLoading?: boolean;
  unavailableLabel?: string;
}) {
  if (isLoading) {
    return <span>Loading count</span>;
  }

  if (typeof count !== 'number') {
    return <span>{unavailableLabel}</span>;
  }

  if (count === 0) {
    return <span>No public count yet</span>;
  }

  return (
    <span>
      <NumberFlow value={count} />+ on the list
    </span>
  );
}

interface WaitlistPageProps {
  compact?: boolean;
}

function WaitlistPage({ compact = false }: WaitlistPageProps) {
  const waitlistSubmission = useWaitlistSubmission();

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
  const waitlistCount = waitlistCountQuery.data?.count;

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
              className={`rounded-[18px] border border-border-subtle bg-surface-1/80 shadow-[0_18px_60px_rgba(0,0,0,0.22)] ${compact ? 'p-3' : 'p-5'}`}
            >
              <div
                className={`flex items-center ${compact ? 'gap-2 mb-3' : 'gap-3 mb-5'}`}
              >
                <div
                  className={`flex shrink-0 items-center justify-center rounded-full bg-brand-accent text-background shadow-[0_0_0_6px_rgba(255,255,255,0.04)] ${compact ? 'size-8' : 'size-11'}`}
                >
                  <svg
                    aria-hidden="true"
                    className={compact ? 'size-4' : 'size-5'}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      d="M5 12.5l4.2 4L19 7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.4}
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p
                    className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium uppercase tracking-[0.16em] text-brand-accent-muted`}
                  >
                    Request saved
                  </p>
                  <h2
                    className={`${compact ? 'text-base' : 'text-xl'} font-medium leading-tight text-foreground`}
                  >
                    You're on the list
                  </h2>
                </div>
              </div>

              <p
                className={`${compact ? 'text-xs mb-3' : 'text-sm mb-5'} leading-relaxed text-text-muted`}
              >
                We'll email you as soon as a spot opens.
              </p>

              <div className="divide-y divide-border-subtle rounded-xl border border-border-subtle bg-background/45">
                <div
                  className={`flex items-center justify-between gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                >
                  <span
                    className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted`}
                  >
                    Waitlist size
                  </span>
                  <span
                    className={`${compact ? 'text-[10px]' : 'text-xs'} text-right font-medium text-foreground`}
                  >
                    <WaitlistCount
                      count={waitlistCount}
                      isLoading={waitlistCountQuery.isPending}
                    />
                  </span>
                </div>
                <div
                  className={`flex items-center justify-between gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                >
                  <span
                    className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted`}
                  >
                    Status
                  </span>
                  <span
                    className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium text-brand-accent-muted`}
                  >
                    Invite pending
                  </span>
                </div>
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
                  <WaitlistCount
                    count={waitlistCount}
                    isLoading={waitlistCountQuery.isPending}
                    unavailableLabel="Join the early list"
                  />
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
