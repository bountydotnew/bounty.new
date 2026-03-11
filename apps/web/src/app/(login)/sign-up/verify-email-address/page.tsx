import type { Metadata } from 'next';
import VerifyEmailAddressPage from './page-client';

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your email address',
};

export default function Page() {
  return <VerifyEmailAddressPage />;
}
