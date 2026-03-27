import { createResendClient } from './client';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SentEmail {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string;
}

export interface ListSentEmailsResult {
  emails: SentEmail[];
  has_more: boolean;
}

/**
 * Fetch a list of sent emails from Resend.
 * Uses pagination to get all emails if needed.
 */
export async function listSentEmails(options?: {
  limit?: number;
}): Promise<ListSentEmailsResult> {
  const resend = createResendClient();
  const limit = options?.limit ?? 100;

  const { data, error } = await resend.emails.list();

  if (error) {
    throw new Error(`Failed to fetch sent emails: ${error.message}`);
  }

  return {
    emails: (data?.data ?? []) as SentEmail[],
    has_more: data?.data ? data.data.length >= limit : false,
  };
}

/**
 * Get a Set of email addresses that have received invite emails.
 * Filters by subject containing "invite" or "code".
 * Paginates through all emails (100 per page).
 */
export async function getInvitedEmails(): Promise<Set<string>> {
  const resend = createResendClient();
  const invitedEmails = new Set<string>();

  let lastId: string | undefined;

  // Paginate through all emails
  while (true) {
    const params: { limit: number; after?: string } = { limit: 100 };
    if (lastId) {
      params.after = lastId;
    }

    const { data, error } = await resend.emails.list(params);

    if (error) {
      console.error('[getInvitedEmails] Failed to fetch emails:', error);
      break;
    }

    const emails = data?.data ?? [];

    if (emails.length === 0) {
      break;
    }

    // Filter for invite-related emails by subject
    for (const email of emails) {
      const subject = (email.subject ?? '').toLowerCase();
      // Match invite code emails (sent by Better Auth's sendVerificationOTP)
      if (
        subject.includes('invite') ||
        subject.includes('code') ||
        subject.includes('verification')
      ) {
        // `to` can be a string or array
        const recipients = Array.isArray(email.to) ? email.to : [email.to];
        for (const recipient of recipients) {
          if (recipient) {
            invitedEmails.add(recipient.toLowerCase());
          }
        }
      }
    }

    // Get the last email ID for pagination
    lastId = emails[emails.length - 1]?.id;

    // If we got less than 100, we've reached the end
    if (emails.length < 100) {
      break;
    }

    // Rate limit: max 5 requests/sec
    await sleep(250);
  }

  return invitedEmails;
}
