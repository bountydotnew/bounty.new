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
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useConfetti } from '@/context/confetti-context';
import { useSession } from '@/context/session-context';
import type {
  RateLimitInfo,
  WaitlistCookieData,
  WaitlistHookResult,
  WaitlistResponse,
  WaitlistSubmissionData,
} from '@/types/waitlist';
import { trpc } from '@/utils/trpc';
import { MockBrowser } from './mockup';

const formSchema = z.object({
  email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

const WAITLIST_STORAGE_KEY = 'waitlist_data';
const WAITLIST_AVATARS = [
  '/nizzy.jpg',
  '/brandon.jpg',
  '/adam.jpg',
  '/ryan.jpg',
] as const;

function getStoredWaitlistPosition(position?: number | null): number | null {
  return typeof position === 'number' && Number.isFinite(position)
    ? position
    : null;
}

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

function updateStoredWaitlistPosition(position: number) {
  const stored = readStoredWaitlist();
  if (!stored?.submitted) {
    return;
  }

  writeStoredWaitlist({
    ...stored,
    position,
  });
}

function useWaitlistSubmission(): WaitlistHookResult {
  const { celebrate } = useConfetti();
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [rateLimitInfo, _setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      email,
      fingerprintData,
    }: WaitlistSubmissionData): Promise<WaitlistResponse> => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fingerprintData }),
      });

      const data = (await response.json()) as WaitlistResponse;

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      const savedPosition = getStoredWaitlistPosition(data.position);

      setSuccess(true);
      setPosition(savedPosition);

      const cookieData: WaitlistCookieData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: btoa(variables.email).substring(0, 16),
        position: savedPosition,
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
      } else if (
        error.message.includes(
          'Use the same email as your signed-in GitHub account'
        )
      ) {
        toast.error('Use the email tied to your signed-in GitHub account.');
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

  return {
    mutate,
    isPending,
    success,
    position,
    setSuccess,
    setPosition,
    rateLimitInfo,
  };
}

function WaitlistAvatarStack({
  compact = false,
  className = '',
}: {
  compact?: boolean;
  className?: string;
}) {
  const avatarSize = compact ? 20 : 28;

  return (
    <div aria-hidden="true" className={`-space-x-2 flex ${className}`}>
      {WAITLIST_AVATARS.map((src) => (
        <div
          key={src}
          className={`${compact ? 'w-5 h-5' : 'w-7 h-7'} rounded-full border-2 border-background overflow-hidden`}
        >
          <Image alt="" height={avatarSize} src={src} width={avatarSize} />
        </div>
      ))}
    </div>
  );
}

function WaitlistSuccessState({
  compact = false,
  queuePosition,
  waitlistCount,
}: {
  compact?: boolean;
  queuePosition: number | null;
  waitlistCount: number;
}) {
  const hasQueuePosition =
    typeof queuePosition === 'number' && Number.isFinite(queuePosition);

  return (
    <div
      className={`${compact ? 'mt-2 rounded-[18px] p-3' : 'mt-3 rounded-[26px] p-4'} border border-border-default text-left`}
      style={{
        background:
          'radial-gradient(circle at top left, rgba(94,106,211,0.16), transparent 42%), linear-gradient(180deg, var(--surface-2), var(--surface-1))',
      }}
    >
      <div
        className={`inline-flex items-center gap-2 ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-[11px]'} rounded-full border border-border-subtle bg-background/70 font-medium uppercase tracking-[0.18em] text-text-muted`}
      >
        <span className="h-2 w-2 rounded-full bg-brand-accent" />
        Access requested
      </div>

      <div className={compact ? 'mt-3' : 'mt-4'}>
        <h2
          className={`${compact ? 'text-base' : 'text-[22px]'} font-medium tracking-tight text-foreground`}
        >
          You're officially in line
        </h2>
        <p
          className={`${compact ? 'mt-1 text-xs' : 'mt-2 text-sm'} max-w-[28ch] leading-relaxed text-text-muted`}
        >
          We saved your place. Watch your inbox for the invite when the next
          batch opens up.
        </p>
      </div>

      <div
        className={
          compact
            ? 'mt-3 flex flex-col gap-2'
            : `mt-4 grid ${hasQueuePosition ? 'grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]' : 'grid-cols-1'} gap-3`
        }
      >
        {hasQueuePosition && (
          <div
            className={`${compact ? 'rounded-2xl p-3' : 'rounded-[22px] p-4'} border border-border-subtle bg-surface-1/80`}
          >
            <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
              Queue position
            </span>
            <div
              className={`${compact ? 'mt-2' : 'mt-3'} flex items-end gap-2`}
            >
              <span
                className={`${compact ? 'text-3xl' : 'text-4xl'} leading-none font-medium tracking-tight text-foreground`}
              >
                <span className="mr-1 text-text-tertiary">#</span>
                <NumberFlow value={queuePosition} />
              </span>
            </div>
            <p
              className={`${compact ? 'mt-2 text-[11px]' : 'mt-3 text-xs'} leading-relaxed text-text-muted`}
            >
              This is the place we saved for your invite in the current queue.
            </p>
          </div>
        )}

        <div
          className={`${compact ? 'rounded-2xl p-3' : 'rounded-[22px] p-4'} border border-border-subtle bg-background/70`}
        >
          <span className="text-[11px] uppercase tracking-[0.18em] text-text-muted">
            What happens next
          </span>
          <p
            className={`${compact ? 'mt-2 text-[11px]' : 'mt-3 text-xs'} leading-relaxed text-text-muted`}
          >
            We will email you as soon as your invite is ready. No extra steps,
            no form resubmits.
          </p>
          <div
            className={`${compact ? 'mt-3' : 'mt-4'} flex items-center justify-between gap-3`}
          >
            <WaitlistAvatarStack compact={compact} />
            <span
              className={`${compact ? 'text-[11px]' : 'text-xs'} text-right text-text-muted`}
            >
              <NumberFlow value={waitlistCount} />+ builders queued
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface WaitlistPageProps {
  compact?: boolean;
}

function WaitlistPage({ compact = false }: WaitlistPageProps) {
  const pathname = usePathname();
  const { session } = useSession();
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
  const [needsPositionRecovery, setNeedsPositionRecovery] = useState(false);

  useEffect(() => {
    if (!pathname) {
      return;
    }

    const stored = readStoredWaitlist();
    if (stored?.submitted) {
      waitlistSubmission.setSuccess(true);
      const storedPosition = getStoredWaitlistPosition(stored.position);
      waitlistSubmission.setPosition(storedPosition);
      setNeedsPositionRecovery(storedPosition === null);
    }
  }, [pathname, waitlistSubmission.setPosition, waitlistSubmission.setSuccess]);

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

  const storedWaitlistEntryQuery = useQuery({
    ...trpc.earlyAccess.getMyWaitlistEntry.queryOptions(),
    enabled: needsPositionRecovery && !!session?.user,
    retry: 1,
  });

  useEffect(() => {
    if (!needsPositionRecovery) {
      return;
    }

    const recoveredPosition = getStoredWaitlistPosition(
      storedWaitlistEntryQuery.data?.position
    );

    if (recoveredPosition !== null) {
      waitlistSubmission.setPosition(recoveredPosition);
      updateStoredWaitlistPosition(recoveredPosition);
      setNeedsPositionRecovery(false);
      return;
    }

    if (
      storedWaitlistEntryQuery.isSuccess ||
      storedWaitlistEntryQuery.isError
    ) {
      setNeedsPositionRecovery(false);
    }
  }, [
    needsPositionRecovery,
    storedWaitlistEntryQuery.data?.position,
    storedWaitlistEntryQuery.isError,
    storedWaitlistEntryQuery.isSuccess,
    waitlistSubmission.setPosition,
  ]);

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
              {waitlistSubmission.success
                ? 'Access requested'
                : 'Get early access'}
            </h1>
            <p
              className={`${compact ? 'text-xs' : 'text-sm'} text-text-muted leading-relaxed`}
            >
              {waitlistSubmission.success
                ? compact
                  ? 'Your spot is saved.'
                  : 'Your spot is saved. We will reach out when your invite is ready.'
                : compact
                  ? 'Join the waitlist to get started.'
                  : 'Join the waitlist to start creating bounties and getting paid to build.'}
            </p>
          </div>

          {/* Success state */}
          {waitlistSubmission.success ? (
            <WaitlistSuccessState
              compact={compact}
              queuePosition={waitlistSubmission.position}
              waitlistCount={waitlistCount}
            />
          ) : (
            <>
              {/* Form */}
              <form
                className={compact ? 'mb-3' : 'mb-6'}
                onSubmit={handleSubmit(joinWaitlist)}
              >
                <div
                  className={`flex ${compact ? 'flex-col gap-2' : 'flex-col sm:flex-row gap-3'}`}
                >
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
                <WaitlistAvatarStack compact={compact} />
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
