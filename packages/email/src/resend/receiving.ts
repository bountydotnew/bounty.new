/**
 * Resend Email Receiving Helpers
 *
 * Wraps the Resend SDK's receiving APIs for fetching inbound email
 * content, attachments, and replying.
 *
 * Note: The `forward()` method is not available in resend ^6.1.0.
 * To forward emails, fetch the content with `getReceivedEmail()` and
 * send a new email with `sendEmail()` from this package.
 *
 * Docs:
 * - Get email content: https://resend.com/docs/dashboard/receiving/get-email-content
 * - Process attachments: https://resend.com/docs/dashboard/receiving/attachments
 * - Reply to emails: https://resend.com/docs/dashboard/receiving/reply-to-emails
 */

import { createResendClient } from './client';

// ============================================================================
// Types
// ============================================================================

export interface ReplyToEmailInput {
  to: string | string[];
  from: string;
  subject: string;
  /** The message_id of the email being replied to (for In-Reply-To header) */
  messageId: string;
  /** At least one of html or text must be provided */
  html?: string;
  text?: string;
  /** Previous message IDs in the thread for References header */
  previousMessageIds?: string[];
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Fetch the full content of a received email (HTML, text, headers, raw download).
 *
 * Webhook payloads only contain metadata — call this to get the actual body.
 */
export async function getReceivedEmail(emailId: string) {
  const resend = createResendClient();
  return resend.emails.receiving.get(emailId);
}

/**
 * List received emails.
 */
export async function listReceivedEmails() {
  const resend = createResendClient();
  return resend.emails.receiving.list();
}

/**
 * List attachments for a received email with download URLs.
 *
 * Download URLs expire after 1 hour. Call this again if expired.
 */
export async function getReceivedAttachments(emailId: string) {
  const resend = createResendClient();
  return resend.emails.receiving.attachments.list({ emailId });
}

/**
 * Reply to a received email in the same thread.
 *
 * Sets the `In-Reply-To` header to the original message ID so email clients
 * thread the reply correctly. For multi-reply threads, also sets the
 * `References` header.
 */
export async function replyToReceivedEmail(input: ReplyToEmailInput) {
  if (!(input.html || input.text)) {
    throw new Error(
      'replyToReceivedEmail requires at least one of html or text'
    );
  }

  const resend = createResendClient();

  const headers: Record<string, string> = {
    'In-Reply-To': input.messageId,
  };

  // For multi-reply threads, set References header
  if (input.previousMessageIds?.length) {
    headers['References'] = [...input.previousMessageIds, input.messageId].join(
      ' '
    );
  }

  const to = Array.isArray(input.to) ? input.to : [input.to];

  // Build the email options — at least one of html/text is guaranteed above
  if (input.html) {
    return resend.emails.send({
      from: input.from,
      to,
      subject: input.subject,
      html: input.html,
      ...(input.text && { text: input.text }),
      headers,
    });
  }

  return resend.emails.send({
    from: input.from,
    to,
    subject: input.subject,
    text: input.text!,
    headers,
  });
}
