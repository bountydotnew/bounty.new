"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "./ui/sonner";
import { ConfettiProvider } from "@/lib/context/confetti-context";
import { AccessProvider } from "@/contexts/access-provider";
import { Databuddy } from "@databuddy/sdk";
import { TOAST_ICONS, TOAST_OPTIONS } from "@/constants/toast";
import { PostHogProvider } from "posthog-js/react";
import { AuthUIProvider } from "@daveyplate/better-auth-ui"
import { authClient } from "@bounty/auth/client";
import { useRouter } from "next/navigation"
import Link from "next/link";


export function Providers({
  children
}: {
  children: React.ReactNode
}) {
  const posthogApiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const router = useRouter()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {posthogApiKey ? (
          <PostHogProvider apiKey={posthogApiKey}>
            <ConfettiProvider>
              <AccessProvider>
                <AuthUIProvider
                authClient={authClient}
                navigate={router.push}
                replace={router.replace}
                onSessionChange={() => {
                  // Clear router cache (protected routes)
                  router.refresh()
                }}
                Link={Link}
              >
                {children}
              </AuthUIProvider>
              </AccessProvider>
              <Databuddy
                clientId="bounty"
                trackHashChanges={true}
                trackAttributes={true}
                trackOutgoingLinks={true}
                trackInteractions={true}
                trackEngagement={true}
                trackScrollDepth={true}
                trackExitIntent={true}
                trackBounceRate={true}
                trackWebVitals={true}
                trackErrors={true}
                enableBatching={true}
              />
            </ConfettiProvider>
            <ReactQueryDevtools />
          </PostHogProvider>
        ) : (
          <ConfettiProvider>
            <AccessProvider>
              {children}
            </AccessProvider>
            <Databuddy
              clientId="bounty"
              trackHashChanges={true}
              trackAttributes={true}
              trackOutgoingLinks={true}
              trackInteractions={true}
              trackEngagement={true}
              trackScrollDepth={true}
              trackExitIntent={true}
              trackBounceRate={true}
              trackWebVitals={true}
              trackErrors={true}
              enableBatching={true}
            />
          </ConfettiProvider>
        )}
      </QueryClientProvider>
      <Toaster
        richColors
        position="bottom-right"
        toastOptions={TOAST_OPTIONS}
        icons={TOAST_ICONS}
        visibleToasts={4}
      />
    </ThemeProvider>
  );
}
