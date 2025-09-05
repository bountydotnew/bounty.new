'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@bounty/ui/components/button';

import { useNavigationContext } from '@bounty/ui/hooks/use-navigation-context';

export function SmartNavigation() {
  const router = useRouter();
  const context = useNavigationContext();

  const handleBack = () => {
    // Try browser back first if it makes sense
    if (typeof window !== 'undefined' && window.history.length > 1) {
      const referrer = document.referrer;
      if (
        referrer &&
        (referrer.includes('/dashboard') ||
          referrer.includes('/bounties') ||
          referrer.includes('/issues/'))
      ) {
        router.back();
        return;
      }
    }

    // Fallback to context-aware navigation
    router.push(context.backPath);
  };

  return (
    <div className="my-6 flex items-center justify-between">
      {/* Smart Back Button */}
      <Button
        className="flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-3 text-white dark:text-black"
        onClick={handleBack}
        size="sm"
        variant="default"
      >
        <ArrowLeft className="h-4 w-4 text-white dark:text-black" />
        <span className="hidden sm:inline">Back to {context.backLabel}</span>
        <span className="sm:hidden">Back</span>
      </Button>

      {/* Context indicator for special cases */}
      {/* {context.from === "gh-issue" && context.referrerInfo && (
        <div className="flex items-center gap-2 text-xs text-[rgba(239,239,239,0.5)]">
          <span>from GitHub Issue #{context.referrerInfo.issueNumber}</span>
        </div>
      )}

      {context.from === "dashboard" && (
        <div className="flex items-center gap-2 text-xs text-[rgba(239,239,239,0.5)]">
          <span>from Dashboard</span>
        </div>
      )} */}
    </div>
  );
}
