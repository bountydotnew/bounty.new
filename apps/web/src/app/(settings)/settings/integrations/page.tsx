import { IntegrationsSettings } from '@/components/settings/integrations-settings';

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 font-bold text-3xl">Integrations</h1>
        <p className="text-muted-foreground">
          Manage your third-party integrations and connections.
        </p>
      </header>
      <IntegrationsSettings />
    </div>
  );
}
