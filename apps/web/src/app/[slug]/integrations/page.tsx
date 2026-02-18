import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Integrations',
  description: 'Connect your tools and services.',
};

export default function Page() {
  return <ClientPage />;
}
