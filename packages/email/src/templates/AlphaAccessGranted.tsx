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

interface AlphaAccessGrantedProps {
  name?: string;
  token?: string;
}

const AlphaAccessGranted = ({ name, token }: AlphaAccessGrantedProps) => {
  // If token is provided, use the accept-access endpoint, otherwise fallback to login
  const href = token
    ? `https://bounty.new/api/accept-access?token=${token}`
    : 'https://bounty.new/login';

  return (
    <Html dir="ltr" lang="en">
      <Tailwind>
        <Head />
        <Preview>You're in! Test bounty.new now</Preview>
        <Body className="bg-[#0a0a0a] py-[40px] font-sans">
          <Container className="mx-auto max-w-[600px] rounded-[5px] bg-[#0A0A0A] px-[20px] py-[120px] text-center">
            {/* Logo with border */}
            <Img
              alt="bounty.new"
              className="mb-[60px] inline-block h-[50px] w-auto rounded-[24px] border border-[#242424] border-solid p-[10px]"
              src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/primary/fe6cebd8-bd47-499e-a90b-448561edc58d.png"
            />

            {/* Main Heading */}
            <Text className="m-0 mb-[30px] font-bold text-[#fdfdfd] text-[48px] leading-[48px]">
              You're In.
            </Text>

            {/* Description */}
            <Text className="m-0 mb-[40px] font-normal text-[#848484] text-[16px] leading-[24px] tracking-[0.3px]">
              Thank you for joining the bounty.new waitlist. Your early access
              is ready. Start testing the future of bounty collaboration.
            </Text>

            {/* CTA Button */}
            <Button
              className="mb-[40px] box-border inline-block rounded-[22px] bg-[#fdfdfd] px-[48px] py-[16px] font-semibold text-[#000000] text-[16px] no-underline"
              href={href}
            >
              Start Testing
            </Button>

            {/* Footer */}
            <Text className="m-0 mt-[96px] mb-[16px] text-[#848484] text-[16px] leading-[24px]">
              Made with ❤️ for developers
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AlphaAccessGranted;
