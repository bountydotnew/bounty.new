'use client';

import { authClient } from '@bounty/auth/client';
import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import NumberFlow from '@bounty/ui/components/number-flow';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getThumbmark } from '@thumbmarkjs/thumbmarkjs';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useConfetti } from '@/context/confetti-context';
import type {
  RateLimitInfo,
  WaitlistCookieData,
  WaitlistHookResult,
  WaitlistSubmissionData,
} from '@/types/waitlist';
import { trpc } from '@/utils/trpc';
import { MockBrowser } from './mockup';

const formSchema = z.object({
  email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

const WAITLIST_STORAGE_KEY = 'waitlist_data';

function readStoredWaitlist(): WaitlistCookieData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(WAITLIST_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WaitlistCookieData) : null;
  } catch {
    return null;
  }
}

function writeStoredWaitlist(data: WaitlistCookieData) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(WAITLIST_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage failures
  }
}

function useWaitlistSubmission(): WaitlistHookResult {
  const { celebrate } = useConfetti();
  const [success, setSuccess] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ email, fingerprintData }: WaitlistSubmissionData) => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fingerprintData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      setSuccess(true);

      const cookieData: WaitlistCookieData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: btoa(variables.email).substring(0, 16),
      };
      writeStoredWaitlist(cookieData);

      celebrate();
      toast.success("You're on the list! 🎉");
    },
    onError: (error: Error) => {
      if (error.message.includes('Must be logged in to join waitlist')) {
        authClient.signIn.social({
          provider: 'github',
          callbackURL: '/',
        });
      } else if (error.message.includes('Rate limit exceeded')) {
        toast.error('Too many attempts. Please try again later.');
      } else if (error.message.includes('Invalid device fingerprint')) {
        toast.error(
          'Security validation failed. Please refresh and try again.'
        );
      } else {
        toast.error(error.message || 'Something went wrong. Please try again.');
      }
    },
  });

  return { mutate, isPending, success, setSuccess, rateLimitInfo };
}

interface WaitlistPageProps {
  compact?: boolean;
}

function WaitlistPage({ compact = false }: WaitlistPageProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' },
  });

  type FingerprintData = Awaited<ReturnType<typeof getThumbmark>>;
  const [fingerprint, setFingerprint] = useState<{
    data: FingerprintData | null;
    loading: boolean;
  }>({ data: null, loading: true });
  const waitlistSubmission = useWaitlistSubmission();

  useEffect(() => {
    const stored = readStoredWaitlist();
    if (stored?.submitted) {
      waitlistSubmission.setSuccess(true);
    }
  }, [waitlistSubmission.setSuccess]);

  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const result = await getThumbmark();
        setFingerprint({ data: result, loading: false });
      } catch {
        toast.error(
          'Device fingerprinting failed. Please refresh and try again.'
        );
        setFingerprint({ data: null, loading: false });
      }
    };

    generateFingerprint();
  }, []);

  function joinWaitlist({ email }: FormSchema) {
    if (!fingerprint.data) {
      toast.error(
        'Device fingerprint not ready. Please wait a moment and try again.'
      );
      return;
    }
    waitlistSubmission.mutate({ email, fingerprintData: fingerprint.data });
  }

  const isFormDisabled =
    waitlistSubmission.isPending || fingerprint.loading || !fingerprint.data;

  const waitlistCountQuery = useQuery({
    ...trpc.earlyAccess.getWaitlistCount.queryOptions(),
    retry: 2,
    retryDelay: 1000,
  });
  const waitlistCount = waitlistCountQuery.data?.count ?? 0;

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
            <div className={`text-left ${compact ? 'py-2' : 'py-4'}`}>
              <div
                className={`inline-flex items-center justify-center ${compact ? 'w-8 h-8 mb-2' : 'w-12 h-12 mb-4'} rounded-full bg-brand-accent/10`}
              >
                <svg
                  className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-brand-accent`}
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
                className={`${compact ? 'text-base' : 'text-xl'} font-medium text-foreground mb-1`}
              >
                You're on the list
              </h2>
              <p
                className={`${compact ? 'text-xs mb-3' : 'text-sm mb-6'} text-text-muted`}
              >
                We'll reach out when it's your turn.
              </p>
              <div
                className={`inline-flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-full bg-surface-1 border border-border-subtle`}
              >
                <span className="text-xs text-text-muted">Position</span>
                <span
                  className={`${compact ? 'text-xs' : 'text-sm'} font-medium text-brand-accent-muted`}
                >
                  #{waitlistCount}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Form */}
              <form
                className={compact ? 'mb-3' : 'mb-6'}
                onSubmit={handleSubmit(joinWaitlist)}
              >
                <div className={`flex ${compact ? 'flex-col gap-2' : 'flex-col sm:flex-row gap-3'}`}>
                  <div className="flex-1">
                    <Input
                      className="flex-1 border border-border-default text-foreground placeholder:text-text-muted"
                      placeholder="your@email.com"
                      style={{
                        background: 'var(--surface-1)',
                        borderRadius: compact ? '10px' : '14px',
                        padding: compact ? '8px 12px' : '12px 16px',
                        height: compact ? '36px' : '44px',
                        fontSize: compact ? '13px' : undefined,
                      }}
                      type="email"
                      {...register('email')}
                      disabled={isFormDisabled}
                    />
                    {errors.email && (
                      <p className="mt-1 text-red-400 text-xs">
                        {errors.email.message}
                      </p>
                    )}
                  </div>
                  <Button
                    className={`text-background hover:opacity-90 font-medium ${compact ? 'text-xs' : 'w-full sm:w-auto'}`}
                    disabled={isFormDisabled}
                    style={{
                      background: 'var(--foreground)',
                      borderRadius: compact ? '10px' : '14px',
                      padding: compact ? '8px 12px' : '12px 20px',
                      height: compact ? '36px' : '44px',
                      minWidth: compact ? undefined : '138px',
                    }}
                    type="submit"
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
              </form>

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
