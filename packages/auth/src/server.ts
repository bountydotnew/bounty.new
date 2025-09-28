import * as schema from '@bounty/db';
import { db } from '@bounty/db';
import { env } from '@bounty/env/server';
import type { PolarError } from '@bounty/types';
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
import { emailOTP } from 'better-auth/plugins/email-otp';

const polarEnv = env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: polarEnv,
});

const TRAILING_SLASH_RE = /\/$/;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
  onAPIError: {
    throw: true,
    onError: (error) => {
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
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignInAfterEmailVerification: true,
    requireEmailVerification: true,
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      getCustomerCreateParams: ({ user }) =>
        Promise.resolve({
          metadata: { userId: user.id || 'unknown' },
        }),
      onCustomerCreateError: ({ error }: { error: unknown }) => {
        const e = error as PolarError;
        const msg = e?.message || e?.body$ || String(error);
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
              productId: env.BOUNTY_PRO_ANNUAL_ID,
              slug: 'pro-annual',
            },
            {
              productId: env.BOUNTY_PRO_MONTHLY_ID,
              slug: 'pro-monthly',
            },
          ],
          successUrl: env.POLAR_SUCCESS_URL,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: env.POLAR_WEBHOOK_SECRET,
          onCustomerStateChanged: (_payload) => {
            return Promise.resolve();
          },
          onOrderPaid: (_payload) => Promise.resolve(),
          onSubscriptionActive: (_payload) => Promise.resolve(),
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
    // Enable 6-digit code (OTP) email verification endpoints
    emailOTP({
      // Use OTP instead of link for default email verification flow
      overrideDefaultEmailVerification: true,
      // Automatically send OTP on sign up (server-driven)
      sendVerificationOnSignUp: true,
      // Send the 6-digit OTP via email
      sendVerificationOTP: async ({ email, otp, type }) => {
        const { sendEmail, EmailTemplates } = await import('@bounty/email');
        const subject =
          type === 'email-verification'
            ? `${otp} is your verification code.`
            : type === 'sign-in'
              ? `${otp} is your sign-in code.`
              : `${otp} is your password reset code.`;

        // Build a direct "Continue" link that pre-fills the code on the verify page
        const baseUrl = env.BETTER_AUTH_URL.replace(TRAILING_SLASH_RE, '');
        const verifyUrl = `${baseUrl}/sign-up/verify-email-address?email=${encodeURIComponent(
          email,
        )}&redirect_url=${encodeURIComponent('/login')}&code=${encodeURIComponent(otp)}`;

        await sendEmail({
          to: email,
          from: 'notifications@mail.bounty.new',
          subject,
          react: EmailTemplates.OTPVerification({
            code: otp,
            email,
            type,
            continueUrl: verifyUrl,
          }),
          text: `Your Bounty.new ${type.replace('-', ' ')} code is ${otp}. It expires shortly. Continue: ${verifyUrl}`,
        });
      },
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
});
