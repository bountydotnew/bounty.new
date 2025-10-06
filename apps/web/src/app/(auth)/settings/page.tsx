import { getServerCustomerState } from '@bounty/auth/server-utils';
import { SettingsClient } from './settings-client';

export default async function SettingsPage() {
  // Fetch customer state on the server
  const { data: customerState } = await getServerCustomerState();

  return <SettingsClient initialCustomerState={customerState} />;
}
