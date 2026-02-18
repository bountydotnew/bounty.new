import type { Metadata } from 'next';
import EarlyAccessRequiredPage from './_client';

export const metadata: Metadata = {
  title: 'Early Access Required',
  description: 'Join the waitlist for early access',
};

export default function Page() {
  return <EarlyAccessRequiredPage />;
}
