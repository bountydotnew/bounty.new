'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';
import { AnimatePresence, m } from 'motion/react';
import { cn } from '@bounty/ui/lib/utils';
import { useActiveOrg } from '@/hooks/use-active-org';
import { useSession } from '@/context/session-context';
import { useOptionalTour } from '@bounty/ui/components/tour';

// ---------------------------------------------------------------------------
// Storage key for dismiss persistence
// ---------------------------------------------------------------------------

const DISMISS_KEY = 'bounty-getting-started-dismissed';

// ---------------------------------------------------------------------------
// Animation config
// ---------------------------------------------------------------------------

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

// ---------------------------------------------------------------------------
// SVG Icons
// ---------------------------------------------------------------------------

function CompletedIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
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
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3"
    >
      <path d="M5 12h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      className="size-3 shrink-0"
    >
      <path
        d="M17.293 5.293C17.683 4.902 18.317 4.902 18.707 5.293C19.098 5.683 19.098 6.316 18.707 6.707L13.413 12L18.706 17.293L18.775 17.369C19.095 17.762 19.072 18.341 18.706 18.707C18.34 19.073 17.761 19.096 17.368 18.775L17.292 18.707L11.999 13.414L6.708 18.706C6.317 19.097 5.684 19.096 5.294 18.706C4.903 18.316 4.903 17.683 5.294 17.292L10.585 12L5.293 6.708L5.225 6.632C4.904 6.239 4.927 5.66 5.293 5.294C5.659 4.928 6.238 4.905 6.631 5.225L6.707 5.294L11.999 10.586L17.293 5.293Z"
        fill="currentColor"
      />
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
  const [isDismissed, setIsDismissed] = useState(false);
  const { activeOrgSlug } = useActiveOrg();
  const { isAuthenticated } = useSession();
  const router = useRouter();
  const tour = useOptionalTour();

  // Load dismiss state from localStorage on mount
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // localStorage may not be available
    }
  }, []);

  const onboardingState = useQuery(
    api.functions.onboarding.getState,
    isAuthenticated ? {} : 'skip'
  );

  const items: ChecklistItem[] = [
    {
      id: 'tools',
      taskKey: 'tools',
      label: 'Connect your repos',
      completed: onboardingState?.completedStep1 ?? false,
      tourId: 'connect-tools',
      href: activeOrgSlug ? `/${activeOrgSlug}/integrations` : '/integrations',
    },
    {
      id: 'payouts',
      taskKey: 'payouts',
      label: 'Start receiving payouts',
      completed: onboardingState?.completedStep2 ?? false,
      tourId: 'setup-payouts',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/payments?tab=settings`
        : '/settings/payments?tab=settings',
    },
    {
      id: 'first-bounty',
      taskKey: 'bounty',
      label: 'Create your first bounty',
      completed: onboardingState?.completedStep3 ?? false,
      tourId: 'create-bounty',
      href: '/dashboard',
    },
    {
      id: 'invite-member',
      taskKey: 'member',
      label: 'Invite a member to your team',
      completed: onboardingState?.completedStep4 ?? false,
      tourId: 'invite-member',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/members`
        : '/settings/members',
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = Math.round((completedCount / items.length) * 100);
  const isComplete = completedCount === items.length;

  if (!isAuthenticated || isComplete || isDismissed) {
    return null;
  }

  const handleItemClick = (item: ChecklistItem) => {
    if (item.tourId && tour) {
      tour.start(item.tourId);
      router.push(item.href);
    } else {
      router.push(item.href);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // localStorage may not be available
    }
  };

  return (
    <m.div
      className="flex flex-col rounded-2xl gap-1 bg-surface-1 border border-border-subtle shadow-sm p-1.5 group-data-[collapsible=icon]:hidden overflow-hidden"
      layout
      transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-1.5 pb-2 px-1.5">
        <span className="text-[13px] text-foreground/72 font-[520]">
          Getting started
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="flex items-center justify-center rounded-md bg-surface-2 shrink-0 size-5 text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <MinimizeIcon />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center justify-center rounded-md bg-surface-2 shrink-0 size-5 text-foreground/40 hover:text-foreground/60 transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Progress bar — always visible */}
      <m.div className="flex items-center px-1.5" layout="position">
        <div className="grow h-1.5 rounded-full overflow-clip bg-surface-2">
          <div
            className="h-full rounded-full bg-[#4A6FDC] transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[11px] ml-2 text-foreground/50 font-[520]">
          {progress}%
        </span>
      </m.div>

      {/* Checklist items — animated in/out */}
      <AnimatePresence>
        {!isMinimized && (
          <m.div
            className="flex flex-col"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          >
            {items.map((item, i) => (
              <m.button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={cn(
                  'flex items-center h-7 rounded-lg px-1 gap-1 shrink-0 text-left transition-colors',
                  'hover:bg-surface-hover',
                  item.completed ? 'text-foreground/80' : 'text-foreground/72'
                )}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.25,
                  ease: EASE_OUT_EXPO,
                  delay: i * 0.04,
                }}
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
                <span className="text-[13px] font-[520]">{item.label}</span>
              </m.button>
            ))}
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
};
