'use client';

import { authClient } from '@bounty/auth/client';
import Link from '@bounty/ui/components/link';
import { Toaster } from '@bounty/ui/components/sonner';
import { Databuddy } from '@databuddy/sdk';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RealtimeProvider } from '@upstash/realtime/client';
import { AutumnProvider } from 'autumn-js/react';
import { useRouter } from 'next/navigation';
import ImpersonationBanner from '@/components/impersonation-banner';
import { ThemeProvider } from '@/components/theme-provider';
import { ConfettiProvider } from '@/context/confetti-context';
import { UserProvider } from '@/context/user-context';
import {
  SessionProvider,
  useSessionHook,
} from '@/context/session-context';
import { TOAST_ICONS, TOAST_OPTIONS } from '@/context/toast';
import { queryClient } from '@/utils/trpc';
import { FeedbackProvider } from '@/components/feedback-context';

function ProvidersInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const sessionHook = useSessionHook();

  // Pass the actual session hook to AuthUIProvider so it doesn't make its own calls
  const customUseSession = () => sessionHook;

  return (
    <UserProvider>
      <AuthUIProvider
        authClient={authClient}
        hooks={{ useSession: customUseSession }}
        Link={Link}
        navigate={router.push}
        onSessionChange={() => {
          // No-op: handled via SessionProvider above
        }}
        replace={router.replace}
      >
        <ImpersonationBanner />
        <FeedbackProvider>{children}</FeedbackProvider>
      </AuthUIProvider>
    </UserProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
      enableSystem
    >
      <QueryClientProvider client={queryClient}>
        <RealtimeProvider>
          <ConfettiProvider>
            <AutumnProvider includeCredentials>
              <SessionProvider>
                <ProvidersInner>{children}</ProvidersInner>
              </SessionProvider>
            </AutumnProvider>
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
        </RealtimeProvider>
        <ReactQueryDevtools />
        <Toaster
          //icons={TOAST_ICONS}
          position="bottom-center"
          richColors
          toastOptions={TOAST_OPTIONS}
          visibleToasts={4}
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
