import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Organization Invite',
  description: 'Accept an invitation to join an organization.',
};

export default function Page() {
  return <ClientPage />;
}
