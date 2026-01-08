// UpgradeButton.tsx
"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function UpgradeButton() {
  const { user } = useUser();
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const [loading, setLoading] = useState(false);

  // Get current user's membership status
  const membership = useQuery(
    api.stripeDb.getCurrentUserMembership,
    user ? { clerkUserId: user.id } : "skip"
  );

  const handleUpgrade = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await createCheckoutSession({
        clerkUserId: user.id,
        mode: "subscription", // or "payment" for one-time
      });

      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Failed to create checkout session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything if user is not loaded
  if (!user) return null;

  // Show current plan status
  const isPro = membership?.membershipStatus === "pro";
  const isPastDue = membership?.membershipStatus === "past_due";

  if (loading) {
    return (
      <Button
        disabled
        className="bg-gradient-to-r from-purple-600 to-pink-600"
      >
        Loading...
      </Button>
    );
  }

  if (isPro) {
    return (
      <Button
        variant="outline"
        className="border-green-500 text-green-600 hover:bg-green-50"
        disabled
      >
        ✓ Pro Plan Active
      </Button>
    );
  }

  if (isPastDue) {
    return (
      <Button
        onClick={handleUpgrade}
        className="bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
      >
        Reactivate Pro - $20/month
      </Button>
    );
  }

  return (
    <Button
      onClick={handleUpgrade}
      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
    >
      Upgrade to Pro - $20/month
    </Button>
  );
}

// ManageBillingButton.tsx
"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ManageBillingButton() {
  const { user } = useUser();
  const createPortalSession = useAction(api.stripe.createCustomerPortalSession);
  const [loading, setLoading] = useState(false);

  const handleManageBilling = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const result = await createPortalSession({
        clerkUserId: user.id,
      });

      if (result.url) {
        window.open(result.url, "_blank");
      }
    } catch (error) {
      console.error("Error creating portal session:", error);
      alert("Failed to open billing portal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleManageBilling}
      disabled={loading}
      variant="outline"
    >
      {loading ? "Loading..." : "Manage Billing"}
    </Button>
  );
}