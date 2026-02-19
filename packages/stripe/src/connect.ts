import { stripeClient } from "./client";

/**
 * Create a Stripe Connect Express account
 * Express accounts are the simplest to set up and use Stripe's hosted onboarding
 */
export async function createConnectAccount(email: string, displayName: string) {
	return stripeClient.accounts.create({
		type: "express",
		country: "US",
		email: email,
		capabilities: {
			card_payments: { requested: true },
			transfers: { requested: true },
		},
	});
}

/**
 * Create an Account Link for onboarding a connected account
 * This redirects to Stripe's hosted onboarding flow
 */
export async function createAccountLink(
	accountId: string,
	returnUrl: string,
	refreshUrl: string,
) {
	return stripeClient.accountLinks.create({
		account: accountId,
		refresh_url: refreshUrl,
		return_url: `${returnUrl}?accountId=${accountId}`,
		type: "account_onboarding",
	});
}

/**
 * Get the status of a Connect account
 * Returns whether card payments are active and if onboarding is complete
 */
export async function getConnectAccountStatus(accountId: string) {
	const account = await stripeClient.accounts.retrieve(accountId);

	const cardPaymentsActive = account.capabilities?.card_payments === "active";
	const transfersActive = account.capabilities?.transfers === "active";

	// Check if onboarding is complete
	// For Express accounts, check if charges_enabled, details_submitted, and payouts_enabled
	// Also check that there are no pending requirements
	const hasNoPendingRequirements =
		(!account.requirements?.currently_due ||
			account.requirements.currently_due.length === 0) &&
		(!account.requirements?.past_due ||
			account.requirements.past_due.length === 0);

	const onboardingComplete =
		account.details_submitted === true &&
		account.charges_enabled === true &&
		account.payouts_enabled === true &&
		hasNoPendingRequirements;

	return {
		cardPaymentsActive: cardPaymentsActive || false,
		transfersActive: transfersActive || false,
		onboardingComplete,
		account,
	};
}

/**
 * Create a login link for the Stripe Express Dashboard
 * This allows connected accounts to access their Express Dashboard
 * See: https://docs.stripe.com/connect/express-dashboard#create-a-login-link
 */
export async function createLoginLink(accountId: string) {
	return stripeClient.accounts.createLoginLink(accountId);
}

/**
 * Create a Connect account link for onboarding
 * This is a convenience wrapper that creates an onboarding link
 */
export async function createConnectAccountLink(params: {
	accountId: string;
	returnUrl: string;
	refreshUrl: string;
}) {
	return createAccountLink(
		params.accountId,
		params.returnUrl,
		params.refreshUrl,
	);
}

/**
 * Get the balance for a Connect account
 * Returns the available balance, pending balance, and other balance information
 */
export async function getConnectAccountBalance(accountId: string) {
	const balance = await stripeClient.balance.retrieve({
		stripeAccount: accountId,
	});

	return {
		available: balance.available.map((b) => ({
			amount: b.amount,
			currency: b.currency,
			sourceTypes: b.source_types,
		})),
		pending: balance.pending.map((b) => ({
			amount: b.amount,
			currency: b.currency,
			sourceTypes: b.source_types,
		})),
		connectReserved:
			balance.connect_reserved?.map((b) => ({
				amount: b.amount,
				currency: b.currency,
			})) || [],
	};
}
