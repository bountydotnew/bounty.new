import { Text, Section, Img } from '@react-email/components';
import BaseEmail from './BaseEmail';

interface AlphaAccessGrantedProps {
  name?: string;
  token?: string;
}

/**
 * Email sent when someone is granted alpha access to Bounty.new.
 */
const AlphaAccessGranted = ({ name = "there", token }: AlphaAccessGrantedProps) => {
  const href = token
    ? `https://bounty.new/api/accept-access?token=${token}`
    : 'https://bounty.new/login';

  return (
    <BaseEmail
      previewText="You're in! Access bounty.new now"
      userName={name}
      heading="You're in!"
      ctaHref={href}
      ctaText="Get started"
    >
      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        Your early access to bounty.new is ready.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        I'm excited to have you test the future of bounty collaboration. Create your
        first bounty, find contributors, and ship faster.
      </Text>

      <Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
        This is early days, so things might be a little rough around the edges. I'd
        love your feedback as I build this out.
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
    </BaseEmail>
  );
};

export default AlphaAccessGranted;
