'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import NumberFlow from '@bounty/ui/components/number-flow';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { Check } from 'lucide-react';
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

function readStoredWaitlist(): StoredWaitlistData | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredWaitlistData) : null;
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
    onSuccess: (result) => {
      const waitlistPosition =
        'position' in result &&
        typeof result.position === 'number' &&
        result.position > 0
          ? result.position
          : null;

      setSuccess(true);
      setPosition(waitlistPosition);

      const cookieData: StoredWaitlistData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: '',
        position: waitlistPosition,
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

  return { mutate, isPending, success, setSuccess, position, setPosition };
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
      if (typeof stored.position === 'number' && stored.position > 0) {
        waitlistSubmission.setPosition(stored.position);
      }
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
  const hasPosition =
    typeof waitlistSubmission.position === 'number' &&
    waitlistSubmission.position > 0;

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
                className={`overflow-hidden rounded-lg border border-border-subtle bg-surface-1 ${compact ? 'p-3' : 'p-4'}`}
              >
                <div
                  className={`flex items-start ${compact ? 'gap-2.5' : 'gap-3'}`}
                >
                  <div
                    className={`flex shrink-0 items-center justify-center rounded-full bg-brand-accent/10 ${compact ? 'size-8' : 'size-10'}`}
                  >
                    <Check
                      className={`${compact ? 'size-4' : 'size-5'} text-brand-accent`}
                      strokeWidth={2.5}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span
                      className={`${compact ? 'text-[11px]' : 'text-xs'} font-medium text-brand-accent-muted`}
                    >
                      Confirmed
                    </span>
                    <h2
                      className={`${compact ? 'text-base' : 'text-xl'} font-medium text-foreground leading-tight`}
                    >
                      You're on the list
                    </h2>
                    <p
                      className={`${compact ? 'mt-1 text-xs' : 'mt-1.5 text-sm'} text-text-muted leading-relaxed`}
                    >
                      We'll reach out as early access opens.
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-4 grid grid-cols-2 border-y border-border-subtle ${compact ? 'py-2.5' : 'py-3'}`}
                >
                  <div>
                    <span className="block text-xs text-text-muted">
                      {hasPosition ? 'Your spot' : 'Status'}
                    </span>
                    <span
                      className={`${compact ? 'text-sm' : 'text-lg'} font-medium text-foreground`}
                    >
                      {hasPosition
                        ? `#${waitlistSubmission.position}`
                        : 'Joined'}
                    </span>
                  </div>
                  <div className="border-l border-border-subtle pl-3">
                    <span className="block text-xs text-text-muted">
                      On the list
                    </span>
                    <span
                      className={`${compact ? 'text-sm' : 'text-lg'} font-medium text-foreground`}
                    >
                      <NumberFlow value={waitlistCount} />+
                    </span>
                  </div>
                </div>

                <div
                  className={`flex items-center justify-between ${compact ? 'pt-3' : 'pt-4'}`}
                >
                  {['Joined', 'Reviewing', 'Invite'].map((label, index) => (
                    <div
                      className="flex min-w-0 flex-1 items-center last:flex-none"
                      key={label}
                    >
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={`size-2 shrink-0 rounded-full ${
                            index === 0
                              ? 'bg-brand-accent'
                              : 'bg-border-default'
                          }`}
                        />
                        {!compact && (
                          <span
                            className={`text-xs ${
                              index === 0
                                ? 'text-foreground'
                                : 'text-text-muted'
                            }`}
                          >
                            {label}
                          </span>
                        )}
                      </div>
                      {index < 2 && (
                        <span className="mx-2 h-px flex-1 bg-border-subtle" />
                      )}
                    </div>
                  ))}
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
