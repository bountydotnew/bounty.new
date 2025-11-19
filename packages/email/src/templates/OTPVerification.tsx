import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface OTPVerificationProps {
  code: string;
  email: string;
  type?: 'email-verification' | 'sign-in' | 'forget-password';
  continueUrl?: string;
}

export default function OTPVerification({
  code,
  email,
  type = 'email-verification',
  continueUrl,
}: OTPVerificationProps) {
  const purpose =
    type === 'email-verification'
      ? 'Verify your email'
      : type === 'sign-in'
        ? 'Sign in'
        : 'Reset your password';

  const pretty = (c: string) =>
    c.replace(/\s+/g, '').split('').slice(0, 6).join(' ');

  return (
    <Html>
      <Head />
      <Preview>{purpose} code for Bounty.new</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '32px 0',
              }}
            >
              <Img
                src="https://di867tnz6fwga.cloudfront.net/brand-kits/d27e3c53-bdbd-4c35-919f-2b27a9974bb5/primary/8aa9d0cb-9288-4e1b-8c31-4e738bb9255d.png"
                alt="Bounty.new"
                width={100}
                height={100}
                style={{ display: 'block' }}
              />
            </div>
          </Section>

          <Section style={body}>
            <Heading style={h1}>Your one time password is</Heading>

            <Section style={codeWrap}>
              <div style={codeBox}>{pretty(code)}</div>
            </Section>

            <Hr style={hr} />

            <Text style={footer}>
              Under no circumstances should you give this code to anyone.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: 16 }}>
              <Button href={continueUrl || 'https://bounty.new'} style={button}>
                Continue
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#000000',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const body = {
  padding: '0 20px',
};

const h1 = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: 'normal',
  textAlign: 'center' as const,
  margin: '30px 0 8px 0',
  padding: '0',
};

const codeWrap = {
  textAlign: 'center' as const,
  margin: '18px 0 8px 0',
};

const codeBox = {
  display: 'inline-block',
  letterSpacing: '10px',
  fontSize: '28px',
  fontWeight: 700,
  color: '#ffffff',
};

const button = {
  backgroundColor: '#ffffff',
  borderRadius: '15px',
  color: '#000000',
  fontSize: '14px',
  fontWeight: 'normal',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '10px 18px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '24px 0',
};

const footer = {
  color: '#ffffff',
  fontSize: '12px',
  lineHeight: '20px',
  textAlign: 'center' as const,
  margin: '16px 0 0',
};
