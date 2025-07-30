import { betterAuth } from "better-auth";
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

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: process.env.NODE_ENV === "production" ? "production" : "sandbox",
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
      createCustomerOnSignUp: true,
      getCustomerCreateParams: async ({ user }) => ({
        email: user.email,
        name: user.name || user.email,
        metadata: {
          userId: user.id,
        },
      }),
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
              // Log the full payload for debugging
              console.log("Order paid payload:", JSON.stringify(payload, null, 2));
              
              // The webhook ensures the user's subscription is now active
              // This happens server-side regardless of whether they visit the success page
              console.log("User subscription activated via webhook");
              
              // You could also:
              // - Send welcome email
              // - Update user profile
              // - Grant access to Pro features
              // - Send analytics event
            } catch (error) {
              console.error("Error handling order paid webhook:", error);
            }
            
            return Promise.resolve();
          },
          onSubscriptionActive: async (payload) => {
            console.log("Subscription active:", payload);
            
            try {
              // Log the full payload for debugging
              console.log("Subscription active payload:", JSON.stringify(payload, null, 2));
              
              console.log("User subscription is now active");
              // Additional subscription activation logic
            } catch (error) {
              console.error("Error handling subscription active webhook:", error);
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
  ],
  secret: process.env.BETTER_AUTH_SECRET,
});
