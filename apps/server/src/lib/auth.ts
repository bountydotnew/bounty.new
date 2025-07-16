import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db";
import * as schema from "../db/schema/auth";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
    usePlural: false,
  }),
  trustedOrigins: [
    process.env.CORS_ORIGIN || "",
    "https://bounty.new",
    "https://www.bounty.new",
    "https://*.vercel.app",
    "http://localhost:3001",
    "https://preview.bounty.new",
    "http://192.168.1.147:3001"
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
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});



