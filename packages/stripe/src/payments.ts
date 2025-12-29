import { stripeClient } from "./client";

/**
 * Calculate application fee to break even with Stripe's processing fees
 * Stripe charges 2.9% + $0.30 per transaction
 * This function calculates the fee needed to cover those costs
 */
function calculateBreakEvenFee(amount: number): number {
  // Stripe's fee: 2.9% + $0.30
  const stripeFee = Math.round(amount * 0.029 + 30);
  return stripeFee;
}

/**
 * Create a Checkout Session for bounty payment
 * Uses Stripe's hosted Checkout page - no custom card input needed
 * 
 * For marketplace model: Platform collects payment, will transfer to solver later
 */
export async function createBountyCheckoutSession(params: {
  bountyId: string;
  amount: number; // Amount in cents
  currency: string;
  successUrl: string;
  cancelUrl: string;
  applicationFeePercent?: number; // Optional override, otherwise uses break-even calculation
}) {
  // Calculate application fee - break even with Stripe fees by default
  const applicationFee = params.applicationFeePercent
    ? Math.round(params.amount * (params.applicationFeePercent / 100))
    : calculateBreakEvenFee(params.amount);

  // Create Checkout Session - Stripe handles all payment UI
  return stripeClient.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amount,
          product_data: {
            name: `Bounty Payment`,
            description: `Escrow payment for bounty`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      capture_method: "automatic", // Capture immediately, hold in platform account
      metadata: { bountyId: params.bountyId },
    },
    metadata: {
      bountyId: params.bountyId,
      applicationFee: applicationFee.toString(),
    },
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: params.cancelUrl,
  });
}

/**
 * Transfer funds to a solver's Connect account
 * Net amount = original amount - application fee
 */
export async function transferToSolver(params: {
  amount: number; // Original bounty amount in cents
  connectAccountId: string; // Solver's Connect account ID (acct_...)
  bountyId: string;
  applicationFee: number; // Application fee in cents
}) {
  const netAmount = params.amount - params.applicationFee;

  if (netAmount <= 0) {
    throw new Error("Net amount after application fee must be positive");
  }

  return stripeClient.transfers.create({
    amount: netAmount,
    currency: "usd",
    destination: params.connectAccountId,
    metadata: { bountyId: params.bountyId },
  });
}

/**
 * Refund a payment intent (for cancelled bounties)
 */
export async function refundPayment(paymentIntentId: string) {
  return stripeClient.refunds.create({
    payment_intent: paymentIntentId,
  });
}
