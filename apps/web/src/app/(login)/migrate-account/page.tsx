import type { Metadata } from 'next';
import MigrateAccountPage from './_client';

export const metadata: Metadata = {
  title: 'Migrate Account',
  description: 'Migrate your account to bounty.new',
};

export default function Page() {
  return <MigrateAccountPage />;
}
