import { Text } from "@react-email/components";
import BaseEmail from "./BaseEmail";

export interface EmailVerificationProps {
	verificationUrl: string;
	email: string;
}

/**
 * Email sent to verify a user's email address after sign up.
 */
export const EmailVerification = ({
	verificationUrl,
	email,
}: EmailVerificationProps) => {
	return (
		<BaseEmail
			previewText="Verify your email address for Bounty.new"
			heading="Verify your email address"
			ctaHref={verificationUrl}
			ctaText="Verify Email Address"
			hideSignature
			footerNote={
				<>
					This verification link will expire in 24 hours. If you didn't create
					an account with {email}, you can safely ignore this email.
				</>
			}
		>
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				Thanks for signing up for Bounty.new! We're excited to have you on
				board.
			</Text>

			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				To complete your registration and start using your account, please
				verify your email address by clicking the button below:
			</Text>

			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				If you're having trouble with the button above, you can also copy and
				paste this link into your browser:
			</Text>

			<Text className="text-[12px] leading-[1.6] text-[rgba(38,37,30,0.5)] m-0 break-all">
				{verificationUrl}
			</Text>
		</BaseEmail>
	);
};

export default EmailVerification;
