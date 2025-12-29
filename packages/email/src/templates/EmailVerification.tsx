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

interface EmailVerificationProps {
  verificationUrl: string;
  email: string;
}

export const EmailVerification = ({
  verificationUrl,
  email,
}: EmailVerificationProps) => {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address for Bounty.new</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Bounty.new</Heading>
          </Section>
          <Section style={body}>
            <Heading style={h1}>Verify your email address</Heading>
            <Text style={text}>
              Thanks for signing up for Bounty.new! We're excited to have you on
              board.
            </Text>
            <Text style={text}>
              To complete your registration and start using your account, please
              verify your email address by clicking the button below:
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={verificationUrl}>
                Verify Email Address
              </Button>
            </Section>
            <Text style={text}>
              If you're having trouble with the button above, you can also copy
              and paste this link into your browser:
            </Text>
            <Text style={link}>{verificationUrl}</Text>
            <Hr style={hr} />
            <Text style={footer}>
              This verification link will expire in 24 hours. If you didn't
              create an account with {email}, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};
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
  margin: '30px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 0',
};

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

const button = {
  backgroundColor: '#000000',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 24px',
};

const link = {
  color: '#666',
  fontSize: '14px',
  wordBreak: 'break-all' as const,
  margin: '16px 0',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 0',
};

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 0 0',
};
