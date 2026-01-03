import Stripe from "stripe";
import { env } from "@bounty/env/server";

let _stripeClient: Stripe | null = null;

function getStripeClient(): Stripe {
  if (!_stripeClient) {
    const apiKey = env.STRIPE_SECRET_KEY;
    if (!apiKey) {
      throw new Error("STRIPE_SECRET_KEY is required but not provided. Please set it in your environment variables.");
    }
    _stripeClient = new Stripe(apiKey, {
      apiVersion: "2025-02-24.acacia",
    });
  }
  return _stripeClient;
}

// Create a recursive proxy that handles nested property access
function createProxy(target: any): any {
  return new Proxy(target, {
    get(_target, prop) {
      const value = target[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }
      if (value && typeof value === 'object') {
        return createProxy(value);
      }
      return value;
    },
  });
}

export const stripeClient = new Proxy({} as Stripe, {
  get(_target, prop) {
    const client = getStripeClient();
    const value = client[prop as keyof Stripe];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    if (value && typeof value === 'object') {
      return createProxy(value);
    }
    return value;
  },
});
