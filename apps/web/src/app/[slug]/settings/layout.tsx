'use client';

import type React from 'react';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { OrgSettingsTabBar } from '@/components/settings/org-settings-sidebar';

export default function OrgSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
        {/* Horizontal border line at top */}
        <div className="h-px w-full shrink-0 bg-surface-3" />

        {/* Tab bar navigation */}
        <OrgSettingsTabBar />

        {/* Content */}
        <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
