import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: 'https://4a48fe74894a0f7b744f4652df0fd570@o4510390840000512.ingest.us.sentry.io/4510390840721408',
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Set tracesSampleRate to 1.0 to capture 100% of transactions for tracing.
  // Adjust this value in production as necessary.
  tracesSampleRate: 0.1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,

  replaysOnErrorSampleRate: 1.0,

  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // You can remove this option if you're not planning to use the Sentry Session Replay feature:
  integrations: [
    Sentry.replayIntegration({
      // Additional SDK configuration goes in here, for example:
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Filter out errors we don't care about
  beforeSend(event, hint) {
    // Don't send errors from localhost/development
    if (
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.includes('local'))
    ) {
      return null;
    }

    const error = hint.originalException;

    // Filter out network errors that are temporary
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      if (
        message.includes('Failed to fetch') ||
        message.includes('NetworkError') ||
        message.includes('Load failed')
      ) {
        return null;
      }
    }

    return event;
  },

  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || 'development',
});
