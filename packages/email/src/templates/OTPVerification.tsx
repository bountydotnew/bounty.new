import { Text } from "@react-email/components";
import BaseEmail from "./BaseEmail";

interface OTPVerificationProps {
	code: string;
	entryId?: string;
	email: string;
	type?: string;
	continueUrl?: string;
}

/**
 * Email sent with a one-time verification code.
 */
const OTPVerification = ({
	code,
	entryId,
	email,
	continueUrl,
}: OTPVerificationProps) => {
	const verifyUrl =
		continueUrl ||
		(entryId
			? `https://bounty.new/waitlist/verify?entryId=${entryId}&email=${encodeURIComponent(email)}&code=${code}`
			: undefined);

	return (
		<BaseEmail
			previewText={`Your verification code: ${code}`}
			heading={`Your verification code: ${code}`}
			ctaHref={verifyUrl || undefined}
			ctaText={verifyUrl ? "Verify Code" : undefined}
			hideSignature
			footerNote={
				<>
					If you didn't request this code, you can safely ignore this email.
					This code will expire in 10 minutes for security reasons.
				</>
			}
		>
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				We received a request to verify the email address associated with your
				Bounty.new account. If you didn't make this request, you can safely
				ignore this email.
			</Text>

			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				{verifyUrl
					? "To verify your code, click the button below. This code will expire in 10 minutes for security reasons."
					: "Use this code to verify your email. This code will expire in 10 minutes for security reasons."}
			</Text>

			{verifyUrl && (
				<>
					<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
						If the button doesn't work, copy and paste this link into your
						browser:
					</Text>

					<Text className="text-[12px] leading-[1.6] text-[rgba(38,37,30,0.5)] m-0 break-all">
						{verifyUrl}
					</Text>
				</>
			)}
		</BaseEmail>
	);
};

OTPVerification.PreviewProps = {
	code: "123456",
	entryId: "abc123",
	email: "user@example.com",
} satisfies OTPVerificationProps;

export default OTPVerification;
