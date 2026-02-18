import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'GitHub Integration',
  description: 'Configure your GitHub integration.',
};

export default function Page() {
  return <ClientPage />;
}
