import { createEvlog } from 'evlog/next'
import { createSentryDrain } from 'evlog/sentry'

export const { withEvlog, useLogger, log, createError } = createEvlog({
  service: 'bounty',
  drain: createSentryDrain({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  }),
  routes: {
    '/api/webhooks/stripe/**': { service: 'stripe-webhooks' },
    '/api/webhooks/github/**': { service: 'github-webhooks' },
    '/api/webhooks/resend/**': { service: 'resend-webhooks' },
    '/api/auth/**': { service: 'auth' },
    '/api/trpc/**': { service: 'api' },
    '/api/cron/**': { service: 'cron' },
  },
})
