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
  refreshUrl: string
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

  const cardPaymentsActive =
    account.capabilities?.card_payments === "active";
  const transfersActive =
    account.capabilities?.transfers === "active";
  
  // Check if onboarding is complete
  // For Express accounts, check if charges_enabled and details_submitted
  const onboardingComplete =
    account.details_submitted === true &&
    account.charges_enabled === true;

  return {
    cardPaymentsActive: cardPaymentsActive || false,
    transfersActive: transfersActive || false,
    onboardingComplete,
    account,
  };
}

/**
 * Get a link to the Stripe Express Dashboard for a connected account
 */
export async function createDashboardLink(
  accountId: string,
  returnUrl: string
) {
  return stripeClient.accountLinks.create({
    account: accountId,
    return_url: returnUrl,
    type: "account_update",
  });
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
  return createAccountLink(params.accountId, params.returnUrl, params.refreshUrl);
}
