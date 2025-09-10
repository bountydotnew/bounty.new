import { createResendClient } from "./client";

export async function unsubscribeByContactId(contactId: string) {
  const resend = createResendClient();
  const res = await resend.contacts.update(contactId, { unsubscribed: true });
  return res;
}


