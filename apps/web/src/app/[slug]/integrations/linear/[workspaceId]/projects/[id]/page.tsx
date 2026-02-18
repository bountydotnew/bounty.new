import type { Metadata } from 'next';
import ClientPage from './page-client';

export const metadata: Metadata = {
  title: 'Linear Project',
  description: 'View Linear project details.',
};

export default function Page() {
  return <ClientPage />;
}
