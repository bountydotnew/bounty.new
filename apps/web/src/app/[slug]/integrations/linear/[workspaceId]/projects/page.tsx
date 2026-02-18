import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Linear Projects',
  description: 'Browse Linear projects.',
};

export default function Page() {
  return <ClientPage />;
}
