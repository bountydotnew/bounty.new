import { stripeClient } from "./client";
import type Stripe from "stripe";

/**
 * Parse a thin event from Stripe V2 API
 * Thin events are used for V2 account updates
 */
export function parseThinEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
}

/**
 * Construct a standard webhook event
 * Used for payment_intent, checkout, transfer events
 */
export function constructEvent(
  body: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
}

/**
 * Retrieve a full event from a thin event ID
 * Used when processing thin events to get full event data
 */
export async function retrieveEvent(eventId: string) {
  return await stripeClient.v2.core.events.retrieve(eventId);
}
