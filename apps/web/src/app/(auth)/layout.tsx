import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DeviceProvider } from '@/components/device-provider';
import { Sidebar } from '@/components/dual-sidebar';
import { AuthLayout } from '@/components/auth/auth-layout';

export const metadata: Metadata = {
  title: 'bounty',
  description: 'bounty',
  icons: {
    icon: '/icon.svg',
  },
  openGraph: {
    title: 'bounty - App',
    description: 'Ship fast, get paid faster.',
    url: 'https://bounty',
    siteName: 'bounty',
    images: [
      {
        url: '/ogimage.png',
        width: 1200,
        height: 630,
        alt: 'bounty.new - Ship fast, get paid faster.',
      },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  return (
    <DeviceProvider userAgent={userAgent}>
      <AuthLayout>
        <Sidebar admin={false}>
          {children}
        </Sidebar>
      </AuthLayout>
    </DeviceProvider>
  );
}
