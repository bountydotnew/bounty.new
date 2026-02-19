import { Text, Link } from "@react-email/components";
import BaseEmail from "./BaseEmail";

export interface BountyCancellationNoticeProps {
	bountyTitle: string;
	bountyUrl: string;
	creatorName: string;
	bountyAmount: string;
	/** Recipient's name (optional) */
	userName?: string;
	/** Reason for cancellation (optional) */
	reason?: string;
}

/**
 * Email sent to contributors when a bounty creator requests cancellation.
 */
export const BountyCancellationNotice = ({
	bountyTitle,
	bountyUrl,
	creatorName,
	bountyAmount,
	userName,
	reason,
}: BountyCancellationNoticeProps) => {
	return (
		<BaseEmail
			previewText={`Bounty cancellation request: ${bountyTitle}`}
			userName={userName}
			heading="Bounty Cancellation Request"
			ctaHref={bountyUrl}
			ctaText="View Bounty"
			hideSignature
			footerNote={
				<>
					If you believe this cancellation is unfair, contact us at{" "}
					<Link
						href="mailto:grim@bounty.new"
						className="text-[#26251E] underline"
					>
						grim@bounty.new
					</Link>
				</>
			}
		>
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				<strong>{creatorName}</strong>
				{reason
					? ` has requested to cancel a bounty you're working on:`
					: " has cancelled a bounty you were working on:"}
			</Text>

			{/* Bounty Info */}
			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[4px]">
				<strong>{bountyTitle}</strong> · {bountyAmount}
			</Text>

			{reason && (
				<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
					<strong>Reason:</strong> {reason}
				</Text>
			)}

			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				This means your submission may no longer be reviewed. If the
				cancellation is approved, the bounty will be closed and no payouts will
				be made.
			</Text>

			<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[12px]">
				If you have any questions or concerns, please reach out to the bounty
				creator or contact our support team.
			</Text>
		</BaseEmail>
	);
};

export default BountyCancellationNotice;
