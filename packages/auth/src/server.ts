import { betterAuth } from "better-auth";
import { passkey } from "better-auth/plugins/passkey";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@bounty/db";
import * as schema from "@bounty/db";
import {
  polar,
  checkout,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";

import { Polar } from "@polar-sh/sdk";

const polarEnv =
  process.env.NODE_ENV === "production" ? "production" : "sandbox";
const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
  server: polarEnv,
});

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: false,
  }),
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
          const found = await polarClient.customers.getExternal({ externalId });
          console.log(
            `[polar:getCustomerCreateParams] env=${polarEnv} externalId=${externalId} found=${!!found}`,
          );
          return null as any;
        } catch (err) {
          const e = err as {
            status?: number;
            message?: string;
            body$?: string;
            detail?: string;
          };
          const msg = String(e?.message || e?.body$ || e?.detail || "");
          if (e?.status === 404) {
            console.log(
              `[polar:getCustomerCreateParams] env=${polarEnv} externalId=${externalId} not_found->create`,
            );
          } else if (
            e?.status === 409 ||
            msg.includes("external ID cannot be updated") ||
            msg.toLowerCase().includes("external_id cannot be updated")
          ) {
            console.warn(
              `[polar:getCustomerCreateParams] env=${polarEnv} externalId=${externalId} conflict/immutable external_id -> skip`,
            );
            return null as any;
          } else {
            console.warn(
              `[polar:getCustomerCreateParams] env=${polarEnv} externalId=${externalId} unexpected_error=${e?.status} -> proceed to create`,
            );
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
        const msg = String(e?.message || e?.body$ || e?.detail || "");
        if (
          e?.status === 409 ||
          msg.includes("external ID cannot be updated") ||
          msg.toLowerCase().includes("external_id cannot be updated") ||
          msg.includes('"error":"PolarRequestValidationError"')
        ) {
          console.warn(
            `[polar:onCustomerCreateError] env=${polarEnv} swallow status=${e?.status}`,
          );
          return;
        }
        console.error(
          `[polar:onCustomerCreateError] env=${polarEnv} rethrow status=${e?.status}`,
        );
        throw error as Error;
      },
      use: [
        checkout({
          products: [
            {
              productId: process.env.BOUNTY_PRO_ANNUAL_ID!,
              slug: "pro-annual",
            },
            {
              productId: process.env.BOUNTY_PRO_MONTHLY_ID!,
              slug: "pro-monthly",
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL!,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret: process.env.POLAR_WEBHOOK_SECRET!,
          onCustomerStateChanged: (payload) => {
            console.log("Customer state changed:", payload);
            return Promise.resolve();
          },
          onOrderPaid: async (payload) => {
            console.log("Order paid:", payload);

            try {
              console.log(
                "Order paid payload:",
                JSON.stringify(payload, null, 2),
              );
              console.log("User subscription activated via webhook");
            } catch (error) {
              console.error("Error handling order paid webhook:", error);
            }

            return Promise.resolve();
          },
          onSubscriptionActive: async (payload) => {
            console.log("Subscription active:", payload);

            try {
              console.log(
                "Subscription active payload:",
                JSON.stringify(payload, null, 2),
              );
              console.log("User subscription is now active");
            } catch (error) {
              console.error(
                "Error handling subscription active webhook:",
                error,
              );
            }

            return Promise.resolve();
          },
          onPayload: (payload) => {
            console.log("Webhook payload:", payload);
            return Promise.resolve();
          },
        }),
      ],
    }),
    passkey({
      rpID: process.env.NODE_ENV === "production" ? "bounty.new" : "localhost",
      rpName: "Bounty.new",
      origin:
        process.env.NODE_ENV === "production"
          ? "https://bounty.new"
          : "http://localhost:3000",
    }),
  ],
  secret: process.env.BETTER_AUTH_SECRET,
});
