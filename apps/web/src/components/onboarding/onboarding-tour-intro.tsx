'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@bounty/ui/components/dialog';
import { Loader2 } from 'lucide-react';

interface OnboardingTourIntroProps {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

const steps = [
  {
    label: 'Connect your tools',
    description: 'Link GitHub, Discord, Linear & more',
  },
  {
    label: 'Start receiving payouts',
    description: 'Set up Stripe to get paid',
  },
  {
    label: 'Create your first bounty',
    description: 'Post a task for contributors',
  },
  {
    label: 'Invite a member to your team',
    description: 'Collaborate with your org',
  },
];

export function OnboardingTourIntro({
  open,
  onStart,
  onSkip,
  isLoading = false,
}: OnboardingTourIntroProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        // Prevent closing by clicking outside — user must choose skip or continue
      }}
    >
      <DialogContent
        className="flex flex-col items-center gap-8 border-none bg-transparent p-0 shadow-none max-w-none w-auto"
        showCloseButton={false}
      >
        <DialogTitle className="sr-only">Welcome to bounty.new</DialogTitle>

        {/* Header */}
        <div
          className="flex flex-col justify-center items-start w-full"
          style={{ maxWidth: '403px' }}
        >
          <h2 className="text-[28px] leading-[150%] text-foreground font-medium mb-2">
            Welcome to bounty.new
          </h2>
          <p className="text-[16px] leading-[150%] text-text-secondary font-medium">
            Let&apos;s get you set up in just a few steps so you can start
            creating and managing bounties.
          </p>
        </div>

        {/* Card */}
        <div
          className="bg-surface-1 border border-solid border-border-subtle rounded-[17px] overflow-hidden w-full"
          style={{ maxWidth: '403px' }}
        >
          <div className="flex flex-col">
            {/* Content */}
            <div className="p-8">
              <div className="space-y-3">
                {steps.map((step, i) => (
                  <div key={step.label} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-surface-2 flex items-center justify-center text-xs font-semibold text-text-secondary">
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {step.label}
                      </p>
                      <p className="text-xs text-text-tertiary">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-1 w-full px-3 pb-2">
              <button
                type="button"
                onClick={onSkip}
                disabled={isLoading}
                className="w-fit h-[29px] rounded-[17px] flex justify-center items-center px-4 py-0 bg-background border border-solid border-border-subtle text-[13px] leading-[150%] text-warning-foreground font-medium hover:bg-surface-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-none"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={onStart}
                disabled={isLoading}
                className="w-fit min-w-[80px] h-[29px] rounded-[17px] flex justify-center items-center px-4 py-0 bg-white border border-solid border-border-subtle text-[13px] leading-[150%] text-black font-medium hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-none"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin text-black" />
                ) : (
                  "Let's go"
                )}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
