import type { Metadata } from 'next';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Profile - Bounty',
  description: 'View user profile and activity on Bounty',
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a]">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
