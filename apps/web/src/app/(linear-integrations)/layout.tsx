import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DeviceProvider } from '@/components/device-provider';
import { AuthLayout } from '@/components/auth/auth-layout';
import { FeedbackProvider } from '@/components/feedback-context';
import { FeedbackModal } from '@/components/feedback-modal';
import { FeedbackOverlay } from '@/components/feedback-overlay';
import { EarlyAccessGuard } from '@/components/auth/early-access-guard';

export const metadata: Metadata = {
  title: 'Linear Integration | bounty',
  description: 'Connect your Linear workspace to create bounties',
  icons: {
    icon: '/icon.svg',
  },
};

export default async function LinearIntegrationsRouteGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';

  return (
    <DeviceProvider userAgent={userAgent}>
      <AuthLayout>
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
          <EarlyAccessGuard>{children}</EarlyAccessGuard>
        </FeedbackProvider>
      </AuthLayout>
    </DeviceProvider>
  );
}
