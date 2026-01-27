import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

/**
 * Environment variables specifically for the Discord bot
 * This includes only the variables needed by the Discord bot app
 */
export const discordBotEnv = createEnv({
  server: {
    // Database - required because Discord bot uses @bounty/db and @bounty/api
    DATABASE_URL: z
      .string()
      .refine(
        (url) =>
          url.startsWith('postgresql://') || url.startsWith('postgres://'),
        {
          message: 'DATABASE_URL must start with postgresql:// or postgres://',
        }
      ),
    // Discord bot credentials - optional during build, validated at runtime when used
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),
    DISCORD_CLIENT_ID: z.string().min(1).optional(),
    DISCORD_CLIENT_SECRET: z.string().min(1).optional(),
    // Better Auth - required for API calls
    BETTER_AUTH_URL: z.string().url('BETTER_AUTH_URL must be a valid URL'),
    BETTER_AUTH_SECRET: z.string().min(1, 'BETTER_AUTH_SECRET is required'),
    // Dev mode - restrict bot to only allow commands from a specific user
    DEV_MODE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((val) => val === 'true'),
    DEV_USER_ID: z.string().min(1).optional(),
    // Node environment
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN,
    DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID,
    DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    DEV_MODE: process.env.DEV_MODE,
    DEV_USER_ID: process.env.DEV_USER_ID,
    NODE_ENV: process.env.NODE_ENV,
  },
  // Skip validation - we validate Discord env vars at runtime when they're actually used
  // This allows web builds to succeed without Discord env vars
  skipValidation: true,
});
