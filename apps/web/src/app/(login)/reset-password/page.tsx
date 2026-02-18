import type { Metadata } from 'next';
import ResetPasswordPage from './_client';

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your bounty.new password',
};

export default function Page() {
  return <ResetPasswordPage />;
}
