'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@bounty/ui/lib/utils';
import { useActiveOrg } from '@/hooks/use-active-org';
import { useSession } from '@/context/session-context';
import { useTour } from '@bounty/ui/components/tour';
import { trpc } from '@/utils/trpc';

interface FloatItem {
  id: string;
  taskKey: 'tools' | 'payouts' | 'bounty' | 'member';
  label: string;
  completed: boolean;
  tourId: string;
  href: string;
}

export function GettingStartedFloat() {
  const pathname = usePathname();
  const { activeOrgSlug } = useActiveOrg();
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  let tour: ReturnType<typeof useTour> | null = null;
  try {
    tour = useTour();
  } catch {
    // TourProvider not present
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

  // Only show on settings routes where sidebar card isn't visible
  const isSettingsRoute = pathname?.match(/\/[^/]+\/settings/);
  if (!isSettingsRoute) return null;
  if (!isAuthenticated) return null;

  const items: FloatItem[] = [
    {
      id: 'tools',
      taskKey: 'tools',
      label: 'Connect tools',
      completed: onboardingState?.connectedTools ?? false,
      tourId: 'connect-tools',
      href: activeOrgSlug ? `/${activeOrgSlug}/integrations` : '/integrations',
    },
    {
      id: 'payouts',
      taskKey: 'payouts',
      label: 'Setup payouts',
      completed: onboardingState?.setupPayouts ?? false,
      tourId: 'setup-payouts',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/payments?tab=settings`
        : '/settings/payments?tab=settings',
    },
    {
      id: 'first-bounty',
      taskKey: 'bounty',
      label: 'Create bounty',
      completed: onboardingState?.createdBounty ?? false,
      tourId: 'create-bounty',
      href: '/dashboard',
    },
    {
      id: 'invite-member',
      taskKey: 'member',
      label: 'Invite member',
      completed: onboardingState?.invitedMember ?? false,
      tourId: 'invite-member',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/members`
        : '/settings/members',
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const isComplete = completedCount === items.length;

  // Only show when onboarding is in progress (at least 1 task started, not all done)
  if (completedCount === 0 || isComplete) return null;

  const handleItemClick = (item: FloatItem) => {
    if (!item.completed) {
      completeTask.mutate({ task: item.taskKey });
    }

    if (item.tourId && tour) {
      tour.start(item.tourId);
      router.push(item.href);
    } else {
      router.push(item.href);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9990]">
      <div className="flex items-center gap-1 rounded-full bg-surface-1 border border-border-subtle shadow-lg px-1 py-1">
        <span className="text-[11px] text-text-tertiary font-medium pl-3 pr-1 whitespace-nowrap">
          Getting started
        </span>
        <div className="w-px h-4 bg-border-subtle" />
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleItemClick(item)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium whitespace-nowrap transition-colors',
              item.completed
                ? 'text-[#4A6FDC] bg-[#4A6FDC]/10'
                : 'text-text-secondary hover:text-foreground hover:bg-surface-hover'
            )}
          >
            {item.completed ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.5 1.333C4.818 1.333 1.833 4.318 1.833 8C1.833 11.682 4.818 14.667 8.5 14.667C12.182 14.667 15.166 11.682 15.166 8C15.166 4.318 12.182 1.333 8.5 1.333ZM10.887 6.65C11.062 6.436 11.03 6.121 10.816 5.946C10.603 5.771 10.288 5.803 10.113 6.017L7.463 9.256L6.52 8.313C6.325 8.118 6.008 8.118 5.813 8.313C5.618 8.508 5.618 8.825 5.813 9.02L7.146 10.354C7.246 10.453 7.383 10.506 7.525 10.499C7.666 10.492 7.797 10.426 7.887 10.316L10.887 6.65Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 16 16"
                fill="none"
                className="shrink-0 text-text-tertiary"
              >
                <circle
                  cx="8"
                  cy="8"
                  r="6.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="2 3"
                />
              </svg>
            )}
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
