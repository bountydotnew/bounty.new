// app/error.jsx
'use client';

import { Button } from '@bounty/ui/components/button';
import Link from '@bounty/ui/components/link';
import { AlertTriangle, Copy, Home, RefreshCw } from 'lucide-react';
import posthog from 'posthog-js';
import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => {
    posthog.captureException(error);
  }, [error]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 px-4">
      <div className="absolute inset-0 bg-[size:50px_50px] bg-grid-white/[0.02]" />
      <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-96 w-96 animate-pulse rounded-full bg-destructive/5 blur-3xl delay-1000" />

      <div className="relative z-10 w-full max-w-lg space-y-8 text-center">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text font-bold text-3xl text-transparent">
              Oops! Something went wrong
            </h1>
          </div>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Don&apos;t worry, we&apos;ve been notified and our team is looking
            into it.
            <br />
            You can try again or head back to safety.
          </p>
        </div>

        <div className="flex flex-col justify-center gap-4 sm:flex-row">
          <Button
            className="flex transform items-center gap-2 bg-gradient-to-r from-primary to-primary/90 shadow-lg transition-all duration-200 hover:scale-105 hover:from-primary/90 hover:to-primary hover:shadow-xl"
            onClick={() => reset()}
            size="lg"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>

          <Button
            asChild
            className="flex transform items-center gap-2 border-border/50 backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:border-border hover:bg-muted/50"
            size="lg"
            variant="outline"
          >
            <Link href="/">
              <Home className="h-4 w-4" />
              Go home
            </Link>
          </Button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="space-y-4">
            <details className="rounded-lg border border-border/50 bg-muted/30 p-4 text-left backdrop-blur-sm">
              <summary className="flex cursor-pointer items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground">
                <AlertTriangle className="h-4 w-4" />
                Error details (copy and paste this if asked)
              </summary>
              <pre className="mt-4 overflow-auto rounded-md border border-border/30 bg-background/50 p-4 font-mono text-muted-foreground text-xs">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
            <Button
              className="flex items-center gap-2 text-xs"
              onClick={() => {
                navigator.clipboard.writeText(
                  `${error.message}\n\n${error.stack}`
                );
              }}
              variant="outline"
            >
              <Copy className="h-3 w-3" />
              Copy error
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
