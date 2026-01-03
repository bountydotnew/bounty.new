'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@bounty/ui/components/button';
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              textAlign: 'center',
              padding: '40px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>
              Something went wrong!
            </h2>
            <p style={{ color: '#6b7280', marginBottom: '24px' }}>
              We apologize for the inconvenience. Our team has been notified.
            </p>
            <Button
              onClick={reset}
              style={{
                padding: '10px 20px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Try again
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
