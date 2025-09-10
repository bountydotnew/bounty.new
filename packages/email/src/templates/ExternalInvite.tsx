import * as React from 'react';
import { Body, Button, Container, Head, Html, Img, Preview, Tailwind, Text } from '@react-email/components';

interface ExternalInviteProps {
  inviteUrl: string;
  accessStage?: 'alpha' | 'beta' | 'production' | 'none';
}

const ExternalInvite = ({ inviteUrl, accessStage = 'beta' }: ExternalInviteProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You're invited to bounty.new</Preview>
        <Body className="bg-[#0a0a0a] font-sans py-[40px]">
          <Container className="bg-[#0A0A0A] max-w-[600px] mx-auto px-[20px] py-[120px] text-center rounded-[5px]">
            <Img
              src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/primary/fe6cebd8-bd47-499e-a90b-448561edc58d.png"
              alt="bounty.new"
              className="inline-block h-[50px] w-auto border border-solid border-[#242424] rounded-[24px] p-[10px] mb-[60px]"
            />
            <Text className="text-[#fdfdfd] text-[36px] leading-[40px] font-bold m-0 mb-[24px]">
              You're invited.
            </Text>
            <Text className="text-[#848484] text-[16px] leading-[24px] font-normal tracking-[0.3px] m-0 mb-[40px]">
              Access level: {accessStage.toUpperCase()}
            </Text>
            <Button
              href={inviteUrl}
              className="bg-[#fdfdfd] text-[#000000] px-[48px] py-[16px] text-[16px] font-semibold no-underline box-border inline-block rounded-[22px] mb-[40px]"
            >
              Accept Invite
            </Button>
            <Text className="text-[#848484] text-[14px] leading-[22px] m-0 mt-[24px]">
              Link expires in 7 days or after first use.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default ExternalInvite;


