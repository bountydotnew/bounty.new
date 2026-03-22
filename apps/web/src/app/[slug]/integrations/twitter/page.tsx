import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'X (Twitter) Integration',
  description: 'Connect your X account to create bounties from tweets.',
};

export default function Page() {
  return <ClientPage />;
}
