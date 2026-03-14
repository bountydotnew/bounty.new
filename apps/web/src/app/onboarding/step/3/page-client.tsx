'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/utils/convex';
import { OnboardingDialog } from '@/components/onboarding-flow/onboarding-dialog';
import { useState } from 'react';

const SOURCES = [
  { id: 'twitter', label: 'Twitter / X' },
  { id: 'github', label: 'GitHub' },
  { id: 'friend', label: 'Friend' },
  { id: 'hackernews', label: 'Hacker News' },
  { id: 'indiehackers', label: 'Indie Hackers' },
  { id: 'reddit', label: 'Reddit' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'other', label: 'Other' },
] as const;

export default function OnboardingStep3Page() {
  const router = useRouter();
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const saveSource = useMutation(api.functions.onboarding.saveSource);

  const handleContinue = async () => {
    if (selectedSource) {
      setIsPending(true);
      try {
        await saveSource({ source: selectedSource });
        router.push('/onboarding/step/4');
      } finally {
        setIsPending(false);
      }
    } else {
      router.push('/onboarding/step/4');
    }
  };

  const handleSkip = () => {
    router.push('/onboarding/step/4');
  };

  return (
    <OnboardingDialog
      open
      title="How did you hear about us?"
      subtitle="Optional"
      isLoading={isPending}
      actionLabel="Continue"
      onAction={handleContinue}
      skipLabel="Skip"
      onSkip={handleSkip}
    >
      <div className="grid grid-cols-2 gap-2 w-full">
        {SOURCES.map((source) => (
          <button
            key={source.id}
            onClick={() => setSelectedSource(source.id)}
            className={`
              px-3 py-2 rounded-md text-sm text-left transition-all focus:outline-none focus-visible:outline-none
              ${
                selectedSource === source.id
                  ? 'bg-white text-black'
                  : 'bg-background text-text-tertiary hover:text-foreground hover:bg-surface-1'
              }
            `}
          >
            {source.label}
          </button>
        ))}
      </div>
    </OnboardingDialog>
  );
}
