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

interface BountyCancellationNoticeProps {
  bountyTitle: string;
  bountyUrl: string;
  creatorName: string;
  bountyAmount: string;
}

export const BountyCancellationNotice = ({
  bountyTitle,
  bountyUrl,
  creatorName,
  bountyAmount,
}: BountyCancellationNoticeProps) => {
  return (
    <Html>
      <Head />
      <Preview>Bounty Cancellation Notice: {bountyTitle}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={logo}>Bounty.new</Heading>
          </Section>
          <Section style={body}>
            <Heading style={h1}>Bounty Cancellation Request</Heading>
            <Text style={text}>
              We wanted to let you know that <strong>{creatorName}</strong> has
              requested to cancel the following bounty:
            </Text>
            <Section style={bountyBox}>
              <Text style={bountyTitleStyle}>{bountyTitle}</Text>
              <Text style={bountyAmountText}>{bountyAmount}</Text>
            </Section>
            <Text style={text}>
              This means your submission may no longer be reviewed. If the
              cancellation is approved, the bounty will be closed and no payouts
              will be made.
            </Text>
            <Text style={text}>
              If you have any questions or concerns, please reach out to the
              bounty creator or contact our support team.
            </Text>
            <Section style={buttonContainer}>
              <Button style={button} href={bountyUrl}>
                View Bounty
              </Button>
            </Section>
            <Hr style={hr} />
            <Text style={footer}>
              If you believe this cancellation is unfair, please contact us at
              support@bounty.new and we'll look into it.
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

const bountyAmountText = {
  color: '#22c55e',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0',
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

export default BountyCancellationNotice;
