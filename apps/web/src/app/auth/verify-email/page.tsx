import type { Metadata } from 'next';
import VerifyEmailPage from './_client';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
};

export default function Page() {
  return <VerifyEmailPage />;
}
