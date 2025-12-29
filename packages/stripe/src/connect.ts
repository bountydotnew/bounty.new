import { stripeClient } from "./client";

/**
 * Create a Stripe Connect account using V2 API
 * V2 accounts don't use top-level 'type' field - configuration is set via configuration object
 */
export async function createConnectAccount(email: string, displayName: string) {
  return stripeClient.v2.core.accounts.create({
    display_name: displayName,
    contact_email: email,
    identity: { country: "us" },
    dashboard: "full",
    defaults: {
      responsibilities: {
        fees_collector: "stripe",
        losses_collector: "stripe",
      },
    },
    configuration: {
      customer: {},
      merchant: {
        capabilities: {
          card_payments: { requested: true },
        },
      },
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
  return stripeClient.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant", "customer"],
        refresh_url: refreshUrl,
        return_url: `${returnUrl}?accountId=${accountId}`,
      },
    },
  });
}

/**
 * Get the status of a Connect account
 * Returns whether card payments are active and if onboarding is complete
 */
export async function getConnectAccountStatus(accountId: string) {
  const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.merchant", "requirements"],
  });

  const cardPaymentsActive =
    account?.configuration?.merchant?.capabilities?.card_payments?.status ===
    "active";
  const requirementsStatus =
    account.requirements?.summary?.minimum_deadline?.status;
  const onboardingComplete =
    requirementsStatus !== "currently_due" && requirementsStatus !== "past_due";

  return { cardPaymentsActive, onboardingComplete, account };
}

/**
 * Get a link to the Stripe Express Dashboard for a connected account
 */
export async function createDashboardLink(
  accountId: string,
  returnUrl: string
) {
  return stripeClient.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_management",
      account_management: {
        return_url: returnUrl,
      },
    },
  });
}
