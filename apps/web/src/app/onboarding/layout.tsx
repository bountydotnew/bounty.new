import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Welcome - bounty',
  description: 'Get started with bounty.new',
};

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {children}
      </div>
    </div>
  );
}
