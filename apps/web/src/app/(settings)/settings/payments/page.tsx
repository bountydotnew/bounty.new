import { PaymentSettings } from '@/components/settings/payment-settings';
import { Suspense } from 'react';

export default async function PaymentSettingsPage() {
  return await (
    <Suspense fallback={<div>Loading...</div>}>     
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 font-bold text-3xl">Payments</h1>
        <p className="text-muted-foreground">
          Configure your payment settings and preferences.
        </p>
      </header>
      <PaymentSettings />
    </div>
    </Suspense>
  );
}

