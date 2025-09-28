import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface OTPVerificationProps {
  code: string;
  email: string;
  /**
   * email-verification | sign-in | forget-password
   */
  type?: 'email-verification' | 'sign-in' | 'forget-password';
}

export default function OTPVerification({
  code,
  email,
  type = 'email-verification',
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
          <Section style={header}>
            <Heading style={logo}>Bounty.new</Heading>
          </Section>

          <Section style={body}>
            <Heading style={h1}>{purpose}</Heading>

            <Text style={muted}>
              We sent this one-time code to <strong>{email}</strong>.
            </Text>

            <Section style={codeWrap}>
              <div style={codeBox}>{pretty(code)}</div>
            </Section>

            <Text style={text}>
              Enter this 6‑digit code in the app to continue. This code expires
              shortly for security reasons. If you didn't request this, you
              can safely ignore this email.
            </Text>

            <Hr style={hr} />

            <Text style={footer}>
              Having trouble? You can request a new code from the verification
              screen.
            </Text>

            <Section style={{ textAlign: 'center', marginTop: 16 }}>
              <Button
                href="https://bounty.new"
                style={button}
              >
                Go to Bounty.new
              </Button>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '580px',
};

const header = {
  padding: '32px 0',
  textAlign: 'center' as const,
};

const logo = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#000000',
  margin: '0',
};

const body = {
  padding: '0 20px',
};

const h1 = {
  color: '#000',
  fontSize: '24px',
  fontWeight: 'normal',
  textAlign: 'center' as const,
  margin: '30px 0 8px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const muted = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '6px 0 18px 0',
  textAlign: 'center' as const,
};

const codeWrap = {
  textAlign: 'center' as const,
  margin: '18px 0 8px 0',
};

const codeBox = {
  display: 'inline-block',
  letterSpacing: '10px',
  padding: '14px 18px',
  borderRadius: '12px',
  border: '1px solid #eaeaea',
  background: '#f7f7f7',
  fontSize: '28px',
  fontWeight: 700,
  color: '#111111',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold',
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
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 0 0',
};