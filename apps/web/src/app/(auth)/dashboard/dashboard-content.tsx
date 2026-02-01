'use client';

import { useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import GithubImportModal from '@/components/bounty/github-import-modal';
import { Header } from '@/components/dual-sidebar/sidebar-header';
// import { Onboarding } from '@/components/onboarding';
import {
  TaskInputForm,
  type TaskInputFormRef,
} from '@/components/dashboard/task-input-form';
import { DashboardPageContext } from '@/components/dashboard/dashboard-page';

interface DashboardContentProps {
  onImportOpenChange: (open: boolean) => void;
}

export function DashboardContent({ onImportOpenChange }: DashboardContentProps) {
  const router = useRouter();
  const taskInputRef = useRef<TaskInputFormRef>(null);

  // Access the dashboard state from context
  const context = use(DashboardPageContext);
  if (!context) {
    throw new Error('DashboardContent must be used within DashboardPageProvider');
  }

  const { state } = context;

  // Redirect to onboarding if not complete
  useEffect(() => {
    if (state.onboardingState) {
      const isComplete =
        state.onboardingState.completedStep1 &&
        state.onboardingState.completedStep2 &&
        state.onboardingState.completedStep3 &&
        state.onboardingState.completedStep4;

      if (!isComplete) {
        // Find first incomplete step
        if (!state.onboardingState.completedStep1) {
          router.push('/onboarding/step/1');
        } else if (!state.onboardingState.completedStep2) {
          router.push('/onboarding/step/2');
        } else if (!state.onboardingState.completedStep3) {
          router.push('/onboarding/step/3');
        } else if (!state.onboardingState.completedStep4) {
          router.push('/onboarding/step/4');
        }
      }
    }
  }, [state.onboardingState, router]);

  // Focus textarea if hash is present (for navigation from other pages)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === '#focus-textarea' || hash === '#new-bounty') {
      // Small delay to ensure component is mounted
      setTimeout(() => {
        taskInputRef.current?.focus();
        window.history.replaceState(null, '', window.location.pathname);
      }, 100);
    }

    // Listen for custom event to focus textarea (when already on dashboard)
    const handleFocusTextarea = () => {
      setTimeout(() => {
        taskInputRef.current?.focus();
      }, 100);
    };

    window.addEventListener('focus-textarea', handleFocusTextarea);
    return () => {
      window.removeEventListener('focus-textarea', handleFocusTextarea);
    };
  }, []);

  return (
    <>
      {/* <Onboarding /> */}
      <Header
        isMyBountiesLoading={state.isMyBountiesLoading}
        myBounties={state.myBounties}
      />

      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
        {/* Horizontal border line above textarea */}
        <div className="h-px w-full shrink-0 bg-surface-3" />

        <TaskInputForm ref={taskInputRef} />

        {/* Horizontal border line below textarea */}
        <div className="h-px w-full shrink-0 bg-surface-3" />

        {/* Bounty list section with vertical borders */}
        <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
              <BountiesFeed.Provider bounties={state.bounties} isLoading={state.isBountiesLoading} error={state.bountiesError} className="lg:pr-2">
                <BountiesFeed.ListView />
              </BountiesFeed.Provider>
            </div>
          </div>
        </div>
      </div>
      <GithubImportModal onOpenChange={onImportOpenChange} open={false} />
    </>
  );
}
