import { Text } from '@react-email/components';
import BaseEmail, { type BaseEmailProps } from './BaseEmail';

export interface OrgInvitationProps {
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
  /** Human-readable expiration text, e.g. "48 hours". Defaults to "48 hours". */
  expiresIn?: string;
  /** Recipient's name (optional) */
  userName?: string;
}

/**
 * Email sent when a user is invited to join an organization.
 */
export const OrgInvitation = ({
  inviterName,
  orgName,
  role,
  inviteUrl,
  expiresIn = '48 hours',
  userName,
}: OrgInvitationProps) => {
  const baseEmailProps: Omit<BaseEmailProps, 'children'> = {
    previewText: `${inviterName} invited you to join ${orgName} on bounty.new`,
    userName,
    heading: `You've been invited to join ${orgName}`,
    ctaHref: inviteUrl,
    ctaText: 'Accept Invitation',
    footerNote: `This invitation expires in ${expiresIn}.`,
    hideSignature: true,
  };

  return (
    <BaseEmail {...baseEmailProps}>
      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        <strong>{inviterName}</strong> has invited you to join{' '}
        <strong>{orgName}</strong> as a <strong>{role}</strong>.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        Accept the invitation to collaborate with your team and start building
        bounties together.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        This invitation expires in {expiresIn}.
      </Text>
    </BaseEmail>
  );
};

export default OrgInvitation;
