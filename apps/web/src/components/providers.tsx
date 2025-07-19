"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "./ui/sonner";
import { ConfettiProvider } from "@/lib/context/confetti-context";
import { Databuddy } from "@databuddy/sdk";
import { TOAST_ICONS, TOAST_OPTIONS } from "@/constants/toast";

export function Providers({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ConfettiProvider>
          {children}
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
