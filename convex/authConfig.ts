
/**
 * Better Auth server configuration for Convex.
 *
 * This file defines the `createAuth` function that configures Better Auth
 * with all providers, plugins, and settings. It's used by the HTTP router
 * to handle auth requests.
 */
import { betterAuth } from 'better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import {
  admin,
  bearer,
  openAPI,
  organization,
  emailOTP,
  multiSession,
} from 'better-auth/plugins';
import type { CreateAuth } from '@convex-dev/better-auth';
import type { DataModel } from './_generated/dataModel';
import { authComponent } from './auth';

/**
 * Creates a Better Auth instance configured for bounty.new.
 *
 * This is called by the HTTP router when processing auth requests.
 * The adapter bridges Better Auth with the Convex database.
 */
export const createAuth: CreateAuth<DataModel> = (ctx) => {
  return betterAuth({
    database: authComponent.adapter(ctx),

    // -----------------------------------------------------------------------
    // Email/Password auth
    // -----------------------------------------------------------------------
    emailAndPassword: {
      enabled: true,
    },

    // -----------------------------------------------------------------------
    // Email verification
    // -----------------------------------------------------------------------
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        // TODO: Send verification email via Resend component
        console.log(`[Auth] Verification email for ${user.email}: ${url}`);
      },
    },

    // -----------------------------------------------------------------------
    // Social providers
    // -----------------------------------------------------------------------
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        scope: ['read:user', 'public_repo', 'read:org'],
        mapProfileToUser: (profile) => ({
          username: profile.login?.toLowerCase(),
        }),
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        scope: ['openid', 'email', 'profile'],
      },
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        scope: ['identify', 'email', 'guilds'],
      },
    },

    // -----------------------------------------------------------------------
    // Account linking
    // -----------------------------------------------------------------------
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['github', 'google', 'discord'],
        allowDifferentEmails: true,
      },
    },

    // -----------------------------------------------------------------------
    // Session config
    // -----------------------------------------------------------------------
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 5, // 5 minutes
    },

    // -----------------------------------------------------------------------
    // Rate limiting
    // -----------------------------------------------------------------------
    rateLimit: {
      storage: 'database',
      window: 60,
      max: 100,
      customRules: {
        '/sign-in/email': { window: 10, max: 5 },
        '/sign-up/email': { window: 60, max: 5 },
        '/forget-password': { window: 60, max: 3 },
        '/email-otp/*': { window: 10, max: 3 },
      },
    },

    // -----------------------------------------------------------------------
    // Plugins
    // -----------------------------------------------------------------------
    plugins: [
      admin(),
      bearer(),
      openAPI(),
      organization(),
      emailOTP({
        sendVerificationOTP: async ({ email, otp }) => {
          // TODO: Send OTP via Resend component
          console.log(`[Auth] OTP for ${email}: ${otp}`);
        },
      }),
      multiSession({ maximumSessions: 5 }),
      // Convex plugin for JWT-based auth in Convex functions
      convex({
        authConfig: {
          providers: [
            {
              applicationID: 'convex',
              domain: process.env.CONVEX_SITE_URL ?? '',
            },
          ],
        },
      }),
    ],
  });
};
