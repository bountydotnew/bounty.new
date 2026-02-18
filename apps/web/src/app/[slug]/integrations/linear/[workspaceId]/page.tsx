import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Linear Workspace',
  description: 'Manage your Linear workspace integration.',
};

export default function Page() {
  return <ClientPage />;
}
