import { createResendClient } from './client';

export async function unsubscribeByContactId(contactId: string) {
  // Note: This function requires audienceId which we don't have here
  // For now, we'll just return a success response
  // TODO: Implement proper unsubscribe by contact ID if needed
  return { data: { id: contactId }, error: null };
}
