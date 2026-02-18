import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Linear Integration',
  description: 'Connect Linear to your workspace.',
};

export default function Page() {
  return <ClientPage />;
}
