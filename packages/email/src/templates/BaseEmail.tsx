import {
	Body,
	Button,
	Column,
	Container,
	Head,
	Hr,
	Html,
	Img,
	Link,
	Preview,
	Row,
	Section,
	Tailwind,
	Text,
} from "@react-email/components";
import { env } from "@bounty/env/client";

export interface BaseEmailProps {
	/** Preview text shown in email client before opening */
	previewText: string;
	/** Recipient's name, defaults to "there" */
	userName?: string;
	/** Hero image source URL (optional) */
	heroImageSrc?: string;
	/** Hero image alt text */
	heroImageAlt?: string;
	/** Main heading text */
	heading?: string;
	/** Email content paragraphs */
	children: React.ReactNode;
	/** CTA button href */
	ctaHref?: string;
	/** CTA button text */
	ctaText?: string;
	/** Footer note text (appears after divider) */
	footerNote?: React.ReactNode;
	/** Hide the grim signature (for directive/transactional emails) */
	hideSignature?: boolean;
	/** Base URL for assets (defaults to NEXT_PUBLIC_BASE_URL env var or production URL) */
	baseUrl?: string;
}

/**
 * Base email template with bounty.new branding.
 * Provides consistent layout, styling, and footer across all transactional emails.
 */
export const BaseEmail = ({
	previewText,
	userName = "there",
	heroImageSrc,
	heroImageAlt = "bounty icon",
	heading,
	children,
	ctaHref,
	ctaText,
	footerNote,
	hideSignature = false,
	baseUrl = env.NEXT_PUBLIC_BASE_URL || "https://bounty.new",
}: BaseEmailProps) => {
	return (
		<Html lang="en" dir="ltr">
			<Head />
			<Tailwind>
				<Preview>{previewText}</Preview>
				<Body className="bg-[#f7f7f7] font-sans py-[40px]">
					<Container className="bg-white rounded-[8px] p-[18px] mx-auto max-w-[600px]">
						{/* Logo Section */}
						<Section className="text-center mb-[32px]">
							{heroImageSrc ? (
								<Img
									src={heroImageSrc}
									alt={heroImageAlt}
									width="32"
									className="mx-auto h-auto"
								/>
							) : (
								<Img
									src={`${baseUrl}/bounty.png`}
									alt="bounty icon"
									width="32"
									height="32"
									className="mx-auto h-auto"
								/>
							)}
						</Section>

						{/* Greeting */}
						<Text className="text-[14px] leading-[24px] text-[#26251E] font-semibold m-0 mb-[12px]">
							Hi {userName},
						</Text>

						{/* Heading */}
						{heading && (
							<Text className="text-[14px] leading-[24px] text-[#26251E] font-semibold m-0 mb-[12px]">
								{heading}
							</Text>
						)}

						{/* Main Content */}
						{children}

						{/* CTA Button */}
						{ctaHref && ctaText && (
							<Section className="text-left mt-[6px] mb-[8px]">
								<Button
									href={ctaHref}
									className="bg-[#26251E] text-[#F7F7F4] text-[14px] font-normal py-[8px] px-[12px] rounded-full border border-solid border-[#3B3A33] box-border"
								>
									{ctaText}
								</Button>
							</Section>
						)}

						{/* Support Note & Signature - only for social emails */}
						{!hideSignature && (
							<>
								<Text className="text-[14px] leading-[1.6] text-[rgba(38,37,30,0.6)] m-0 mb-[16px]">
									Got questions or just want to chat? Hit me up at{" "}
									<Link
										href="mailto:grim@bounty.new"
										className="text-[#26251E] underline"
									>
										grim@bounty.new
									</Link>{" "}
									– I read every email.
								</Text>

								{/* Signature */}
								<Section className="mb-[16px]">
									<Row>
										<Column className="w-[44px]">
											<Img
												src={`${baseUrl}/images/grim.jpg`}
												alt="grim"
												width="44"
												height="44"
												className="rounded-full h-auto"
											/>
										</Column>
										<Column className="align-middle pl-[8px]">
											<Text className="text-[13px] leading-[20px] font-semibold text-[rgba(38,37,30,0.6)] m-0">
												grim
											</Text>
											<Text className="text-[12px] leading-[16px] text-[rgba(38,37,30,0.5)] m-0">
												Founder, Bounty
											</Text>
										</Column>
									</Row>
								</Section>
							</>
						)}

						{/* Divider */}
						<Hr className="border-solid border-[1px] border-[#F2F1ED] my-[16px]" />

						{/* Optional Footer Note */}
						{footerNote && (
							<Text className="text-[11px] leading-[24px] text-[rgba(38,37,30,0.6)] m-0">
								{footerNote}
							</Text>
						)}
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};

export default BaseEmail;
