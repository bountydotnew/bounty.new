import { sendEmail } from './resend/send';
import { EmailVerification } from './templates';

interface SendVerificationEmailParams {
  to: string;
  url: string;
}

export async function sendVerificationEmail({
  to,
  url,
}: SendVerificationEmailParams) {
  return await sendEmail({
    to,
    from: 'notifications@mail.bounty.new',
    subject: 'Verify your email address',
    react: EmailVerification({
      verificationUrl: url,
      email: to,
    }),
  });
}