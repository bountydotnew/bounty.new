"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/utils/trpc";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "./ui/sonner";
import { ConfettiProvider } from "@/lib/context/confetti-context";
import { Databuddy } from "@databuddy/sdk";

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
            enableBatching={true}
          />
        </ConfettiProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
      <Toaster richColors />
    </ThemeProvider>
  );
}
