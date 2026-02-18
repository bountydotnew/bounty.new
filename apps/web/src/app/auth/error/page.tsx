import type { Metadata } from 'next';
import AuthErrorPage from './_client';

export const metadata: Metadata = {
  title: 'Authentication Error',
  description: 'An error occurred during authentication',
};

export default function Page() {
  return <AuthErrorPage />;
}
