import { SecuritySettings } from '@/components/settings/security-settings';
import { Suspense } from 'react';

export default async function SecuritySettingsPage() {
  return await (
    <Suspense fallback={<div>Loading...</div>}>
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 font-bold text-3xl">Security</h1>
        <p className="text-muted-foreground">
          Manage your security settings and authentication.
        </p>
      </header>
      <SecuritySettings />
    </div>
    </Suspense>
  );
}

