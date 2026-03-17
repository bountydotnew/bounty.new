import { Text } from '@react-email/components';
import BaseEmail from './BaseEmail';

interface InviteCodeProps {
  code: string;
  email: string;
}

/**
 * Email sent when an admin sends an invite code to grant early access.
 */
const InviteCode = ({ code, email }: InviteCodeProps) => {
  return (
    <BaseEmail
      previewText={`Your invite code: ${code}`}
      heading="You've been invited!"
      ctaHref="https://bounty.new/early-access-required"
      ctaText="Claim your access"
      hideSignature
      footerNote={
        <>
          This invite code expires in 7 days. If you didn't expect this
          invitation, you can safely ignore this email.
        </>
      }
    >
      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        You've been invited to join bounty.new. Enter this code to get early
        access:
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[#26251E] font-semibold m-0 mb-[12px]">
        {code}
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        Sign in to bounty.new and enter this code on the early access page to
        unlock your account.
      </Text>
    </BaseEmail>
  );
};

InviteCode.PreviewProps = {
  code: 'BTY8TJF',
  email: 'user@example.com',
} satisfies InviteCodeProps;

export default InviteCode;
