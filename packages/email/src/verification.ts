import { sendEmail } from './resend/send';
import { EmailVerification } from './templates';

interface SendVerificationEmailParams {
  to: string;
  token: string;
  baseUrl?: string;
}

export async function sendVerificationEmail({
  to,
  token,
  baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001',
}: SendVerificationEmailParams) {
  const verificationUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  return sendEmail({
    to,
    from: 'noreply@bounty.new',
    subject: 'Verify your email address - Bounty.new',
    react: EmailVerification({
      verificationUrl,
      email: to,
    }),
  });
}