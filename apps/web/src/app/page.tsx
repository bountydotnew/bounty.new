import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { ContentBlocks } from '@/components/landing/content-blocks';

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
