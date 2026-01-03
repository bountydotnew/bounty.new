import { getServerCustomerState } from '@bounty/auth/server-utils';
import { GeneralSettings } from '@/components/settings/general-settings';

export default async function ProfileSettingsPage() {
  const { data: customerState } = await getServerCustomerState();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="mb-2 font-bold text-3xl">Account</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </header>
      <GeneralSettings initialCustomerState={customerState} />
    </div>
  );
}
