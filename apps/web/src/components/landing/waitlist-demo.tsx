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

type StoredWaitlistData = WaitlistCookieData & {
  position?: number | null;
};

function normalizeWaitlistPosition(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function readStoredWaitlist(): StoredWaitlistData | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as StoredWaitlistData;
    return {
      ...parsed,
      position: normalizeWaitlistPosition(parsed.position),
    };
  } catch {
    return null;
  }
}

function writeStoredWaitlist(data: StoredWaitlistData) {
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
  const [position, setPosition] = useState<number | null>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: () => trpcClient.earlyAccess.joinWaitlist.mutate(),
    onSuccess: (data) => {
      const nextPosition =
        'position' in data ? normalizeWaitlistPosition(data.position) : null;
      setSuccess(true);
      setPosition(nextPosition);

      const cookieData: StoredWaitlistData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: '',
        position: nextPosition,
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

  return { mutate, isPending, position, setPosition, success, setSuccess };
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
      waitlistSubmission.setPosition(stored.position ?? null);
    }
  });

  function joinWaitlist() {
    waitlistSubmission.mutate();
  }

  const isFormDisabled = waitlistSubmission.isPending;

  const waitlistCountQuery = useQuery({
    ...trpc.earlyAccess.getWaitlistCount.queryOptions(),
    enabled: !waitlistSubmission.success,
    retry: 2,
    retryDelay: 1000,
  });
  const waitlistCount =
    typeof waitlistCountQuery.data?.count === 'number'
      ? waitlistCountQuery.data.count
      : null;
  const position = waitlistSubmission.position;

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
            <div className={`text-left ${compact ? 'py-1' : 'py-2'}`}>
              <div
                className={`rounded-[18px] border border-border-subtle bg-surface-1/70 ${compact ? 'p-3' : 'p-5'} shadow-[0_18px_60px_rgba(0,0,0,0.16)]`}
              >
                <div className="mb-3 flex items-center gap-2">
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-full bg-brand-accent/15 ${compact ? 'size-7' : 'size-9'}`}
                  >
                    <svg
                      aria-hidden="true"
                      className={`${compact ? 'size-3.5' : 'size-4.5'} text-brand-accent`}
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
                  <span
                    className={`rounded-full border border-brand-accent/20 bg-brand-accent/10 font-medium text-brand-accent ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
                  >
                    Confirmed
                  </span>
                </div>

                <h2
                  className={`${compact ? 'mb-1 text-base' : 'mb-2 text-xl'} font-medium text-foreground`}
                >
                  You're on the list
                </h2>
                <p
                  className={`${compact ? 'mb-3 text-xs' : 'mb-5 text-sm'} text-text-muted leading-relaxed`}
                >
                  Your spot is saved. We'll email you when early access opens.
                </p>

                <div
                  className={`grid grid-cols-2 overflow-hidden rounded-xl border border-border-subtle bg-background/70 ${compact ? 'text-xs' : 'text-sm'}`}
                >
                  <div className={`${compact ? 'p-2.5' : 'p-3.5'}`}>
                    <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-text-muted">
                      Position
                    </div>
                    <div
                      className={`${compact ? 'text-base' : 'text-lg'} font-medium text-foreground`}
                    >
                      {position === null ? (
                        'Reserved'
                      ) : (
                        <>
                          #<NumberFlow value={position} />
                        </>
                      )}
                    </div>
                  </div>
                  <div
                    className={`border-l border-border-subtle ${compact ? 'p-2.5' : 'p-3.5'}`}
                  >
                    <div className="mb-1 text-[10px] uppercase tracking-[0.12em] text-text-muted">
                      Status
                    </div>
                    <div
                      className={`${compact ? 'text-base' : 'text-lg'} font-medium text-foreground`}
                    >
                      Invite pending
                    </div>
                  </div>
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
                  {waitlistCount === null ? (
                    'Builders are joining'
                  ) : (
                    <>
                      <NumberFlow value={waitlistCount} />+ on the list
                    </>
                  )}
                </span>
              </div>
            </>
          )}

          {!waitlistSubmission.success && (
            <p
              className={`${compact ? 'text-[10px] mt-4' : 'text-xs mt-8'} text-text-muted`}
            >
              No spam, unsubscribe anytime.
            </p>
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
