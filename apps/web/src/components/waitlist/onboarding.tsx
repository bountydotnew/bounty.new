'use client';

import { useState, useEffect } from 'react';
import { Github, Code, Briefcase } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { useSession } from '@/context/session-context';
import { toast } from 'sonner';
interface OnboardingProps {
  entryId: string;
  onComplete: () => void;
}

type OnboardingStep = 1 | 2;

export function Onboarding({ entryId, onComplete }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<'creator' | 'developer' | null>(null);
  const { session } = useSession();
  const { data: githubAccount } = useQuery({
    ...trpc.user.getGithubAccount.queryOptions(),
    enabled: !!session?.user,
  });

  const completeMutation = useMutation({
    mutationFn: async (input: {
      entryId: string;
      role: 'creator' | 'developer';
      githubId?: string;
      githubUsername?: string;
      name?: string;
      username?: string;
    }) => {
      // Use linkUserToWaitlist which handles the onboarding completion
      return await trpcClient.earlyAccess.linkUserToWaitlist.mutate({
        entryId: input.entryId,
        role: input.role,
        githubId: input.githubId,
        githubUsername: input.githubUsername,
        name: input.name,
        username: input.username,
      });
    },
  });

  // Check if GitHub is already connected
  useEffect(() => {
    if (session?.user) {
      // User has signed in with GitHub during this session
      console.log('GitHub connected:', session.user);
    }
  }, [session]);

  const handleNext = async () => {
    if (step === 1) {
      if (!role) {
        toast.error('Please select a role');
        return;
      }
      setStep(2);
    } else {
      // Complete onboarding
      setIsSubmitting(true);

      try {
        await completeMutation.mutateAsync({
          entryId,
          role: role as 'creator' | 'developer',
          githubUsername: githubAccount?.username
            ? githubAccount.username
            : undefined,
          name: session?.user?.name ?? undefined,
        });

        onComplete();
      } catch (error) {
        console.error('Failed to complete onboarding:', error);
        setIsSubmitting(false);
      }
    }
  };

  const handleConnectGithub = async () => {
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: window.location.href,
      });
    } catch (error) {
      console.error('GitHub sign in failed:', error);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return role !== null;
    }
    return true;
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Progress bar */}
      <div className="flex gap-2 mb-12">
        {[1, 2].map((s) => (
          <div
            key={s}
            className={`h-1 flex-1 rounded-full transition-colors ${
              s <= step ? 'bg-white' : 'bg-surface-3'
            }`}
          />
        ))}
      </div>

      {/* Step 1: Role selection */}
      {step === 1 && (
        <div>
          <h2 className="text-[32px] font-medium text-foreground mb-2">
            How will you use bounty.new?
          </h2>
          <p className="text-text-tertiary text-base mb-8">
            You can always do both later
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setRole('creator')}
              className={`w-full p-5 rounded-xl border text-left transition-colors ${
                role === 'creator'
                  ? 'bg-surface-1 border-white'
                  : 'bg-surface-1 border-border-subtle hover:border-border-strong'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
                  <Briefcase size={20} className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-medium mb-1">
                    Post bounties
                  </h3>
                  <p className="text-text-tertiary text-sm">
                    I want to post challenges and pay developers to solve them
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setRole('developer')}
              className={`w-full p-5 rounded-xl border text-left transition-colors ${
                role === 'developer'
                  ? 'bg-surface-1 border-white'
                  : 'bg-surface-1 border-border-subtle hover:border-border-strong'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
                  <Code size={20} className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-foreground text-lg font-medium mb-1">
                    Solve bounties
                  </h3>
                  <p className="text-text-tertiary text-sm">
                    I want to find bounties, ship solutions, and get paid
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 2: GitHub connection */}
      {step === 2 && (
        <div>
          <h2 className="text-[32px] font-medium text-foreground mb-2">
            Connect GitHub
          </h2>
          <p className="text-text-tertiary text-base mb-8">
            {role === 'creator'
              ? 'Import issues as bounties directly from your repos'
              : 'Showcase your work and submit PRs seamlessly'}
          </p>

          {session?.user ? (
            <div className="w-full p-4 rounded-xl bg-surface-1 border border-border-subtle flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-surface-3 flex items-center justify-center">
                <Github size={20} className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-foreground text-base">
                  @{githubAccount?.username || session.user.name || 'user'}
                </p>
                <p className="text-text-tertiary text-sm">Connected</p>
              </div>
              <svg
                className="w-5 h-5 text-green-400"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
          ) : (
            <button
              onClick={handleConnectGithub}
              className="w-full h-14 rounded-xl bg-surface-1 border border-border-subtle text-foreground text-base flex items-center justify-center gap-3 hover:border-border-strong transition-colors"
            >
              <Github size={20} />
              <span>Connect GitHub</span>
            </button>
          )}

          <button
            onClick={handleNext}
            className="text-text-tertiary text-sm mt-4 hover:text-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      )}

      {/* Continue button */}
      <button
        onClick={handleNext}
        disabled={!canProceed() || isSubmitting}
        className="mt-10 flex items-center justify-center gap-1.5 px-6 h-[40px] rounded-full text-foreground text-base font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
        style={{
          backgroundImage: 'linear-gradient(180deg, #ccc 0%, #808080 100%)',
        }}
      >
        {isSubmitting
          ? 'Finishing...'
          : step === 2
            ? 'Go to dashboard'
            : 'Continue'}
        <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
          <path
            d="M3 8h10M9 4l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
