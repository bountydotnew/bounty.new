import type { Metadata } from 'next';
import ClientPage from './_client';

export const metadata: Metadata = {
  title: 'Roadmap',
  description: "See what we're building next.",
};

export default function Page() {
  return <ClientPage />;
}
