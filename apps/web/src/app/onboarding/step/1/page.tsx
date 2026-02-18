import type { Metadata } from 'next';
import OnboardingStep1Page from './_client';

export const metadata: Metadata = {
  title: 'Get Started',
  description: 'Set up your bounty.new account',
};

export default function Page() {
  return <OnboardingStep1Page />;
}
