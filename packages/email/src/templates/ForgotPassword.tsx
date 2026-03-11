import { Text } from '@react-email/components';
import BaseEmail from './BaseEmail';

interface ForgotPasswordProps {
  userName?: string;
  resetUrl: string;
}

/**
 * Email sent when a user requests to reset their password.
 */
const ForgotPassword = ({
  userName = 'there',
  resetUrl,
}: ForgotPasswordProps) => {
  return (
    <BaseEmail
      previewText="Reset your Bounty.new password"
      userName={userName}
      heading="Reset your password"
      ctaHref={resetUrl}
      ctaText="Reset Password"
      hideSignature
      footerNote={
        <>
          If you didn't request a password reset, you can safely ignore this
          email. This link will expire in 1 hour for security reasons.
        </>
      }
    >
      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        We received a request to reset your password for your Bounty.new account. If
        you didn't make this request, you can safely ignore this email.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        To reset your password, click the button below. This link will expire in 1
        hour for security reasons.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        If the button doesn't work, copy and paste this link into your browser:
      </Text>

      <Text className="text-[12px] leading-[1.6] text-[rgba(38,37,30,0.5)] m-0 break-all">
        {resetUrl}
      </Text>
    </BaseEmail>
  );
};

ForgotPassword.PreviewProps = {
  userName: 'John',
  resetUrl: 'https://bounty.new/reset-password?token=example_token',
};

export default ForgotPassword;
