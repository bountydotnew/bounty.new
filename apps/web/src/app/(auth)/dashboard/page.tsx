'use client';

import { track } from '@databuddy/sdk';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import { AuthGuard } from '@/components/auth/auth-guard';
import { BountiesFeed } from '@/components/bounty/bounties-feed';
import GithubImportModal from '@/components/bounty/github-import-modal';
// Dashboard components
import { ErrorBoundary } from '@/components/dashboard/error-boundary';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { Onboarding } from '@/components/onboarding';
import {
  TaskInputForm,
  type TaskInputFormRef,
} from '@/components/dashboard/task-input-form';
import { DashboardPageProvider, DashboardPageContext } from '@/components/dashboard/dashboard-page';
track('screen_view', { screen_name: 'dashboard' });

function DashboardContent() {
  const router = useRouter();
  const taskInputRef = useRef<TaskInputFormRef>(null);
  const [importOpen, setImportOpen] = useState(false);

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
      <Onboarding />
      <Header
        isMyBountiesLoading={state.isMyBountiesLoading}
        myBounties={state.myBounties}
      />

      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
        {/* Horizontal border line above textarea */}
        <div className="h-px w-full shrink-0 bg-[#232323]" />

        <TaskInputForm ref={taskInputRef} />

        {/* Horizontal border line below textarea */}
        <div className="h-px w-full shrink-0 bg-[#232323]" />

        {/* Bounty list section with vertical borders */}
        <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-[#232323] mx-auto py-4 min-w-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
              <BountiesFeed
                bounties={state.bounties}
                className="lg:pr-2"
                error={state.bountiesError}
                isError={Boolean(state.bountiesError)}
                isLoading={state.isBountiesLoading}
                layout="list"
              />
            </div>
          </div>
        </div>
      </div>
      <GithubImportModal onOpenChange={setImportOpen} open={importOpen} />
    </>
  );
}

export default function Dashboard() {
  return (
    <ErrorBoundary>
      <AuthGuard>
        <DashboardPageProvider>
          <DashboardContent />
        </DashboardPageProvider>
      </AuthGuard>
    </ErrorBoundary>
  );
}
