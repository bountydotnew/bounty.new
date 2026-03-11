import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerSession } from '@bounty/auth/server-utils';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Welcome - bounty',
  description: 'Get started with bounty.new',
};

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <NuqsAdapter>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {children}
        </div>
      </div>
    </NuqsAdapter>
  );
}
