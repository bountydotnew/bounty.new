import { BillingSettings } from '@/components/settings/billing-settings';
import { Suspense } from 'react';

export default async function BillingSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillingSettings />
    </Suspense>
  );
}
