import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { DeviceProvider } from '@/components/device-provider';
import { Sidebar } from '@/components/dual-sidebar';
import { AuthLayout } from '@/components/auth/auth-layout';
import { EarlyAccessGuard } from '@/components/auth/early-access-guard';
import { FeedbackProvider, FeedbackOverlay } from '@bounty/feedback';
import { FeedbackDialog } from '@/components/feedback-dialog';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { OrgSlugProvider } from '@/context/org-slug-context';
import { OrgSyncGuard } from '@/components/auth/org-sync-guard';
import { Header } from '@/components/dual-sidebar/sidebar-header';
import { OnboardingController } from '@/components/onboarding/onboarding-controller';

export const metadata: Metadata = {
  title: 'bounty.new',
  description: 'bounty',
  icons: {
    icon: '/favicon/favicon_dark.png',
    apple: '/favicon/favicon_dark.png',
  },
};

export default async function OrgScopedLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
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
                environment: process.env.NODE_ENV ?? 'development',
              },
              ui: {
                title: 'Report an Issue',
                placeholder: 'Found a bug? Let us know what happened...',
              },
            }}
          >
            <FeedbackDialog />
            <FeedbackOverlay />
            <EarlyAccessGuard>
              <OnboardingController>
                <Sidebar admin={false}>
                  <Header />
                  <OrgSlugProvider slug={slug}>
                    <OrgSyncGuard slug={slug}>{children}</OrgSyncGuard>
                  </OrgSlugProvider>
                </Sidebar>
              </OnboardingController>
            </EarlyAccessGuard>
          </FeedbackProvider>
        </NuqsAdapter>
      </AuthLayout>
    </DeviceProvider>
  );
}
