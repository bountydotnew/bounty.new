import * as schema from '@bounty/db';
import { db } from '@bounty/db';
import { env } from '@bounty/env/server';
import type { PolarCustomerCreateParams, PolarError } from '@bounty/types';
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from '@polar-sh/better-auth';
import { Polar } from '@polar-sh/sdk';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins/admin';
import { passkey } from 'better-auth/plugins/passkey';

const polarEnv = env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: polarEnv,
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
  onAPIError: {
    throw: true,
    onError: (error, ctx) => {
      // Custom error handling
      console.error('Auth error:', error);
    },
    errorURL: '/auth/error',
  },
  trustedOrigins: [
    'https://bounty.new',
    'https://www.bounty.new',
    'https://*.vercel.app',
    'http://localhost:3001',
    'http://localhost:3000',
    'https://preview.bounty.new',
  ].filter(Boolean),
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      getCustomerCreateParams: async ({ user }) => {
        return {
          metadata: { userId: user.id || 'unknown' },
        };
      },
      onCustomerCreateError: async ({ error }: { error: unknown }) => {
        const e = error as PolarError;
        const msg = String(e?.message || e?.body$ || e?.detail || '');
        if (
          e?.status === 409 ||
          msg.includes('external ID cannot be updated') ||
          msg.toLowerCase().includes('external_id cannot be updated') ||
          msg.includes('"error":"PolarRequestValidationError"')
        ) {
          return;
        }
        throw error as Error;
      },
      use: [
        checkout({
          products: [
            {
              productId: process.env.BOUNTY_PRO_ANNUAL_ID!,
              slug: 'pro-annual',
            },
            {
              productId: process.env.BOUNTY_PRO_MONTHLY_ID!,
              slug: 'pro-monthly',
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL!,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onCustomerStateChanged: (_payload) => {
            return Promise.resolve();
          },
          onOrderPaid: async (_payload) => {
            try {
            } catch (_error) {}

            return Promise.resolve();
          },
          onSubscriptionActive: async (_payload) => {
            try {
            } catch (_error) {}

            return Promise.resolve();
          },
          onPayload: (_payload) => {
            return Promise.resolve();
          },
        }),
      ],
    }),
    passkey({
      rpID: process.env.NODE_ENV === 'production' ? 'bounty.new' : 'localhost',
      rpName: 'Bounty.new',
      origin:
        process.env.NODE_ENV === 'production'
          ? 'https://bounty.new'
          : 'http://localhost:3000',
    }),
    admin(),
  ],
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token, type }) => {
      const baseUrl = env.NODE_ENV === 'production'
        ? 'https://bounty.new'
        : 'http://localhost:3001';

      // Branch the verify path and redirect target based on OTP type
      let verifierPath: string;
      let redirectUrl: string;

      switch (type) {
        case 'sign-up':
          verifierPath = '/sign-up/verify-email-address';
          redirectUrl = '/dashboard';
          break;
        // TODO: Implement other OTP types
        // case 'sign-in':
        //   verifierPath = '/sign-in/verify-email';
        //   redirectUrl = '/dashboard';
        //   break;
        // case 'password-reset':
        //   verifierPath = '/reset-password/verify';
        //   redirectUrl = '/login';
        //   break;
        default:
          verifierPath = '/sign-up/verify-email-address';
          redirectUrl = '/dashboard';
      }

      // Build the final verify URL with proper encoding
      const verifyUrl = `${baseUrl}${verifierPath}?${new URLSearchParams({
        email: encodeURIComponent(user.email),
        code: encodeURIComponent(token),
        redirect_url: encodeURIComponent(redirectUrl)
      }).toString()}`;

      // TODO: Implement actual email sending
      // For now, just log the email content
      console.log(`
        Email Verification for ${user.email}
        Type: ${type}
        Verify URL: ${verifyUrl}

        React template continueUrl: ${verifyUrl}
        Plain text link: ${verifyUrl}
      `);

      return Promise.resolve();
    },
  },
  secret: env.BETTER_AUTH_SECRET,
});
