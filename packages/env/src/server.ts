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
    // GOOGLE_CLIENT_ID: z.string().min(1),
    // GOOGLE_CLIENT_SECRET: z.string().min(1),
    // Rate limiting
    UNKEY_ROOT_KEY: z.string().min(1),
    // Discord webhook
    DISCORD_WEBHOOK_URL: z.string().url().optional(),
    // Discord bot
    DISCORD_BOT_TOKEN: z.string().min(1),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    // Polar
    POLAR_ACCESS_TOKEN: z.string().min(1),
    BOUNTY_PRO_ANNUAL_ID: z.string().min(1),
    BOUNTY_PRO_MONTHLY_ID: z.string().min(1),
    POLAR_SUCCESS_URL: z.string().url(),
    POLAR_WEBHOOK_SECRET: z.string().min(1),
    RESEND_API_KEY: z.string().min(1),
    DEVICE_AUTH_ALLOWED_CLIENT_IDS: z.string().optional().default(''),
    // Upstash Redis
    UPSTASH_REDIS_REST_URL: z.string().url(),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    // Cron jobs
    CRON_SECRET: z.string().min(16).optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET,
    // GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    // GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    UNKEY_ROOT_KEY: process.env.UNKEY_ROOT_KEY,
    DISCORD_WEBHOOK_URL: process.env.DISCORD_WEBHOOK_URL,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    POLAR_ACCESS_TOKEN: process.env.POLAR_ACCESS_TOKEN,
    BOUNTY_PRO_ANNUAL_ID: process.env.BOUNTY_PRO_ANNUAL_ID,
    BOUNTY_PRO_MONTHLY_ID: process.env.BOUNTY_PRO_MONTHLY_ID,
    POLAR_SUCCESS_URL: process.env.POLAR_SUCCESS_URL,
    POLAR_WEBHOOK_SECRET: process.env.POLAR_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    DEVICE_AUTH_ALLOWED_CLIENT_IDS: process.env.DEVICE_AUTH_ALLOWED_CLIENT_IDS,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
  },
  skipValidation: process.env.NODE_ENV !== 'production',
});
