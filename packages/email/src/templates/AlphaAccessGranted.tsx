import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Text,
  Button,
  Tailwind,
} from '@react-email/components';

const AlphaAccessGranted = (props: { name?: string }) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You're in! Test bounty.new now</Preview>
        <Body className="bg-[#0a0a0a] font-sans py-[40px]">
          <Container className="bg-[#0A0A0A] max-w-[600px] mx-auto px-[20px] py-[120px] text-center rounded-[5px]">
            {/* Logo with border */}
            <Img
              src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/primary/fe6cebd8-bd47-499e-a90b-448561edc58d.png"
              alt="bounty.new"
              className="inline-block h-[50px] w-auto border border-solid border-[#242424] rounded-[24px] p-[10px] mb-[60px]"
            />

            {/* Main Heading */}
            <Text className="text-[#fdfdfd] text-[48px] leading-[48px] font-bold m-0 mb-[30px]">
              You're In.
            </Text>
            
            {/* Description */}
            <Text className="text-[#848484] text-[16px] leading-[24px] font-normal tracking-[0.3px] m-0 mb-[40px]">
              Thank you for joining the bounty.new waitlist. Your early access is ready. Start testing the future of bounty collaboration.
            </Text>

            {/* CTA Button */}
            <Button
              href="https://bounty.new/login"
              className="bg-[#fdfdfd] text-[#000000] px-[48px] py-[16px] text-[16px] font-semibold no-underline box-border inline-block rounded-[22px] mb-[40px]"
            >
              Start Testing
            </Button>

            {/* Footer */}
            <Text className="text-[#848484] text-[16px] leading-[24px] m-0 mt-[96px] mb-[16px]">
              Made with ❤️ for developers
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AlphaAccessGranted;