import { getServerCustomerState } from '@bounty/auth/server-utils';
import { BillingSettings } from '@/components/settings/billing-settings';

export default async function BillingSettingsPage() {
  const { data: customerState } = await getServerCustomerState();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 font-bold text-3xl">Billing</h1>
        <p className="text-muted-foreground">
          Manage your billing information and subscription.
        </p>
      </header>
      <BillingSettings initialCustomerState={customerState} />
    </div>
  );
}

