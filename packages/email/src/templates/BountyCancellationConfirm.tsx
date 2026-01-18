import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface BountyCancellationConfirmProps {
  bountyTitle: string;
  bountyUrl: string;
  creatorName: string;
  originalAmount: string;
  refundAmount: string;
  platformFee: string;
}

export const BountyCancellationConfirm = ({
  bountyTitle,
  bountyUrl,
  creatorName,
  originalAmount,
  refundAmount,
  platformFee,
}: BountyCancellationConfirmProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your bounty has been cancelled</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Bounty.new</Heading>
          </Section>
          <Section style={body}>
            <Heading style={h1}>Bounty Cancelled</Heading>
            <Text style={text}>
              Hi {creatorName}, your cancellation request has been approved. The following bounty
              has been cancelled and refunded:
            </Text>
            <Section style={bountyBox}>
              <Text style={bountyTitleStyle}>{bountyTitle}</Text>
              <Text style={bountyLinkStyle}>
                <a href={bountyUrl} style={{ color: '#0066cc' }}>View bounty →</a>
              </Text>
            </Section>
            <Section style={refundBox}>
              <Text style={refundLabel}>Refund Summary</Text>
              <Section style={refundRow}>
                <Text style={refundItem}>Original Amount</Text>
                <Text style={refundValue}>{originalAmount}</Text>
              </Section>
              <Section style={refundRow}>
                <Text style={refundItem}>Platform Fee (non-refundable)</Text>
                <Text style={refundValueMuted}>-{platformFee}</Text>
              </Section>
              <Hr style={refundDivider} />
              <Section style={refundRow}>
                <Text style={refundItemBold}>Your Refund</Text>
                <Text style={refundValueGreen}>{refundAmount}</Text>
              </Section>
            </Section>
            <Text style={text}>
              Your refund has been processed and should appear on your original
              payment method within 5-10 business days.
            </Text>
            <Text style={text}>
              If you have any questions about your refund, please contact us at{' '}
              <a href="mailto:support@bounty.new" style={{ color: '#0066cc' }}>support@bounty.new</a>.
            </Text>
            <Hr style={hr} />
            <Text style={footer}>
              Thank you for using Bounty.new. We hope to see you again!
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

const bountyBox = {
  backgroundColor: '#f9f9f9',
  border: '1px solid #e6e6e6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
  textAlign: 'center' as const,
};

const bountyTitleStyle = {
  color: '#000',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
};

const bountyLinkStyle = {
  fontSize: '14px',
  margin: '0',
};

const refundBox = {
  backgroundColor: '#fafafa',
  border: '1px solid #e6e6e6',
  borderRadius: '8px',
  padding: '20px',
  margin: '24px 0',
};

const refundLabel = {
  color: '#666',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 16px 0',
};

const refundRow = {
  display: 'flex',
  justifyContent: 'space-between',
  margin: '8px 0',
};

const refundItem = {
  color: '#333',
  fontSize: '14px',
  margin: '0',
};

const refundItemBold = {
  color: '#000',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '0',
};

const refundValue = {
  color: '#333',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0',
  textAlign: 'right' as const,
};

const refundValueMuted = {
  color: '#999',
  fontSize: '14px',
  margin: '0',
  textAlign: 'right' as const,
};

const refundValueGreen = {
  color: '#22c55e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  textAlign: 'right' as const,
};

const refundDivider = {
  borderColor: '#e6e6e6',
  margin: '12px 0',
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

export default BountyCancellationConfirm;
