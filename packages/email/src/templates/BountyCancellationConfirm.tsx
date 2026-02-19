import { Text } from "@react-email/components";
import BaseEmail from "./BaseEmail";

export interface BountyCancellationConfirmProps {
	bountyTitle: string;
	bountyUrl: string;
	/** Recipient's name (optional) */
	userName?: string;
	originalAmount: string;
	refundAmount: string;
	platformFee?: string;
}

/**
 * Email sent to bounty creator when cancellation is approved and refund is processed.
 */
export const BountyCancellationConfirm = ({
	bountyTitle,
	bountyUrl,
	userName,
	originalAmount,
	refundAmount,
	platformFee,
}: BountyCancellationConfirmProps) => {
	return (
		<BaseEmail
			previewText="Your bounty has been cancelled and refunded"
			userName={userName}
			heading="Bounty Cancelled"
			ctaHref={bountyUrl}
			ctaText="View Bounty"
			hideSignature
		>
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[20px]">
				Your bounty cancellation request has been approved and refunded:
			</Text>

			{/* Bounty Title */}
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[20px]">
				<strong>{bountyTitle}</strong>
			</Text>

			{/* Refund Summary */}
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[4px]">
				<strong>Refund Summary</strong>
			</Text>
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[4px] pl-[16px]">
				Original Amount: {originalAmount}
			</Text>
			{platformFee && (
				<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.5)] m-0 mb-[4px] pl-[16px]">
					Platform Fee (non-refundable): -{platformFee}
				</Text>
			)}
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[20px] pl-[16px]">
				<strong>Your Refund:</strong> {refundAmount}
			</Text>

			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				Your refund has been processed and should appear on your original
				payment method within 5-10 business days.
			</Text>
		</BaseEmail>
	);
};

export default BountyCancellationConfirm;
