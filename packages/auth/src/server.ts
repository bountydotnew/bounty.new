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
} from '@bounty/db';
import { eq } from 'drizzle-orm';
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
import {
  bearer,
  deviceAuthorization,
  lastLoginMethod,
  openAPI,
  multiSession,
} from 'better-auth/plugins';
import { admin } from 'better-auth/plugins/admin';
import { passkey as passkeyPlugin } from 'better-auth/plugins/passkey';
import { emailOTP } from 'better-auth/plugins/email-otp';
import { sendEmail } from '@bounty/email';
import { OTPVerification, ForgotPassword } from '@bounty/email';
import { GithubManager } from '@bounty/api/driver/github';

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

const polarEnv = env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const polarClient = new Polar({
  accessToken: env.POLAR_ACCESS_TOKEN,
  server: polarEnv,
});

const allowedDeviceClientIds = env.DEVICE_AUTH_ALLOWED_CLIENT_IDS?.split(',')
  .map((clientId) => clientId.trim())
  .filter(Boolean);

const deviceAuthorizationPlugin = deviceAuthorization({
  expiresIn: '30m',
  interval: '5s',
  validateClient: (clientId) =>
    allowedDeviceClientIds?.length
      ? allowedDeviceClientIds.includes(clientId)
      : true,
  onDeviceAuthRequest: () => {
    // Device authorization requested
  },
});

async function syncGitHubHandle(
  userId: string,
  accessToken: string
): Promise<void> {
  if (!(userId && accessToken)) {
    return;
  }

  const existingUser = await db.query.user.findFirst({
    where: (fields, { eq }) => eq(fields.id, userId),
  });

  if (existingUser?.handle) {
    return;
  }

  try {
    const github = new GithubManager({ token: accessToken });
    const githubUser = await github.getAuthenticatedUser();

    if (githubUser?.login) {
      await db
        .update(userTable)
        .set({
          handle: githubUser.login.toLowerCase(),
          updatedAt: new Date(),
        })
        .where(eq(userTable.id, userId));
    }
  } catch (_error) {
    // Silently handle errors - don't block account creation/update
  }
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
  databaseHooks: {
    account: {
      create: {
        after: async (accountData: any) => {
          if (
            accountData.providerId === 'github' &&
            accountData.userId &&
            accountData.accessToken
          ) {
            await syncGitHubHandle(accountData.userId, accountData.accessToken);
          }
        },
      },
      update: {
        after: async (accountData: any) => {
          if (
            accountData.providerId === 'github' &&
            accountData.userId &&
            accountData.accessToken
          ) {
            await syncGitHubHandle(accountData.userId, accountData.accessToken);
          }
        },
      },
    },
  },
  onAPIError: {
    throw: true,
    onError: () => {},
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
      scope: ['read:user', 'repo', 'read:org'],
      mapProfileToUser: (profile) => {
        return {
          handle: profile.login?.toLowerCase(),
        };
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        const result = await sendEmail({
          from: 'Bounty.new <noreply@mail.bounty.new>',
          to: user.email,
          subject: 'Reset your password',
          react: ForgotPassword({
            userName: user.name,
            resetUrl: url,
          }),
        });

        if (result.error) {
          console.error(
            '❌ Failed to send password reset email:',
            result.error
          );
          throw new Error(`Email send failed: ${result.error.message}`);
        }

        console.log(
          '✅ Password reset email sent successfully:',
          result.data?.id
        );
      } catch (error) {
        console.error('❌ Error in sendResetPassword:', error);
        throw error;
      }
    },
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: false,
      getCustomerCreateParams: async ({ user }) => {
        await Promise.resolve();
        return {
          metadata: { userId: user.id || 'unknown' },
        };
      },
      onCustomerCreateError: async ({ error }: { error: unknown }) => {
        await Promise.resolve();
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
          onOrderPaid: () => Promise.resolve(),
          onSubscriptionActive: () => Promise.resolve(),
          onPayload: (_payload) => {
            return Promise.resolve();
          },
        }),
      ],
    }),
    passkeyPlugin({
      rpID: env.NODE_ENV === 'production' ? 'bounty.new' : 'localhost',
      rpName: 'Bounty.new',
      origin:
        env.NODE_ENV === 'production'
          ? 'https://bounty.new'
          : 'http://localhost:3000',
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
            subject:
              type === 'email-verification'
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
    multiSession({
      maximumSessions: 5,
    }),
  ],
  secret: env.BETTER_AUTH_SECRET,
});
