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
 * Calculate total payment amount including Stripe fees
 * Returns the amount the user needs to pay (bounty amount + fees)
 */
export function calculateTotalWithFees(bountyAmount: number): {
  bountyAmount: number;
  fees: number;
  total: number;
} {
  // Stripe's fee: 2.9% + $0.30
  const fees = Math.round(bountyAmount * 0.029 + 30);
  const total = bountyAmount + fees;
  
  return {
    bountyAmount,
    fees,
    total,
  };
}

/**
 * Create a PaymentIntent to hold funds for a bounty
 * The payment will be held until the bounty is completed or cancelled
 */
export async function createPaymentIntent(params: {
  amount: number; // Amount in cents
  currency: string;
  customerId: string; // Stripe customer ID
  bountyId: string;
}) {
  return stripeClient.paymentIntents.create({
    amount: params.amount,
    currency: params.currency.toLowerCase(),
    customer: params.customerId,
    capture_method: "manual", // Hold funds, don't capture immediately
    metadata: {
      bountyId: params.bountyId,
    },
  });
}

/**
 * Capture a PaymentIntent to release funds to the platform
 * This is called after payment is confirmed via Stripe Elements
 */
export async function capturePayment(paymentIntentId: string) {
  return stripeClient.paymentIntents.capture(paymentIntentId);
}

/**
 * Create a Checkout Session for bounty payment
 * Uses Stripe's hosted Checkout page - no custom card input needed
 * 
 * For marketplace model: Platform collects payment, will transfer to solver later
 */
export async function createBountyCheckoutSession(params: {
  bountyId: string;
  amount: number; // Amount in cents (bounty amount only, fees added separately)
  fees: number; // Fees in cents
  currency: string;
  customerId: string; // Stripe customer ID
  successUrl: string;
  cancelUrl: string;
}) {
  const totalAmount = params.amount + params.fees;

  // Create Checkout Session - Stripe handles all payment UI
  return stripeClient.checkout.sessions.create({
    mode: "payment",
    customer: params.customerId,
    line_items: [
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.amount,
          product_data: {
            name: `Bounty creation deposit`,
            description: `Upfront bounty creation deposit`,
          },
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: params.currency.toLowerCase(),
          unit_amount: params.fees,
          product_data: {
            name: `Processing Fees`,
            description: `Stripe processing fees (2.9% + $0.30)`,
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      capture_method: "automatic", // Capture immediately - funds held in platform account
      metadata: { bountyId: params.bountyId },
    },
    metadata: {
      bountyId: params.bountyId,
    },
    success_url: `${params.successUrl}?session_id={CHECKOUT_SESSION_ID}&payment=success`,
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
 * Create a transfer to a Connect account (for bounty payouts)
 * This is a simpler version that transfers the full amount
 */
export async function createTransfer(params: {
  amount: number; // Amount in cents
  connectAccountId: string; // Solver's Connect account ID
  bountyId: string;
}) {
  return stripeClient.transfers.create({
    amount: params.amount,
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
