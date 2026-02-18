import type { Metadata } from 'next';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { ContentBlocks } from '@/components/landing/content-blocks';

export const metadata: Metadata = {
  title: 'Open Source Bounty Platform',
  description:
    'Ship faster. Get paid instantly. Create and claim bounties on open source projects.',
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <ContentBlocks />
      </main>
      <Footer />
    </div>
  );
}
