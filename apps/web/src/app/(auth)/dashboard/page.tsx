import type { Metadata } from 'next';
import { DashboardClient } from './dashboard-client';

export const metadata: Metadata = {
  title: 'Dasboard — bounty',
  description: 'Manage your bounties and track submissions',
};

export default function DashboardPage() {
  return <DashboardClient />;
}
