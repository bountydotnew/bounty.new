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

interface ForgotPasswordProps {
  userName?: string;
  resetUrl: string;
}

const ForgotPassword = ({
  userName = 'there',
  resetUrl,
}: ForgotPasswordProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>Reset your Bounty.new password</Preview>
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
              Hi {userName},
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              We received a request to reset your password for your Bounty.new
              account. If you didn't make this request, you can safely ignore
              this email.
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              To reset your password, click the button below. This link will
              expire in 1 hour for security reasons.
            </Text>

            {/* CTA Button */}
            <Section className="text-left mt-[6px] mb-[4px]">
              <Button
                href={resetUrl}
                className="bg-[#26251E] text-[#F7F7F4] text-[14px] font-normal py-[8px] px-[12px] rounded-full border border-solid border-[#3B3A33] box-border"
              >
                Reset Password
              </Button>
            </Section>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              If the button doesn't work, copy and paste this link into your
              browser:
            </Text>

            <Text className="text-[12px] leading-[1.6] text-[rgba(38,37,30,0.5)] m-0 mb-[16px] break-all">
              {resetUrl}
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[16px]">
              If you need help, feel free to{' '}
              <Link
                href="mailto:support@bounty.new"
                className="text-[#26251E] underline"
              >
                contact our support team
              </Link>
              .
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

ForgotPassword.PreviewProps = {
  userName: 'John',
  resetUrl: 'https://bounty.new/reset-password?token=example_token',
};

export default ForgotPassword;
