import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Discord Integration',
  description: 'Connect Discord to your workspace.',
};

export default function Page() {
  return <ClientPage />;
}
