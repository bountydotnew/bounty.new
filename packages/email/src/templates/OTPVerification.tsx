import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Tailwind,
} from '@react-email/components';

interface OTPVerificationProps {
  code: string;
  entryId: string;
  email: string;
}

const OTPVerification = ({ code, entryId, email }: OTPVerificationProps) => {
  const verifyUrl = `https://bounty.new/waitlist/verify?entryId=${entryId}&email=${encodeURIComponent(email)}&code=${code}`;

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Your verification code: {code}</Preview>
        <Body className="bg-[#f7f7f7] font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] p-[18px] mx-auto max-w-[600px]">
            {/* Logo Section */}
            <Section className="text-center mb-[20px]">
              <Img
                src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/icon/bd8de183-36e3-4a36-93aa-3dd09842811b.png"
                alt="bounty icon"
                width="60"
                className="mx-auto h-auto"
              />
            </Section>

            {/* Main Content */}
            <Text className="text-[14px] leading-[24px] text-[#26251E] font-semibold m-0 mb-[12px]">
              Your verification code: {code}
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              We received a request to verify the email address associated with your Bounty.new account. If you didn't make this request, you can safely ignore this email.
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              To verify your code, click the button below. This code will expire in 10 minutes for security reasons.
            </Text>

            {/* CTA Button */}
            <Section className="text-left mt-[6px] mb-[4px]">
              <Button
                href={verifyUrl}
                className="bg-[#26251E] text-[#F7F7F4] text-[14px] font-normal py-[8px] px-[12px] rounded-full border border-solid border-[#3B3A33] box-border"
              >
                Verify Code
              </Button>
            </Section>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              If the button doesn't work, copy and paste this link into your browser:
            </Text>

            <Text className="text-[12px] leading-[1.6] text-[rgba(38,37,30,0.5)] m-0 mb-[16px] break-all">
              {verifyUrl}
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[16px]">
              If you need help, feel free to{' '}
              <Link
                href="mailto:support@bounty.new"
                className="text-[#26251E] underline"
              >
                contact our support team
              </Link>.
            </Text>

            {/* Divider */}
            <Hr className="border-solid border-[1px] border-[#F2F1ED] my-[16px]" />

            {/* Footer */}
            <Text className="text-[11px] leading-[24px] text-[rgba(38,37,30,0.6)] m-0">
              bounty.new ·{' '}
              <Link
                href="mailto:support@bounty.new"
                className="text-[#26251E] no-underline"
              >
                support@bounty.new
              </Link>{' '}
              ·{' '}
              <Link
                href="https://bounty.new"
                className="text-[#26251E] no-underline"
              >
                bounty.new
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

OTPVerification.PreviewProps = {
  code: '123456',
  entryId: 'abc123',
  email: 'user@example.com',
} satisfies OTPVerificationProps;

export default OTPVerification;