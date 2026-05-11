'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import NumberFlow from '@bounty/ui/components/number-flow';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { CheckCircle2, Clock3, Mail } from 'lucide-react';
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
  const queryClient = useQueryClient();
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
      queryClient.invalidateQueries({
        queryKey: trpc.earlyAccess.getWaitlistCount.queryKey(),
      });

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

interface WaitlistSuccessStateProps {
  compact: boolean;
  waitlistCount?: number;
  isCountLoading: boolean;
  isCountError: boolean;
}

function WaitlistSuccessState({
  compact,
  waitlistCount,
  isCountLoading,
  isCountError,
}: WaitlistSuccessStateProps) {
  const hasWaitlistCount = typeof waitlistCount === 'number';
  const queueLabel = hasWaitlistCount
    ? `${waitlistCount.toLocaleString()} builders queued`
    : isCountLoading
      ? 'Syncing queue'
      : isCountError
        ? 'Queue unavailable'
        : 'Queue open';

  return (
    <div className={`text-left ${compact ? 'py-1' : 'py-3'}`}>
      <div className={compact ? 'mb-4' : 'mb-6'}>
        <div
          className={`inline-flex items-center gap-2 ${compact ? 'mb-3' : 'mb-4'}`}
        >
          <span
            className={`inline-flex items-center justify-center ${compact ? 'h-6 w-6' : 'h-8 w-8'} rounded-full bg-foreground text-background`}
          >
            <CheckCircle2 className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </span>
          <span
            className={`${compact ? 'text-[10px]' : 'text-xs'} font-medium uppercase tracking-[0.14em] text-text-muted`}
          >
            Request received
          </span>
        </div>
        <h2
          className={`${compact ? 'text-base' : 'text-xl'} font-medium tracking-tight text-foreground`}
        >
          You're on the early access list
        </h2>
        <p
          className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} text-text-secondary leading-relaxed`}
        >
          We'll send your invite as soon as your account is ready.
        </p>
      </div>

      <div
        className={`divide-y divide-border-subtle rounded-xl border border-border-subtle bg-surface-1 ${compact ? 'text-[11px]' : 'text-sm'}`}
      >
        <div
          className={`flex items-center justify-between gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        >
          <span className="flex items-center gap-2 text-text-muted">
            <Clock3 className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            Queue
          </span>
          <span className="font-medium text-foreground">
            {hasWaitlistCount ? (
              <>
                <NumberFlow value={waitlistCount} /> builders
              </>
            ) : (
              queueLabel
            )}
          </span>
        </div>
        <div
          className={`flex items-center justify-between gap-3 ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
        >
          <span className="flex items-center gap-2 text-text-muted">
            <Mail className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            Next
          </span>
          <span className="font-medium text-foreground">Invite email</span>
        </div>
      </div>
    </div>
  );
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
            <WaitlistSuccessState
              compact={compact}
              isCountError={waitlistCountQuery.isError}
              isCountLoading={waitlistCountQuery.isLoading}
              waitlistCount={waitlistCount}
            />
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
                <div className="flex [&>*+*]:-ml-2">
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
                  {typeof waitlistCount === 'number' ? (
                    <>
                      <NumberFlow value={waitlistCount} />+ on the list
                    </>
                  ) : waitlistCountQuery.isLoading ? (
                    'Loading waitlist'
                  ) : (
                    'Join the early access list'
                  )}
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
