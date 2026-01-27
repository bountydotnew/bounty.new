import { Footer } from '@/components/landing/footer';
import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0E0E0E]">
      <Header />
      <main>
        <Hero />
      </main>
      <Footer />
      {/* <BountyForm /> */}
    </div>
  );
}
