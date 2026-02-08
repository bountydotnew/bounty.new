import { Text } from '@react-email/components';
import BaseEmail from './BaseEmail';

export interface ExternalInviteProps {
  inviteUrl: string;
  /** Inviter's name (optional) */
  inviterName?: string;
  /** Recipient's name (optional) */
  userName?: string;
}

/**
 * Email sent when someone is invited to join bounty.new.
 */
export const ExternalInvite = ({
  inviteUrl,
  inviterName,
  userName,
}: ExternalInviteProps) => {
  const heading = inviterName
    ? `${inviterName} thinks you'd be great at bounty.new`
    : "You're invited to bounty.new";

  return (
    <BaseEmail
      previewText="You're invited to bounty.new"
      userName={userName}
      heading={heading}
      ctaHref={inviteUrl}
      ctaText="Accept Invite"
      footerNote="This invite expires in 7 days or after first use."
    >
      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        Bounty.new is the platform for developers to ship fast and get paid
        faster. Bounties, seamless payouts, and tools to grow your open source
        career.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        Claim your profile and start getting paid for the work you already do
        on GitHub.
      </Text>
    </BaseEmail>
  );
};

export default ExternalInvite;
