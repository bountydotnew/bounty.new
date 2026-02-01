import { SecuritySettings } from '@/components/settings/security-settings';
import { Suspense } from 'react';

export default async function SecuritySettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SecuritySettings />
    </Suspense>
  );
}
