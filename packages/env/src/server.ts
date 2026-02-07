import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z
      .string()
      .refine(
        (url) =>
          url.startsWith('postgresql://') || url.startsWith('postgres://'),
        {
          message: 'DATABASE_URL must start with postgresql:// or postgres://',
        }
      ),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    GITHUB_TOKEN: z.string().min(1),
    // GitHub OAuth
    GITHUB_CLIENT_ID: z.string().min(1),
    GITHUB_CLIENT_SECRET: z.string().min(1),
    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1).optional(),
    GOOGLE_CLIENT_SECRET: z.string().min(1).optional(),
    // Rate limiting
    // Discord webhook
    DISCORD_WEBHOOK_URL: z.string().url().optional(),
    // Bounty feed webhooks (for Discord channel notifications)
    BOUNTY_FEED_WEBHOOK_URL: z.string().url().optional(),
    BOUNTY_FUNDED_WEBHOOK_URL: z.string().url().optional(),
    BOUNTY_UNFUNDED_WEBHOOK_URL: z.string().url().optional(),
    // Marble CMS webhook
    MARBLE_WEBHOOK_SECRET: z.string().min(1).optional(),
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Autumn billing
    AUTUMN_API_URL: z.string().url().optional(),
    AUTUMN_SECRET_KEY: z.string().min(1),
    // Stripe
    STRIPE_SECRET_KEY: z.string().min(1),
    STRIPE_PUBLISHABLE_KEY: z.string().min(1),
    STRIPE_CONNECT_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    RESEND_WEBHOOK_SECRET: z.string().min(1).optional(),
    DEVICE_AUTH_ALLOWED_CLIENT_IDS: z.string().optional().default(''),
    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    // Cron jobs
    CRON_SECRET: z.string().min(16).optional(),
    // Discord OAuth
    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    // Linear OAuth
    LINEAR_CLIENT_ID: z.string().min(1).optional(),
    LINEAR_CLIENT_SECRET: z.string().min(1).optional(),
    LINEAR_REDIRECT_URI: z.string().url().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    BOUNTY_FEED_WEBHOOK_URL: process.env.BOUNTY_FEED_WEBHOOK_URL,
    BOUNTY_FUNDED_WEBHOOK_URL: process.env.BOUNTY_FUNDED_WEBHOOK_URL,
    BOUNTY_UNFUNDED_WEBHOOK_URL: process.env.BOUNTY_UNFUNDED_WEBHOOK_URL,
    MARBLE_WEBHOOK_SECRET: process.env.MARBLE_WEBHOOK_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    // Autumn billing
    AUTUMN_API_URL: process.env.AUTUMN_API_URL,
    AUTUMN_SECRET_KEY: process.env.AUTUMN_SECRET_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY,
    STRIPE_CONNECT_WEBHOOK_SECRET: process.env.STRIPE_CONNECT_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    DEVICE_AUTH_ALLOWED_CLIENT_IDS: process.env.DEVICE_AUTH_ALLOWED_CLIENT_IDS,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    // Discord
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    // Linear
    LINEAR_CLIENT_ID: process.env.LINEAR_CLIENT_ID,
    LINEAR_CLIENT_SECRET: process.env.LINEAR_CLIENT_SECRET,
    LINEAR_REDIRECT_URI: process.env.LINEAR_REDIRECT_URI,
  },
  skipValidation: process.env.NODE_ENV !== 'production',
});
