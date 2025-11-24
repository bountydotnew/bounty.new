import { getServerCustomerState } from '@bounty/auth/server-utils';
import { PaymentSettings } from '@/components/settings/payment-settings';

export default async function PaymentSettingsPage() {
  // Fetch customer state on the server
  const { data: customerState } = await getServerCustomerState();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <header className="mb-8">
        <h1 className="mb-2 font-bold text-3xl">Payments</h1>
        <p className="text-muted-foreground">
          Manage your payment methods and payout preferences.
        </p>
      </header>
      <main>
        <PaymentSettings initialCustomerState={customerState} />
      </main>
    </div>
  );
}
