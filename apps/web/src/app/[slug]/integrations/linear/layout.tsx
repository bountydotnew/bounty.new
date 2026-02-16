'use client';

import { Suspense } from 'react';
import type React from 'react';
import { LinearTabBar } from '@/components/integrations/linear';
import { LinearSkeleton } from '@/app/[slug]/components/linear-skeleton';

export default function LinearLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Redirect logic is handled by the page component (page.tsx) to
  // avoid duplicate navigations when both layout and page fire simultaneously.

  return (
    <>
      {/* Tab bar navigation */}
      <LinearTabBar />

      {/* Content */}
      <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
            <Suspense fallback={<LinearSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
