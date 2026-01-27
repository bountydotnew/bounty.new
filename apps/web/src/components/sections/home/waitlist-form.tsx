'use client';

import { Button } from '@bounty/ui/components/button';
import NumberFlow from '@bounty/ui/components/number-flow';
import { cn } from '@bounty/ui/lib/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useQueryState, parseAsBoolean } from 'nuqs';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useConfetti } from '@/context/confetti-context';
import { useSession } from '@/context/session-context';
import type { WaitlistCount } from '@/types/waitlist';
import { trpc, trpcClient } from '@/utils/trpc';

const WAITLIST_STORAGE_KEY = 'waitlist_data';

interface WaitlistCookieData {
  submitted: boolean;
  timestamp: string;
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
  const { celebrate } = useConfetti();
  const queryClient = useQueryClient();
  const { isAuthenticated, isPending: authPending } = useSession();
  const [waitlistParam] = useQueryState('waitlist', parseAsBoolean);
  const [success, setSuccess] = useState(false);
  const [isAttentionActive, setIsAttentionActive] = useState(false);

  const highlightWaitlist = waitlistParam === true;
  const waitlistCount = useWaitlistCount();

  // Check local storage for existing submission
  useEffect(() => {
    const stored = readStoredWaitlist();
    if (stored?.submitted) {
      setSuccess(true);
    }
  }, []);

  useEffect(() => {
    setIsAttentionActive(highlightWaitlist && !success);
  }, [highlightWaitlist, success]);

  // Mutation to join waitlist (authenticated)
  const { mutate: joinWaitlist, isPending } = useMutation({
    mutationFn: async () => {
      // Use the protected procedure which handles auth and creates the entry
      const result = await trpcClient.earlyAccess.getMyWaitlistEntry.query();

      return result;
    },
    onSuccess: () => {
      setSuccess(true);
      const cookieData: WaitlistCookieData = {
        submitted: true,
        timestamp: new Date().toISOString(),
      };
      writeStoredWaitlist(cookieData);

      celebrate();
      toast.success("You're on the waitlist! 🎉");

      // Update waitlist count optimistically
      queryClient.setQueryData(
        trpc.earlyAccess.getWaitlistCount.queryKey(),
        (oldData: WaitlistCount | undefined) => ({
          count: (oldData?.count ?? 0) + 1,
        })
      );
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to join waitlist');
    },
  });

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
        <NumberFlow value={waitlistCount.count} />+ people are already on the
        waitlist
      </span>
    );
  }

  // Still loading auth
  if (authPending) {
    return (
      <div className={cn('max-w-4xl', className)}>
        <div className="mb-8 flex max-w-md gap-3">
          <Button
            className="font-display-book text-black hover:bg-gray-100"
            disabled
            style={{
              background: 'rgba(255, 255, 255, 1)',
              borderRadius: '14px',
              padding: '12px 16px',
              height: '44px',
            }}
          >
            Loading...
          </Button>
        </div>

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

  return (
    <div className={cn('max-w-4xl', className)}>
      {success ? (
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
      ) : !isAuthenticated ? (
        <div
          className={cn(
            'relative w-full max-w-lg transition-transform duration-700',
            isAttentionActive && 'waitlist-attention'
          )}
        >
          <div
            className={cn(
              'mb-8 flex max-w-md gap-3',
              isAttentionActive && 'waitlist-wiggle waitlist-pulse'
            )}
          >
            <Button
              asChild
              className="font-display-book text-black hover:bg-gray-100"
              style={{
                background: 'rgba(255, 255, 255, 1)',
                borderRadius: '14px',
                padding: '12px 16px',
                height: '44px',
              }}
            >
              <a href="/login?callbackUrl=/">
                Sign in to join waitlist <ChevronRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'relative w-full max-w-lg transition-transform duration-700',
            isAttentionActive && 'waitlist-attention'
          )}
        >
          <div
            className={cn(
              'mb-8 flex max-w-md gap-3',
              isAttentionActive && 'waitlist-wiggle waitlist-pulse'
            )}
          >
            <Button
              onClick={() => joinWaitlist()}
              className="font-display-book text-black hover:bg-gray-100"
              disabled={isPending}
              style={{
                background: 'rgba(255, 255, 255, 1)',
                borderRadius: '14px',
                padding: '12px 16px',
                height: '44px',
              }}
            >
              {isPending ? (
                'Joining...'
              ) : (
                <>
                  Join Waitlist <ChevronRight className="h-5 w-5" />
                </>
              )}
            </Button>
          </div>
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
