import { PaymentSettings } from '@/components/settings/payment-settings';
import { Suspense } from 'react';

export default async function PaymentSettingsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentSettings />
    </Suspense>
  );
}
