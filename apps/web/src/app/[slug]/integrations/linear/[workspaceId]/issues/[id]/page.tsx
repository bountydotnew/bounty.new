import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Linear Issue',
  description: 'View Linear issue details.',
};

export default function Page() {
  return <ClientPage />;
}
