import { getServerCustomerState } from '@bounty/auth/server-utils';
import { BillingSettings } from '@/components/settings/billing-settings';

export default async function BillingSettingsPage() {
  // Fetch customer state on the server
  const { data: customerState } = await getServerCustomerState();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Billing</h1>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </header>
      <main>
        <BillingSettings initialCustomerState={customerState} />
      </main>
    </div>
  );
}
