import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DeviceProvider } from '@/components/device-provider';
import { Sidebar } from '@/components/dual-sidebar';
import { AuthLayout } from '@/components/auth/auth-layout';
import { EarlyAccessGuard } from '@/components/auth/early-access-guard';
import { FeedbackProvider } from '@/components/feedback-context';
import { FeedbackModal } from '@/components/feedback-modal';
import { FeedbackOverlay } from '@/components/feedback-overlay';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { Header } from '@/components/dual-sidebar/sidebar-header';

export const metadata: Metadata = {
  title: 'bounty.new',
  description: 'bounty',
  icons: {
    icon: '/favicon/favicon_dark.png',
    apple: '/favicon/favicon_dark.png',
  },
  openGraph: {
    title: 'bounty.new',
    description: 'Ship fast, get paid faster.',
    url: 'https://bounty.new',
    siteName: 'bounty',
    images: [
      {
        url: '/og-image.png',
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
        <NuqsAdapter>
          <FeedbackProvider
            config={{
              metadata: {
                appVersion: '1.0.0',
                environment: process.env.NODE_ENV,
              },
              ui: {
                title: 'Report an Issue',
                placeholder: 'Found a bug? Let us know what happened...',
                colors: {
                  primary: '#232323',
                },
                zIndex: 9999,
              },
            }}
          >
            <FeedbackModal />
            <FeedbackOverlay />
            <EarlyAccessGuard>
              <Sidebar admin={false}>
                <Header />
                {children}
              </Sidebar>
            </EarlyAccessGuard>
          </FeedbackProvider>
        </NuqsAdapter>
      </AuthLayout>
    </DeviceProvider>
  );
}
