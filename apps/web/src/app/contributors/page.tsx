import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Contributors',
  description: 'Meet the developers building bounty.new.',
};

export default function Page() {
  return <ClientPage />;
}
