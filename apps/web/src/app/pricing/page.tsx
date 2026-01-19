import type { Metadata } from 'next';
import { Suspense } from 'react';
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

function PricingLoader() {
  return (
    <div className="mx-auto max-w-7xl px-8 pt-32 pb-24">
      <h1 className="text-center text-5xl font-bold tracking-tight text-[#efefef]">
        Pricing
      </h1>
      <div className="mt-16 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#333] border-t-white" />
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PricingLoader />}>
          <PricingPageContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
