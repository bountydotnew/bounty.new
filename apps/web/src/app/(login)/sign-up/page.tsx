import type { Metadata } from 'next';
import SignUpPage from './_client';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create your bounty.new account',
};

export default function Page() {
  return <SignUpPage />;
}
