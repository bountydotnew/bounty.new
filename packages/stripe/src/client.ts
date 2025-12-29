import Stripe from "stripe";
import { env } from "@bounty/env/server";

export const stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-12-15.clover",
});
