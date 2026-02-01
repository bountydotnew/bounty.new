import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface AlphaAccessGrantedProps {
  name?: string;
  token?: string;
}

const AlphaAccessGranted = ({ name = "there", token }: AlphaAccessGrantedProps) => {
  const href = token
    ? `https://bounty.new/api/accept-access?token=${token}`
    : 'https://bounty.new/login';

  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>You're in! Access bounty.new now</Preview>
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
              Hi {name},
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              You're in! Your early access to bounty.new is ready.
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              I'm excited to have you test the future of bounty collaboration. Create your first bounty, find contributors, and ship faster.
            </Text>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
              This is early days, so things might be a little rough around the edges. I'd love your feedback as I build this out.
            </Text>

            {/* Bounty Alpha Preview Image */}
            <Section className="mb-[10px]">
              <Img
                src="https://bounty.new/og-image.png"
                width={564}
                alt="Bounty Alpha preview"
                className="mx-auto block rounded-[6px]"
                style={{ display: 'block', height: 'auto' }}
              />
              <Text
                className="m-0 mt-[6px] text-center text-[12px]"
                style={{ color: 'rgba(38,37,30,0.7)' }}
              >
                Early look at Bounty Alpha
              </Text>
            </Section>

            {/* CTA Button */}
            <Section className="text-left mt-[6px] mb-[8px]">
              <Button
                href={href}
                className="bg-[#26251E] text-[#F7F7F4] text-[14px] font-normal py-[8px] px-[12px] rounded-full border border-solid border-[#3B3A33] box-border"
              >
                Get started
              </Button>
            </Section>

            <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[16px]">
              Got questions or just want to chat? Hit me up at{' '}
              <Link
                href="mailto:support@bounty.new"
                className="text-[#26251E] underline"
              >
                support@bounty.new
              </Link>{' '}
              – I read every email.
            </Text>

            {/* Divider */}
            <Hr className="border-solid border-[1px] border-[#F2F1ED] my-[16px]" />

            {/* Footer */}
            <Text className="text-[11px] leading-[24px] text-[rgba(38,37,30,0.6)] m-0">
              bounty.new ·{' '}
              <Link href="mailto:support@bounty.new" className="text-[#26251E] no-underline">
                support@bounty.new
              </Link>{' '}
              ·{' '}
              <Link href="https://bounty.new/unsubscribe" className="text-[#26251E] no-underline">
                Unsubscribe
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default AlphaAccessGranted;
