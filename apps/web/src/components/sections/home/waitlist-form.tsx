'use client';

import { Button } from '@bounty/ui/components/button';
import { Input } from '@bounty/ui/components/input';
import NumberFlow from '@bounty/ui/components/number-flow';
import type { thumbmarkResponse } from '@bounty/ui/lib/fingerprint-validation';
import { cn } from '@bounty/ui/lib/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getThumbmark } from '@thumbmarkjs/thumbmarkjs';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useConfetti } from '@/context/confetti-context';
import type {
  RateLimitInfo,
  WaitlistCookieData,
  WaitlistCount,
  WaitlistHookResult,
  WaitlistSubmissionData,
} from '@/types/waitlist';
import { trpc } from '@/utils/trpc';

const formSchema = z.object({
  email: z.string().email(),
});

type FormSchema = z.infer<typeof formSchema>;

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

function useWaitlistSubmission(): WaitlistHookResult {
  const queryClient = useQueryClient();
  const { celebrate } = useConfetti();
  const [success, setSuccess] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ email, fingerprintData }: WaitlistSubmissionData) => {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, fingerprintData }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waitlist');
      }

      return data;
    },
    onSuccess: (data, variables) => {
      setSuccess(true);
      setRateLimitInfo({
        remaining: data.remaining,
        limit: data.limit,
      });

      const cookieData: WaitlistCookieData = {
        submitted: true,
        timestamp: new Date().toISOString(),
        email: btoa(variables.email).substring(0, 16),
      };
      writeStoredWaitlist(cookieData);

      celebrate();

      if (data.warning) {
        toast.warning(`${data.message} - ${data.warning}`);
      } else {
        toast.success('Successfully added to waitlist! 🎉');
      }

      // Update waitlist count optimistically only if no database error
      if (!data.warning) {
        queryClient.setQueryData(
          trpc.earlyAccess.getWaitlistCount.queryKey(),
          (oldData: WaitlistCount | undefined) => ({
            count: (oldData?.count ?? 0) + 1,
          })
        );
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('Rate limit exceeded')) {
        toast.error(
          "You've reached the limit of 3 attempts per hour. Please try again later."
        );
      } else if (error.message.includes('Invalid device fingerprint')) {
        toast.error(
          'Security validation failed. Please refresh the page and try again.'
        );
      } else {
        toast.error(error.message || 'Something went wrong. Please try again.');
      }
    },
  });

  return { mutate, isPending, success, setSuccess, rateLimitInfo };
}

function useWaitlistCount() {
  const query = useQuery({
    ...trpc.earlyAccess.getWaitlistCount.queryOptions(),
    retry: 2,
    retryDelay: 1000,
  });

  return {
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
  };
}

interface WaitlistFormProps {
  className?: string;
}

export function WaitlistForm({ className }: WaitlistFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  const [waitlistParam] = useQueryState('waitlist', parseAsBoolean);
  const [fingerprintData, setFingerprintData] =
    useState<thumbmarkResponse | null>(null);
  const [fingerprintLoading, setFingerprintLoading] = useState(true);
  const [isAttentionActive, setIsAttentionActive] = useState(false);
  const [, setFingerprintError] = useState<string | null>(null);

  const highlightWaitlist = waitlistParam === true;
  const waitlistSubmission = useWaitlistSubmission();
  const waitlistCount = useWaitlistCount();

  // Destructure stable setter to avoid unnecessary re-runs
  const { setSuccess } = waitlistSubmission;
  useEffect(() => {
    const stored = readStoredWaitlist();
    if (stored?.submitted) {
      waitlistSubmission.setSuccess(true);
    }
  }, [setSuccess]);

  useEffect(() => {
    // Generate device fingerprint when component mounts
    const generateFingerprint = async () => {
      try {
        setFingerprintLoading(true);
        setFingerprintError(null);
        const result = await getThumbmark();
        setFingerprintData(result);
      } catch {
        setFingerprintError(
          'Unable to generate device fingerprint. Please refresh and try again.'
        );
        toast.error(
          'Device fingerprinting failed. Please refresh the page and try again.'
        );
      } finally {
        setFingerprintLoading(false);
      }
    };

    generateFingerprint();
  }, []);

  useEffect(() => {
    setIsAttentionActive(highlightWaitlist && !waitlistSubmission.success);
  }, [highlightWaitlist, waitlistSubmission.success]);

  function joinWaitlist({ email }: FormSchema) {
    if (!fingerprintData) {
      toast.error(
        'Device fingerprint not ready. Please wait a moment and try again.'
      );
      return;
    }

    waitlistSubmission.mutate({ email, fingerprintData });
  }

  const isFormDisabled =
    waitlistSubmission.isPending || fingerprintLoading || !fingerprintData;

  let waitlistStatus: ReactNode;
  if (waitlistCount.isError) {
    waitlistStatus = (
      <span className="font-display-book font-medium text-orange-400">
        Unable to load waitlist count
      </span>
    );
  } else if (waitlistCount.isLoading) {
    waitlistStatus = (
      <span className="font-display-book font-medium text-gray-400">
        Loading waitlist count...
      </span>
    );
  } else {
    waitlistStatus = (
      <span className="font-display-book font-medium text-green-400">
        <NumberFlow value={waitlistCount.count} />+ people already joined
      </span>
    );
  }

  return (
    <div className={cn('max-w-4xl', className)}>
      {waitlistSubmission.success ? (
        <div className="flex flex-col gap-4">
          <p
            className="font-display-book font-semibold text-xl"
            style={{ color: 'rgba(239, 239, 239, 1)' }}
          >
            You&apos;re on the waitlist!
          </p>
          <p
            className="mb-4 max-w-2xl font-display-book text-base leading-relaxed"
            style={{ color: 'rgba(146, 146, 146, 1)' }}
          >
            We&apos;ll let you know when we&apos;re ready to show you what
            we&apos;ve been working on.
          </p>
        </div>
      ) : (
        <div
          className={cn(
            'relative w-full max-w-lg transition-transform duration-700',
            isAttentionActive && 'waitlist-attention'
          )}
        >
          <form
            className={cn(
              'mb-8 flex max-w-md gap-3',
              isAttentionActive && 'waitlist-wiggle waitlist-pulse'
            )}
            onSubmit={handleSubmit(joinWaitlist)}
          >
            <div className="flex-1">
              <Input
                className="flex-1 border-0 font-display-book text-white placeholder:text-gray-400"
                placeholder="grim@0.email"
                style={{
                  background: 'rgba(40, 40, 40, 1)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  height: '44px',
                }}
                type="email"
                {...register('email')}
                disabled={isFormDisabled}
              />
              {errors.email && (
                <p className="mt-1 font-display-book text-destructive text-sm">
                  {errors.email.message}
                </p>
              )}
            </div>
            <Button
              className="font-display-book text-black hover:bg-gray-100"
              disabled={isFormDisabled}
              style={{
                background: 'rgba(255, 255, 255, 1)',
                borderRadius: '14px',
                padding: '12px 16px',
                height: '44px',
                width: '122px',
              }}
              type="submit"
            >
              {waitlistSubmission.isPending ? (
                'Joining...'
              ) : (
                <>
                  Join Waitlist <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      <div className="mb-20 flex items-center gap-3">
        <div className="-space-x-2 flex">
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-black bg-orange-500 font-display-book">
            <Image alt="waitlist" height={32} src="/nizzy.jpg" width={32} />
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-black bg-blue-500 font-display-book">
            <Image alt="waitlist" height={32} src="/brandon.jpg" width={32} />
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-black bg-blue-500 font-display-book">
            <Image alt="waitlist" height={32} src="/adam.jpg" width={32} />
          </div>
          <div className="h-8 w-8 overflow-hidden rounded-full border-2 border-black bg-green-500 font-display-book">
            <Image alt="waitlist" height={32} src="/ryan.jpg" width={32} />
          </div>
        </div>
        {waitlistStatus}
      </div>
    </div>
  );
}
