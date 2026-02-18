import type { Metadata } from 'next';
import OnboardingStep4Page from './page-client';

export const metadata: Metadata = {
  title: 'Invite Team',
  description: 'Invite your team members',
};

export default function Page() {
  return <OnboardingStep4Page />;
}
