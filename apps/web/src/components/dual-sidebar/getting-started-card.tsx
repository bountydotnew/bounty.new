'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, X } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { useActiveOrg } from '@/hooks/use-active-org';
import { useSession } from '@/context/session-context';
import { trpc } from '@/utils/trpc';
import Link from 'next/link';

interface ChecklistItem {
  id: string;
  label: string;
  href: string;
  completed: boolean;
}

export const GettingStartedCard = () => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { activeOrgSlug } = useActiveOrg();
  const { isAuthenticated } = useSession();

  const { data: onboardingState } = useQuery({
    ...trpc.onboarding.getState.queryOptions(),
    enabled: isAuthenticated,
  });

  const items: ChecklistItem[] = [
    {
      id: 'payments',
      label: 'Connect Stripe payments',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/settings/payments`
        : '/settings/payments',
      completed: false,
    },
    {
      id: 'integrations',
      label: 'Install GitHub',
      href: activeOrgSlug
        ? `/${activeOrgSlug}/integrations`
        : '/integrations',
      completed: false,
    },
    {
      id: 'first-bounty',
      label: 'Create your first bounty',
      href: '/bounties',
      completed: false,
    },
  ];

  const completedCount = items.filter((i) => i.completed).length;
  const progress = (completedCount / items.length) * 100;
  const isComplete =
    completedCount === items.length ||
    onboardingState?.completedOnboarding === true;

  if (isDismissed || isComplete) return null;

  return (
    <div className="group/sheet relative flex flex-col gap-2 rounded-[8px] border border-border-subtle bg-surface-1 p-3 group-data-[collapsible=icon]:hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <h3 className="text-xs font-semibold text-foreground">
            Getting started
          </h3>
          <span className="text-[10px] text-text-tertiary">
            {completedCount}/{items.length}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="shrink-0 text-text-tertiary hover:text-foreground transition-colors p-0.5 rounded hover:bg-surface-hover"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 w-full bg-surface-2 rounded-full overflow-hidden">
        <div
          className="h-full bg-brand-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-0.5">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              'flex items-center gap-1.5 rounded px-1.5 py-1 text-xs transition-colors',
              item.completed
                ? 'text-text-muted'
                : 'text-text-secondary hover:text-foreground hover:bg-surface-hover'
            )}
          >
            {item.completed ? (
              <CheckCircle2 className="h-3 w-3 text-brand-primary shrink-0" />
            ) : (
              <Circle className="h-3 w-3 text-text-tertiary shrink-0" />
            )}
            <span className="truncate">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
