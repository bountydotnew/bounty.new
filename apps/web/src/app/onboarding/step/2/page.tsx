import type { Metadata } from 'next';
import OnboardingStep2Page from './_client';

export const metadata: Metadata = {
  title: 'Connect GitHub',
  description: 'Connect your GitHub account',
};

export default function Page() {
  return <OnboardingStep2Page />;
}
