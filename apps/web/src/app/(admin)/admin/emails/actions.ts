'use server';

import { AUDIENCES, FROM_ADDRESSES, sendEmail, subscribeToAudience, unsubscribeFromAudience, AlphaAccessGranted } from '@bounty/email';
import type { AudienceKey, FromKey } from '@bounty/email';

export async function sendTestEmailAction(input: { to: string[]; subject: string; fromKey: FromKey; html?: string; text?: string; template?: 'alpha' | 'none' }) {
  const res = await sendEmail({
    to: input.to,
    subject: input.subject,
    from: FROM_ADDRESSES[input.fromKey],
    html: input.template === 'alpha' ? undefined : (input.html ?? ''),
    react: input.template === 'alpha' ? AlphaAccessGranted({ name: '' }) : undefined,
    text: input.text ?? '',
  });
  return { id: res.data?.id ?? null, error: res.error?.message ?? null };
}

export async function subscribeAudienceAction(input: { email: string; audienceKey: AudienceKey; firstName?: string; lastName?: string }) {
  const res = await subscribeToAudience({
    email: input.email,
    audience: AUDIENCES[input.audienceKey],
    firstName: input.firstName,
    lastName: input.lastName,
  });
  return res;
}

export async function unsubscribeAudienceAction(input: { email: string; audienceKey: AudienceKey }) {
  const res = await unsubscribeFromAudience({
    email: input.email,
    audience: AUDIENCES[input.audienceKey],
  });
  return res;
}


