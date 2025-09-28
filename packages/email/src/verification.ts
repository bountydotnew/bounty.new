export type SendVerificationEmailParams = { to: string; url: string };

/**
 * Disabled: We now use OTP code emails for verification, not link emails.
 * Keeping a no-op here prevents accidental link sends if called.
 */
export function sendVerificationEmail(_: SendVerificationEmailParams): void {
  return;
}