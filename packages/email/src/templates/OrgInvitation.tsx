import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Tailwind,
  Text,
} from '@react-email/components';

interface OrgInvitationProps {
  inviterName: string;
  orgName: string;
  role: string;
  inviteUrl: string;
  /** Human-readable expiration text, e.g. "48 hours". Defaults to "48 hours". */
  expiresIn?: string;
}

const OrgInvitation = ({
  inviterName,
  orgName,
  role,
  inviteUrl,
  expiresIn = '48 hours',
}: OrgInvitationProps) => {
  return (
    <Html dir="ltr" lang="en">
      <Head />
      <Tailwind>
        <Preview>
          {inviterName} invited you to join {orgName} on bounty.new
        </Preview>
        <Body className="bg-[#0a0a0a] py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[5px] bg-[#0A0A0A] px-[20px] py-[120px] text-center">
            <Img
              alt="bounty.new"
              className="mb-[60px] inline-block h-[50px] w-auto rounded-[24px] border border-[#242424] border-solid p-[10px]"
              src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/primary/fe6cebd8-bd47-499e-a90b-448561edc58d.png"
            />
            <Text className="m-0 mb-[12px] font-bold text-[#fdfdfd] text-[36px] leading-[40px]">
              Join {orgName}
            </Text>
            <Text className="m-0 mb-[32px] text-[#848484] text-[16px] leading-[24px]">
              {inviterName} invited you to join{' '}
              <strong className="text-[#fdfdfd]">{orgName}</strong> as a {role}{' '}
              on bounty.new.
            </Text>
            <Button
              className="mb-[40px] box-border inline-block rounded-[22px] bg-[#fdfdfd] px-[48px] py-[16px] font-semibold text-[#000000] text-[16px] no-underline"
              href={inviteUrl}
            >
              Accept Invitation
            </Button>
            <Text className="m-0 mt-[24px] text-[#848484] text-[14px] leading-[22px]">
              This invitation expires in {expiresIn}.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default OrgInvitation;
