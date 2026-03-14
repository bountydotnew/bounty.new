'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/utils/convex';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';
import { ArrowRight } from 'lucide-react';

interface Action {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

const ACTIONS: Action[] = [
  {
    id: 'bounties',
    label: 'View bounties',
    href: '/bounties',
  },
  {
    id: 'docs',
    label: 'Read documentation',
    href: 'https://docs.bounty.new',
    external: true,
  },
  {
    id: 'discord',
    label: 'Join Discord',
    href: 'https://discord.gg/bountynew',
    external: true,
  },
];

export default function OnboardingStep4Page() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const completeStep = useMutation(api.functions.onboarding.completeStep);

  const handleGoToDashboard = async () => {
    setIsPending(true);
    try {
      await completeStep({ step: 4 });
      // Set onboarding complete cookie
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000';
      router.push('/dashboard');
    } finally {
      setIsPending(false);
    }
  };

  const handleActionClick = async (action: Action) => {
    setIsPending(true);
    try {
      await completeStep({ step: 4 });
      // Set onboarding complete cookie
      document.cookie = 'onboarding_complete=true; path=/; max-age=31536000';
      if (action.external) {
        window.open(action.href, '_blank', 'noopener,noreferrer');
      } else {
        router.push(action.href);
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <OnboardingDialog
      open
      title="You're all set"
      subtitle="Choose what to do next"
      isLoading={isPending}
      actionLabel="Go to dashboard"
      onAction={handleGoToDashboard}
    >
      <div className="flex flex-col gap-2 w-full">
        {ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="flex items-center justify-between gap-3 px-3 py-2 bg-background rounded-md text-sm text-text-tertiary hover:text-foreground hover:bg-surface-1 transition-colors focus:outline-none focus-visible:outline-none"
          >
            {action.label}
            <ArrowRight className="h-3 w-3 shrink-0" />
          </button>
        ))}
      </div>
    </OnboardingDialog>
  );
}
