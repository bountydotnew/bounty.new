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

interface ExternalInviteProps {
  inviteUrl: string;
}

const ExternalInvite = ({ inviteUrl }: ExternalInviteProps) => {
  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Preview>You're invited to bounty.new</Preview>
        <Body className="bg-[#0a0a0a] py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[5px] bg-[#0A0A0A] px-[20px] py-[120px] text-center">
            <Img
              alt="bounty.new"
              className="mb-[60px] inline-block h-[50px] w-auto rounded-[24px] border border-[#242424] border-solid p-[10px]"
              src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/primary/fe6cebd8-bd47-499e-a90b-448561edc58d.png"
            />
            <Text className="m-0 mb-[24px] font-bold text-[#fdfdfd] text-[36px] leading-[40px]">
              You're invited.
            </Text>
            <Button
              className="mb-[40px] box-border inline-block rounded-[22px] bg-[#fdfdfd] px-[48px] py-[16px] font-semibold text-[#000000] text-[16px] no-underline"
              href={inviteUrl}
            >
              Accept Invite
            </Button>
            <Text className="m-0 mt-[24px] text-[#848484] text-[14px] leading-[22px]">
              Link expires in 7 days or after first use.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ExternalInvite;
