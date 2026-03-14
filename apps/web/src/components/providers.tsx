'use client';

import { authClient } from '@bounty/auth/client';
import Link from '@bounty/ui/components/link';
import { Toaster } from '@bounty/ui/components/sonner';
import { Databuddy } from '@databuddy/sdk';
import { AuthUIProvider } from '@daveyplate/better-auth-ui';
import { LazyMotion, domAnimation } from 'motion/react';
import { useRouter } from 'next/navigation';
import ImpersonationBanner from '@/components/impersonation-banner';
import { ConvexClientProvider } from '@/components/convex-provider';
import { ThemeProvider } from '@/components/theme-provider';
import { ConfettiProvider } from '@/context/confetti-context';
import { UserProvider } from '@/context/user-context';
import { SessionProvider, useSessionHook } from '@/context/session-context';
import { FeedbackProvider } from '@bounty/feedback';

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
      <ConvexClientProvider>
        <LazyMotion features={domAnimation} strict>
          <ConfettiProvider>
            <SessionProvider>
              <ProvidersInner>{children}</ProvidersInner>
            </SessionProvider>
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
              trackOutgoingLinks={process.env.NODE_ENV !== 'development'}
              trackScrollDepth={true}
              trackWebVitals={true}
            />
          </ConfettiProvider>
          <Toaster position="bottom-center" />
        </LazyMotion>
      </ConvexClientProvider>
    </ThemeProvider>
  );
}
