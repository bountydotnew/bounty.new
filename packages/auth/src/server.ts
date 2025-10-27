import {
  account,
  betaApplication,
  bounty,
  bountyApplication,
  bountyBookmark,
  bountyComment,
  bountyCommentLike,
  bountyVote,
  db,
  deviceCode,
  invite,
  notification,
  passkey,
  session,
  submission,
  user as userTable,
  userProfile,
  userRating,
  userReputation,
  verification,
  waitlist,
} from "@bounty/db";
import { env } from "@bounty/env/server";
import type { PolarError } from "@bounty/types";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer, deviceAuthorization, lastLoginMethod, openAPI } from "better-auth/plugins";
import { admin } from "better-auth/plugins/admin";
import { passkey as passkeyPlugin } from "better-auth/plugins/passkey";
import { emailOTP } from "better-auth/plugins/email-otp";
import { sendEmail } from "@bounty/email";
import { OTPVerification } from "@bounty/email";

const schema = {
  account,
  betaApplication,
  bounty,
  bountyApplication,
  bountyBookmark,
  bountyComment,
  bountyCommentLike,
  bountyVote,
  deviceCode,
  invite,
  notification,
  passkey,
  session,
  submission,
  user: userTable,
  userProfile,
  userRating,
  userReputation,
  verification,
  waitlist,
};

const polarEnv = env.NODE_ENV === "production" ? "production" : "sandbox";
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: polarEnv,
});

const allowedDeviceClientIds = env.DEVICE_AUTH_ALLOWED_CLIENT_IDS?.split(",")
  .map((clientId) => clientId.trim())
  .filter(Boolean);

const deviceAuthorizationPlugin = deviceAuthorization({
  expiresIn: '30m',
  interval: '5s',
  validateClient: (clientId) =>
    allowedDeviceClientIds?.length ? allowedDeviceClientIds.includes(clientId) : true,
  onDeviceAuthRequest: (clientId, scope) => {
    console.info('Device authorization requested', { clientId, scope });
  },
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: false,
  }),
  onAPIError: {
    throw: true,
    onError: (_error) => {
      // Custom error handling
      // Errors are thrown due to throw: true flag above
      // Add proper error logging/monitoring here if needed
    },
    errorURL: "/auth/error",
  },
  trustedOrigins: [
    "https://bounty.new",
    "https://www.bounty.new",
    "https://*.vercel.app",
    "http://localhost:3001",
    "http://localhost:3000",
    "https://preview.bounty.new",
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
        await Promise.resolve();
        return {
          metadata: { userId: user.id || "unknown" },
        };
      },
      onCustomerCreateError: async ({ error }: { error: unknown }) => {
        await Promise.resolve();
        const e = error as PolarError;
        const msg = String(e?.message || e?.body$ || e?.detail || "");
        if (
          e?.status === 409 ||
          msg.includes("external ID cannot be updated") ||
          msg.toLowerCase().includes("external_id cannot be updated") ||
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
              slug: "pro-annual",
            },
            {
              productId: env.BOUNTY_PRO_MONTHLY_ID,
              slug: "pro-monthly",
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
          onOrderPaid: () => Promise.resolve(),
          onSubscriptionActive: () => Promise.resolve(),
          onPayload: (_payload) => {
            return Promise.resolve();
          },
        }),
      ],
    }),
    passkeyPlugin({
      rpID: env.NODE_ENV === "production" ? "bounty.new" : "localhost",
      rpName: "Bounty.new",
      origin:
        env.NODE_ENV === "production"
          ? "https://bounty.new"
          : "http://localhost:3000",
    }),
    admin(),
    bearer(),
    openAPI(),
    lastLoginMethod({
      storeInDatabase: true,
    }),
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          const result = await sendEmail({
            from: 'Bounty.new <noreply@mail.bounty.new>',
            to: email,
            subject: type === 'email-verification' 
              ? 'Verify your email address'
              : type === 'sign-in'
              ? 'Sign in to Bounty.new'
              : 'Reset your password',
            react: OTPVerification({
              code: otp,
              email,
              type,
              continueUrl: `${env.NODE_ENV === 'production' ? 'https://bounty.new' : 'http://localhost:3000'}/sign-up/verify-email-address?email=${encodeURIComponent(email)}`,
            }),
          });

          if (result.error) {
            console.error('❌ Failed to send OTP email:', result.error);
            throw new Error(`Email send failed: ${result.error.message}`);
          }

          console.log('✅ OTP email sent successfully:', result.data?.id);
        } catch (error) {
          console.error('❌ Error in sendVerificationOTP:', error);
          throw error;
        }
      },
    }),
    deviceAuthorizationPlugin,
  ],
  secret: env.BETTER_AUTH_SECRET,
});
