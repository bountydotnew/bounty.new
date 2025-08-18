"use client";

import { useState, useEffect } from "react";
import { useBilling } from "@/hooks/use-billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";

export function BillingSettings() {
  const [isClientMounted, setIsClientMounted] = useState(false);
  const {
    isPro,
    customer,
    isLoading: billingLoading,
    openBillingPortal,
  } = useBilling();

  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Don't render until client is mounted to prevent hydration issues
  if (!isClientMounted) {
    return (
      <Card>
        <CardContent className="p-6">
          <Loader2 className="animate-spin" size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Plan & Subscription Details - Merged */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan & Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {billingLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm text-muted-foreground">
                Loading subscription...
              </span>
            </div>
          ) : (
            <>
              {/* Plan Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isPro ? "default" : "secondary"}
                    className={
                      isPro
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : ""
                    }
                  >
                    {isPro ? "Pro" : "Free"}
                  </Badge>
                  {isPro && (
                    <span className="text-sm text-muted-foreground">
                      Active subscription
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPro
                    ? "You have access to all Pro features"
                    : "Upgrade to unlock all features"}
                </p>
              </div>

              {/* Active Subscriptions - Only show if Pro */}
              {customer &&
                isPro &&
                customer.activeSubscriptions &&
                customer.activeSubscriptions.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-muted-foreground">
                        Active Subscriptions
                      </h5>
                      <div className="space-y-2">
                        {customer.activeSubscriptions.map(
                          (subscription, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {subscription.productId || "Pro Plan"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    Active subscription
                                  </p>
                                </div>
                                <Badge variant="outline">Active</Badge>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  </>
                )}

              {/* Billing Portal Info - Only show if Pro */}
              {isPro && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium">Billing Portal Access</h4>
                    <p className="text-sm text-muted-foreground">
                      Manage your subscription, payment methods, and billing
                      history through the Stripe billing portal.
                    </p>
                  </div>
                </>
              )}

              {/* Single Action Button */}
              <Separator />
              <div className="flex justify-end">
                <Button onClick={openBillingPortal} variant="outline">
                  {isPro ? "Manage Billing" : "Upgrade to Pro"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pro Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Pro Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              className={`p-3 border rounded-lg ${!isPro ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Lower Fees</span>
                <Badge variant={isPro ? "default" : "secondary"}>
                  {isPro ? "Enabled" : "Pro Only"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Reduced platform fees on bounties
              </p>
            </div>
            <div
              className={`p-3 border rounded-lg ${!isPro ? "opacity-60" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Unlimited Concurrent Bounties
                </span>
                <Badge variant={isPro ? "default" : "secondary"}>
                  {isPro ? "Enabled" : "Pro Only"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Create multiple active bounties
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Priority Support</span>
                <Badge variant={isPro ? "default" : "secondary"}>
                  {isPro ? "Enabled" : "Pro Only"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Get faster responses from our support team
              </p>
            </div>
            <div className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Advanced Analytics</span>
                <Badge variant="secondary">Coming Soon</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed insights into your bounty performance
              </p>
            </div>
          </div>

          {!isPro && (
            <>
              <Separator className="my-4" />
              <div className="text-center space-y-3">
                <h4 className="font-medium">Upgrade to Pro</h4>
                <p className="text-sm text-muted-foreground">
                  Get access to lower fees, unlimited concurrent bounties, and
                  more features.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
