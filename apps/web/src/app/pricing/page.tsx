import type { Metadata } from 'next';
import { PricingPageContent } from './pricing-content';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Pricing - Bounty',
  description: 'Simple, transparent pricing for Bounty. Choose the plan that fits your needs.',
  openGraph: {
    title: 'Pricing - Bounty',
    description: 'Simple, transparent pricing for Bounty. Choose the plan that fits your needs.',
    url: 'https://bounty.new/pricing',
    siteName: 'bounty',
  },
};

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Header />
      <main className="flex-1">
        <PricingPageContent />
      </main>
      <Footer />
    </div>
  );
}
