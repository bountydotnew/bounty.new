'use client';

import { authClient } from '@bounty/auth/client';
import { Databuddy } from '@databuddy/sdk';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useRouter } from 'next/navigation';
import { PostHogProvider } from 'posthog-js/react';
import { ThemeProvider } from '@/components/theme-provider';
import Link from '@/components/ui/link';
import { TOAST_ICONS, TOAST_OPTIONS } from '@/constants/toast';
import { AccessProvider } from '@/contexts/access-provider';
import { ConfettiProvider } from '@/lib/context/confetti-context';
import { queryClient } from '@/utils/trpc';
import { Toaster } from './ui/sonner';
import ImpersonationBanner from './impersonation-banner';

export function Providers({ children }: { children: React.ReactNode }) {
  const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const router = useRouter();

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        {posthogApiKey ? (
          <PostHogProvider apiKey={posthogApiKey}>
            <ConfettiProvider>
              <AccessProvider>
                <AuthUIProvider
                  authClient={authClient}
                  Link={Link}
                  navigate={router.push}
                  onSessionChange={() => {
                    // Clear router cache (protected routes)
                    router.refresh();
                  }}
                  replace={router.replace}
                >
                  <ImpersonationBanner />
                  {children}
                </AuthUIProvider>
              </AccessProvider>
              <Databuddy
                clientId="bounty"
                enableBatching={true}
                trackAttributes={true}
                trackBounceRate={true}
                trackEngagement={true}
                trackErrors={true}
                trackExitIntent={true}
                trackHashChanges={true}
                trackInteractions={true}
                trackOutgoingLinks={true}
                trackScrollDepth={true}
                trackWebVitals={true}
              />
            </ConfettiProvider>
            <ReactQueryDevtools />
          </PostHogProvider>
        ) : (
          <ConfettiProvider>
            <AccessProvider>
              <AuthUIProvider
                authClient={authClient}
                Link={Link}
                navigate={router.push}
                onSessionChange={() => {
                  // Clear router cache (protected routes)
                  router.refresh();
                }}
                replace={router.replace}
              >
                <ImpersonationBanner />
                {children}
              </AuthUIProvider>
            </AccessProvider>
            <Databuddy
              clientId="bounty"
              enableBatching={true}
              trackAttributes={true}
              trackBounceRate={true}
              trackEngagement={true}
              trackErrors={true}
              trackExitIntent={true}
              trackHashChanges={true}
              trackInteractions={true}
              trackOutgoingLinks={true}
              trackScrollDepth={true}
              trackWebVitals={true}
            />
          </ConfettiProvider>
        )}
      </QueryClientProvider>
      <Toaster
        icons={TOAST_ICONS}
        position="bottom-right"
        richColors
        toastOptions={TOAST_OPTIONS}
        visibleToasts={4}
      />
    </ThemeProvider>
  );
}
