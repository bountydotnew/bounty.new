import { createResendClient } from "./client";
import type { SubscribeInput, UnsubscribeInput } from "./types";

export async function subscribeToAudience(input: SubscribeInput) {
  const resend = createResendClient();
  const res = await resend.contacts.create({
    email: input.email,
    audienceId: input.audience,
    firstName: input.firstName,
    lastName: input.lastName,
    unsubscribed: false,

    /**
     readonly apiKeys: ApiKeys;
    readonly audiences: Audiences;
    readonly batch: Batch;
    readonly broadcasts: Broadcasts;
    readonly contacts: Contacts;
    readonly domains: Domains;
    readonly emails: Emails; 
     */
  });
  return res;
}

export async function unsubscribeFromAudience(input: UnsubscribeInput) {
  const resend = createResendClient();
  const res = await resend.contacts.remove({
    email: input.email,
    audienceId: input.audience,
  });
  return res;
}


