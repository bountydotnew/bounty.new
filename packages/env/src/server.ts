import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod/v4';

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
    // Rate limiting
    UNKEY_ROOT_KEY: z.string().min(1),
    // Discord webhook
    DISCORD_WEBHOOK_URL: z.string().url().optional(),
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
  },
  experimental__runtimeEnv: process.env,
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION || process.env.NODE_ENV === 'test',
});
