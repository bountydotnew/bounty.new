'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import NumberFlow from '@bounty/ui/components/number-flow';
import { useMutation, useQuery } from '@tanstack/react-query';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { Check, Clock3, Github, Mail, Sparkles } from 'lucide-react';
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
  const waitlistPosition = waitlistCount > 0 ? waitlistCount : 1;
  const successSteps = [
    {
      icon: Github,
      label: 'GitHub connected',
      value: 'Verified',
    },
    {
      icon: Mail,
      label: 'Invite email',
      value: 'Queued',
    },
    ...(compact
      ? []
      : [
          {
            icon: Clock3,
            label: 'Access window',
            value: 'Next batch',
          },
        ]),
  ];

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
              className={`waitlist-pulse text-left rounded-[22px] border border-border-subtle bg-surface-1/95 shadow-[0_18px_50px_rgba(0,0,0,0.08)] ${compact ? 'space-y-2.5 p-2.5' : 'space-y-5 p-5'}`}
            >
              <div
                className={`flex items-start ${compact ? 'gap-2.5' : 'gap-3.5'}`}
              >
                <div
                  className={`shrink-0 rounded-full border border-brand-accent/25 bg-brand-accent/10 text-brand-accent shadow-[0_0_0_6px_rgba(34,197,94,0.06)] ${compact ? 'p-1.5' : 'p-2.5'}`}
                >
                  <Check
                    aria-hidden="true"
                    className={compact ? 'h-4 w-4' : 'h-5 w-5'}
                    strokeWidth={2.5}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {!compact && (
                    <div className="mb-2 inline-flex items-center gap-1 rounded-full border border-border-subtle bg-background/80 px-2.5 py-1 text-text-muted text-xs">
                      <Sparkles aria-hidden="true" className="h-3.5 w-3.5" />
                      Invite queued
                    </div>
                  )}
                  <h2
                    className={`${compact ? 'text-base' : 'text-xl'} font-medium text-foreground tracking-tight`}
                  >
                    You're on the list
                  </h2>
                  <p
                    className={`${compact ? 'text-[11px]' : 'text-sm'} text-text-muted leading-relaxed`}
                  >
                    {compact
                      ? 'Your invite is queued.'
                      : "Your invite is queued. We'll email you when your spot opens."}
                  </p>
                </div>
              </div>

              <div
                className={`grid grid-cols-2 border-y border-border-subtle ${compact ? 'py-1.5' : 'py-3'}`}
              >
                <div className="min-w-0">
                  <p
                    className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted`}
                  >
                    Position
                  </p>
                  <p
                    className={`${compact ? 'text-lg' : 'text-2xl'} font-medium tabular-nums text-foreground`}
                  >
                    #<NumberFlow value={waitlistPosition} />
                  </p>
                </div>
                <div className="min-w-0 text-right">
                  <p
                    className={`${compact ? 'text-[10px]' : 'text-xs'} text-text-muted`}
                  >
                    Status
                  </p>
                  <p
                    className={`${compact ? 'text-sm' : 'text-base'} font-medium text-brand-accent-muted`}
                  >
                    Queued
                  </p>
                </div>
              </div>

              <div
                className={`divide-y divide-border-subtle ${compact ? 'text-[11px]' : 'text-sm'}`}
              >
                {successSteps.map((step) => (
                  <div
                    className={`flex items-center justify-between gap-3 ${compact ? 'py-1' : 'py-2'}`}
                    key={step.label}
                  >
                    <div className="flex min-w-0 items-center gap-2 text-text-muted">
                      <step.icon
                        aria-hidden="true"
                        className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'}
                      />
                      <span className="truncate">{step.label}</span>
                    </div>
                    <span className="shrink-0 font-medium text-foreground">
                      {step.value}
                    </span>
                  </div>
                ))}
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
