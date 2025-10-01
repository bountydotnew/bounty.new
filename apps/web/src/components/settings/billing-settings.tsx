import type { CustomerState } from '@bounty/ui/types/billing';
import { BillingSettingsClient } from './billing-settings-client';

interface BillingSettingsProps {
  initialCustomerState?: CustomerState | null;
}

export function BillingSettings({ initialCustomerState }: BillingSettingsProps) {
  return <BillingSettingsClient initialCustomerState={initialCustomerState} />;
}
