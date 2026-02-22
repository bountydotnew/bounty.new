/**
 * Resend Webhook Verification
 *
 * Verifies inbound Resend webhook signatures using the SDK's built-in
 * Svix verification. All Resend webhooks include Svix headers:
 * - svix-id
 * - svix-timestamp
 * - svix-signature
 *
 * Docs: https://resend.com/docs/webhooks/verify-webhooks-requests
 */

import { createResendClient } from './client';

// Re-export the SDK's webhook event types for consumers
export type {
  EmailReceivedEvent,
  WebhookEventPayload,
} from 'resend';

export interface VerifyWebhookInput {
  /** Raw request body as string */
  payload: string;
  /** Svix headers from the request */
  svixId: string;
  svixTimestamp: string;
  svixSignature: string;
  /** Webhook signing secret from Resend dashboard */
  webhookSecret: string;
}

/**
 * Verify a Resend webhook request using Svix signature verification.
 *
 * @throws Error if the webhook signature is invalid
 * @returns The parsed and verified webhook payload
 */
export function verifyResendWebhook(input: VerifyWebhookInput) {
  const resend = createResendClient();

  // resend.webhooks.verify() throws if invalid, returns parsed payload on success
  return resend.webhooks.verify({
    payload: input.payload,
    headers: {
      id: input.svixId,
      timestamp: input.svixTimestamp,
      signature: input.svixSignature,
    },
    webhookSecret: input.webhookSecret,
  });
}
