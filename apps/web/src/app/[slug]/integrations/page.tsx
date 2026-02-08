'use client';

import { IntegrationsSettings } from '@/components/settings/integrations-settings';

export default function IntegrationsPage() {
  return (
    <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
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
  );
}
