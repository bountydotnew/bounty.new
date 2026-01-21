'use client';

import { IntegrationsSettings } from '@/components/settings/integrations-settings';
import { Header } from '@/components/dual-sidebar/sidebar-header';

export default function IntegrationsPage() {
  return (
    <>
      <Header />
      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
        {/* Horizontal border line above content */}
        <div className="h-px w-full shrink-0 bg-[#232323]" />

        {/* Main content area with vertical borders */}
        <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-[#232323] mx-auto py-4 min-w-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 space-y-6">
              <header>
                <h1 className="mb-2 font-bold text-3xl">Integrations</h1>
                <p className="text-muted-foreground">
                  Manage your third-party integrations and connections.
                </p>
              </header>
              <IntegrationsSettings />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
