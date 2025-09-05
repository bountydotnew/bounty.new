import * as schema from '@bounty/db';
import { db } from '@bounty/db';
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

const polarEnv =
  process.env.NODE_ENV === 'production' ? 'production' : 'sandbox';
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: polarEnv,
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
    usePlural: false,
  }),
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
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
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
        const externalId = user.id;
        try {
          const _found = await polarClient.customers.getExternal({
            externalId,
          });
          return null as any;
        } catch (err) {
          const e = err as {
            status?: number;
            message?: string;
            body$?: string;
            detail?: string;
          };
          const msg = String(e?.message || e?.body$ || e?.detail || '');
          if (e?.status === 404) {
          } else if (
            e?.status === 409 ||
            msg.includes('external ID cannot be updated') ||
            msg.toLowerCase().includes('external_id cannot be updated')
          ) {
            return null as any;
          } else {
          }
        }
        return {
          external_id: externalId,
          email: user.email,
          name: user.name || user.email,
          metadata: { userId: externalId },
        } as any;
      },
      onCustomerCreateError: async ({ error }: { error: unknown }) => {
        const e = error as {
          status?: number;
          message?: string;
          body$?: string;
          detail?: string;
        };
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
          secret: process.env.POLAR_WEBHOOK_SECRET!,
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
  secret: process.env.BETTER_AUTH_SECRET,
});
