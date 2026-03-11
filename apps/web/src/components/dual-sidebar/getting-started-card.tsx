'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@bounty/ui/lib/utils';
import { useActiveOrg } from '@/hooks/use-active-org';
import { useSession } from '@/context/session-context';
import { useTour } from '@bounty/ui/components/tour';
import { trpc } from '@/utils/trpc';

// ---------------------------------------------------------------------------
// SVG Icons from Paper design
// ---------------------------------------------------------------------------

function CompletedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-3.5 shrink-0"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8.5 1.333C4.818 1.333 1.833 4.318 1.833 8C1.833 11.682 4.818 14.667 8.5 14.667C12.182 14.667 15.166 11.682 15.166 8C15.166 4.318 12.182 1.333 8.5 1.333ZM10.887 6.65C11.062 6.436 11.03 6.121 10.816 5.946C10.603 5.771 10.288 5.803 10.113 6.017L7.463 9.256L6.52 8.313C6.325 8.118 6.008 8.118 5.813 8.313C5.618 8.508 5.618 8.825 5.813 9.02L7.146 10.354C7.246 10.453 7.383 10.506 7.525 10.499C7.666 10.492 7.797 10.426 7.887 10.316L10.887 6.65Z"
        fill="#4A6FDC"
      />
    </svg>
  );
}

function IncompleteIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-3.5 shrink-0"
    >
      <circle
        cx="8"
        cy="8"
        r="7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 4"
      />
    </svg>
  );
}

function MinimizeIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChecklistItem {
  id: string;
  taskKey: 'tools' | 'payouts' | 'bounty' | 'member';
  label: string;
  completed: boolean;
  tourId?: string;
  href: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const GettingStartedCard = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const { activeOrgSlug } = useActiveOrg();
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  let tour: ReturnType<typeof useTour> | null = null;
  try {
    tour = useTour();
  } catch {
    // TourProvider not present — card still works as navigation
  }

  const { data: onboardingState } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: isAuthenticated,
  });

  const completeTask = useMutation(
    trpc.onboarding.completeGettingStartedTask.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: [['onboarding', 'getState']],
        });
      },
    })
  );

  const items: ChecklistItem[] = [
    {
      id: 'tools',
      taskKey: 'tools',
      label: 'Connect your tools',
      completed: onboardingState?.gsConnectedTools ?? false,
      tourId: 'connect-tools',
      href: activeOrgSlug ? `/${activeOrgSlug}/integrations` : '/integrations',
    },
    {
      id: 'payouts',
      taskKey: 'payouts',
      label: 'Start receiving payouts',
      completed: onboardingState?.gsSetupPayouts ?? false,
      tourId: 'setup-payouts',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/payments?tab=settings`
        : '/settings/payments?tab=settings',
    },
    {
      id: 'first-bounty',
      taskKey: 'bounty',
      label: 'Create your first bounty',
      completed: onboardingState?.gsCreatedBounty ?? false,
      tourId: 'create-bounty',
      href: '/dashboard',
    },
    {
      id: 'invite-member',
      taskKey: 'member',
      label: 'Invite a member to your team',
      completed: onboardingState?.gsInvitedMember ?? false,
      tourId: 'invite-member',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/members`
        : '/settings/members',
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const isComplete = completedCount === items.length;

  if (!isAuthenticated || isComplete) return null;

  const handleItemClick = (item: ChecklistItem) => {
    // Mark the task as complete when clicked
    if (!item.completed) {
      completeTask.mutate({ task: item.taskKey });
    }

    if (item.tourId && tour) {
      // Start the tour first — this persists to sessionStorage so it survives
      // cross-page navigation (different layout groups remount TourProvider)
      tour.start(item.tourId);
      router.push(item.href);
    } else {
      router.push(item.href);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl gap-1 bg-surface-1 border border-border-subtle shadow-sm p-1.5 group-data-[collapsible=icon]:hidden">
      {/* Header */}
      <div className="flex items-center justify-between pt-1.5 pb-2 px-1.5">
        <span className="text-[13px] text-foreground/72 font-medium">
          Getting started
        </span>
        <button
          type="button"
          onClick={() => setIsMinimized(!isMinimized)}
          className="flex items-center justify-center rounded-md bg-surface-2 shrink-0 size-5 text-text-tertiary hover:text-foreground transition-colors"
        >
          <MinimizeIcon />
        </button>
      </div>

      {!isMinimized && (
        <>
          {/* Progress bar */}
          <div className="flex items-center px-1.5">
            <div className="grow h-1.5 rounded-full overflow-clip bg-surface-2">
              <div
                className="h-full rounded-full bg-[#4A6FDC] transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[11px] ml-2 text-text-tertiary font-medium">
              {progress}%
            </span>
          </div>

          {/* Checklist items */}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={cn(
                'flex items-center h-7 rounded-lg px-1 gap-1 shrink-0 text-left transition-colors',
                'hover:bg-surface-hover',
                item.completed ? 'text-foreground/80' : 'text-foreground/72'
              )}
            >
              <span className="flex items-center justify-center shrink-0 size-5">
                {item.completed ? (
                  <CompletedIcon />
                ) : (
                  <span className="text-text-tertiary">
                    <IncompleteIcon />
                  </span>
                )}
              </span>
              <span className="text-[13px] font-medium">{item.label}</span>
            </button>
          ))}
        </>
      )}
    </div>
  );
};
