import type { Metadata } from 'next';
import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { ContentBlocks } from '@/components/landing/content-blocks';

export const metadata: Metadata = {
  title: 'Bounty – Human fixes for the AI era',
  description:
    'AI writes bugs humans have to fix. Post a bounty, get a real solution from developers who\'ve seen the pattern before.',
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
