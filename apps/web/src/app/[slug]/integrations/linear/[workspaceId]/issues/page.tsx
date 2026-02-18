import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Linear Issues',
  description: 'Browse and create bounties from Linear issues.',
};

export default function Page() {
  return <ClientPage />;
}
