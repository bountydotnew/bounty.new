import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";

const http = httpRouter();

// Stripe webhook handler
http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request: Request) => {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2025-08-27.basil" as any,
    });

    const body = await request.text();
    const sig = request.headers.get("stripe-signature");

    if (!sig) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
      });
    }

    try {
      // CRITICAL: Use constructEventAsync (NOT constructEvent)
      const event = await stripe.webhooks.constructEventAsync(
        body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      // Handle the event
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const clerkUserId = session.metadata?.clerkUserId;

          // Handle subscription checkout
          if (session.mode === "subscription") {
            const subscriptionId = session.subscription as string;

            if (!clerkUserId || !subscriptionId) {
              console.error("Missing clerkUserId or subscriptionId");
              break;
            }

            // Retrieve subscription to get period end
            const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);

            let currentPeriodEnd = subscription.current_period_end;

            // Fallback: If current_period_end is not available, calculate one month from now
            if (!currentPeriodEnd) {
              console.log(`⚠️ current_period_end not found, calculating one month from now`);
              const oneMonthFromNow = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days in seconds
              currentPeriodEnd = oneMonthFromNow;
            }

            // Update user membership
            const { internal } = await import("./_generated/api.js");
            await ctx.runMutation(internal.stripeDb.updateMembershipStatus, {
              clerkUserId,
              stripeSubscriptionId: subscriptionId,
              currentPeriodEnd,
            });

            console.log(`✅ Pro membership activated for user: ${clerkUserId}`);
          }

          // Handle one-time payment checkout
          if (session.mode === "payment") {
            console.log(`✅ One-time payment completed for user: ${clerkUserId}`);
          }

          break;
        }

        case "customer.subscription.updated": {
          // Handle subscription renewal/update
          const subscription = event.data.object as any;
          const clerkUserId = subscription.metadata?.clerkUserId;

          if (!clerkUserId) {
            console.error("Missing clerkUserId in subscription metadata");
            break;
          }

          const currentPeriodEnd = subscription.current_period_end;

          if (!currentPeriodEnd) {
            console.error("No current_period_end found");
            break;
          }

          // Update membership expiry (handles renewals)
          const { internal } = await import("./_generated/api.js");
          await ctx.runMutation(internal.stripeDb.updateMembershipStatus, {
            clerkUserId,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd,
          });

          console.log(`✅ Subscription updated for user: ${clerkUserId}`);
          break;
        }

        case "customer.subscription.deleted": {
          // Handle subscription cancellation
          const subscription = event.data.object as any;

          const { internal } = await import("./_generated/api.js");
          await ctx.runMutation(internal.stripeDb.cancelMembership, {
            stripeSubscriptionId: subscription.id,
          });

          console.log(`✅ Subscription canceled: ${subscription.id}`);
          break;
        }

        case "invoice.payment_failed": {
          // Handle failed payment
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;

          if (!subscriptionId) {
            console.error("No subscription ID in failed invoice");
            break;
          }

          const attemptCount = invoice.attempt_count || 0;

          const { internal } = await import("./_generated/api.js");
          await ctx.runMutation(internal.stripeDb.handlePaymentFailure, {
            stripeSubscriptionId: subscriptionId,
            attemptCount,
          });

          console.log(`⚠️ Payment failed for subscription: ${subscriptionId}, attempt: ${attemptCount}`);
          break;
        }

        case "invoice.paid": {
          // Confirm successful payment (handles renewals)
          const invoice = event.data.object as any;
          const subscriptionId = invoice.subscription;

          if (!subscriptionId) {
            break; // One-time invoice, not subscription
          }

          const subscription: any = await stripe.subscriptions.retrieve(subscriptionId);
          const clerkUserId = subscription.metadata?.clerkUserId;
          const currentPeriodEnd = subscription.current_period_end;

          if (!clerkUserId || !currentPeriodEnd) {
            console.error("Missing data for invoice.paid event");
            break;
          }

          const { internal } = await import("./_generated/api.js");
          await ctx.runMutation(internal.stripeDb.updateMembershipStatus, {
            clerkUserId,
            stripeSubscriptionId: subscriptionId,
            currentPeriodEnd,
          });

          console.log(`✅ Invoice paid for user: ${clerkUserId}`);
          break;
        }
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
      });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response(
        JSON.stringify({ error: err instanceof Error ? err.message : "Webhook error" }),
        { status: 400 }
      );
    }
  }),
});

export default http;