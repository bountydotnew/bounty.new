import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import { TableOfContents } from "@/components/legal/table-of-contents";

export const metadata: Metadata = {
	title: "Terms of Service - bounty.new",
	description:
		"Terms of Service for bounty.new. Read our terms and conditions for using the platform.",
	openGraph: {
		title: "Terms of Service - bounty.new",
		description:
			"Terms of Service for bounty.new. Read our terms and conditions for using the platform.",
		url: "https://bounty.new/terms",
		siteName: "bounty.new",
	},
};

const sections = [
	{ id: "overview", title: "Overview" },
	{ id: "account", title: "Account & Responsibilities" },
	{ id: "bounties", title: "How Bounties Work" },
	{ id: "pricing", title: "Pricing & Fees" },
	{ id: "subscriptions", title: "Subscriptions & Billing" },
	{ id: "price-changes", title: "Price Changes" },
	{ id: "refunds", title: "Refund Policy" },
	{ id: "termination", title: "Account Termination" },
	{ id: "content", title: "Content & IP" },
	{ id: "disclaimers", title: "Disclaimers" },
	{ id: "changes", title: "Changes to Terms" },
	{ id: "contact", title: "Contact" },
];

export default function TermsPage() {
	return (
		<div className="flex min-h-screen flex-col bg-background text-foreground">
			<Header />

			<section className="flex-1 px-8 pt-32 pb-24">
				<div className="mx-auto max-w-6xl">
					<div className="grid grid-cols-1 gap-12 xl:grid-cols-[200px_1fr]">
						{/* Sticky Table of Contents - Desktop */}
						<div className="hidden xl:block">
							<div className="sticky top-32">
								<TableOfContents sections={sections} />
							</div>
						</div>

						{/* Main Content */}
						<div className="max-w-3xl">
							<header className="mb-12">
								<h1 className="text-balance font-display text-4xl tracking-tight text-foreground md:text-5xl">
									Terms of Service
								</h1>
								<p className="mt-4 text-[15px] text-text-muted">
									Last updated: February 1, 2026
								</p>
							</header>

							<div className="prose prose-invert prose-lg max-w-none prose-headings:font-display prose-headings:tracking-tight prose-headings:text-foreground prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-p:text-text-secondary prose-p:leading-[1.8] prose-a:text-foreground prose-a:underline prose-a:decoration-border-subtle hover:prose-a:decoration-foreground prose-strong:text-foreground prose-ul:text-text-secondary prose-li:text-text-secondary prose-li:leading-[1.8] prose-hr:border-border-subtle">
								<section id="overview">
									<h2>Overview</h2>
									<p>
										By using bounty.new, you agree to these terms. We've tried
										to keep this readable and fair.
									</p>
								</section>

								<hr />

								<section id="account">
									<h2>Account & Responsibilities</h2>
									<p>
										To use bounty.new, you need an account with accurate
										information. You're responsible for keeping your credentials
										secure and for all activity under your account.
									</p>

									<h3>Acceptable Use</h3>
									<p>Don't:</p>
									<ul>
										<li>Spam, harass, or abuse anyone</li>
										<li>Attempt fraud or manipulation</li>
										<li>Use the platform for anything illegal</li>
										<li>Try to hack or exploit our systems</li>
									</ul>
								</section>

								<hr />

								<section id="bounties">
									<h2>How Bounties Work</h2>
									<p>
										Creators post bounties with rewards. Developers submit work.
										Creators approve submissions that meet requirements. We
										facilitate payment (minus our fee).
									</p>
									<p>
										We're not responsible for disputes between creators and
										developers, but we provide tools to help resolve issues.
									</p>
								</section>

								<hr />

								<section id="pricing">
									<h2>Pricing & Fees</h2>
									<p>
										See our <Link href="/pricing">pricing page</Link> for
										current rates. Platform fees apply to transactions. All
										prices in USD.
									</p>
								</section>

								<hr />

								<section id="subscriptions">
									<h2>Subscriptions & Billing</h2>
									<ul>
										<li>Billed in advance (monthly or annual)</li>
										<li>Auto-renews until you cancel</li>
										<li>Cancel anytime in account settings</li>
										<li>Access continues until end of billing period</li>
									</ul>
								</section>

								<hr />

								<section id="price-changes">
									<h2>Price Changes</h2>
									<p>
										We reserve the right to change prices. We'll give at least{" "}
										<strong>30 days notice</strong> via email before increases
										take effect. You can cancel before the new price applies.
									</p>
								</section>

								<hr />

								<section id="refunds">
									<h2>Refund Policy</h2>
									<p>
										<strong>All fees are non-refundable.</strong> No refunds for
										subscription fees, platform fees, unused time, or early
										cancellation.
									</p>
									<p>
										Exceptional circumstances may be reviewed case-by-case, but
										don't count on it.
									</p>
								</section>

								<hr />

								<section id="termination">
									<h2>Account Termination</h2>
									<p>You can delete your account anytime in settings.</p>
									<p>
										We may suspend or terminate accounts for terms violations,
										fraud, abuse, or legal requirements.
									</p>
									<p>
										<strong>
											No refunds if your account is terminated for violations.
										</strong>
									</p>
								</section>

								<hr />

								<section id="content">
									<h2>Content & Intellectual Property</h2>
									<p>
										You own your content. By posting on bounty.new, you grant us
										a license to display and distribute it as needed to operate
										the service.
									</p>
									<p>
										Don't post content you don't have rights to. The bounty.new
										platform itself belongs to us.
									</p>
								</section>

								<hr />

								<section id="disclaimers">
									<h2>Disclaimers</h2>
									<p>
										Service provided "as is" without warranties. We're not
										liable for downtime or disputes between users. Our liability
										is limited to what you've paid us in the past 12 months.
									</p>
								</section>

								<hr />

								<section id="changes">
									<h2>Changes to Terms</h2>
									<ul>
										<li>We'll update the "Last updated" date at the top</li>
										<li>
											For material changes, we'll notify you via email or
											through the app
										</li>
										<li>
											Continued use of bounty.new after changes means you accept
											the new terms
										</li>
									</ul>
									<p>
										We recommend checking back occasionally, but we won't make
										sneaky changes without telling you.
									</p>
								</section>

								<hr />

								<section id="contact">
									<h2>Contact</h2>
									<p>
										Questions?{" "}
										<a href="mailto:support@bounty.new">support@bounty.new</a>
									</p>
								</section>
							</div>
						</div>
					</div>
				</div>
			</section>

			<Footer />
		</div>
	);
}
