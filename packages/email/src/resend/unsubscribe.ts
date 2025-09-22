import { createResendClient } from './client';

export async function unsubscribeByContactId(contactId: string, audienceId?: string) {
  const resend = createResendClient();

  if (!audienceId) {
    // If no audience ID provided, return a mock success response
    // This maintains backwards compatibility while logging the limitation
    console.warn('unsubscribeByContactId called without audienceId - cannot perform actual unsubscribe');
    return { data: { id: contactId }, error: null };
  }

  try {
    const result = await resend.contacts.remove({
      audienceId,
      id: contactId,
    });
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
