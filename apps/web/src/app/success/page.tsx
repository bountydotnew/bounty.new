"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { useBilling } from "@/hooks/use-billing";
import Sidebar from "@/components/dual-sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import { authClient } from "@bounty/auth/client";
import Bounty from "@/components/icons/bounty";
import { useConfetti } from "@/lib/context/confetti-context";
import { Spinner } from "@/components/ui/spinner";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const checkoutId = searchParams.get("checkout_id");
  const { refetch, customer } = useBilling();
  const { data: session } = authClient.useSession();
  const { celebrate } = useConfetti();

  useEffect(() => {
    celebrate();
  }, [celebrate]);

  useEffect(() => {
    if (!checkoutId) {
      router.push("/dashboard");
      return;
    }

    refetch();
  }, [checkoutId, refetch, router]);

  if (!checkoutId) {
    return null;
  }

  interface Subscription {
    productId: string;
  }

  const getPlanName = () => {
    const subscription = customer?.activeSubscriptions?.find(
      (sub: Subscription) =>
        ["pro-monthly", "pro-annual"].includes(sub.productId),
    );

    if (subscription?.productId === "pro-annual") return "Pro Annual";
    if (subscription?.productId === "pro-monthly") return "Pro Monthly";
    return "Pro Plan";
  };

  const getPlanPrice = () => {
    const subscription = customer?.activeSubscriptions?.find(
      (sub: Subscription) =>
        ["pro-monthly", "pro-annual"].includes(sub.productId),
    );

    if (subscription?.productId === "pro-annual") return "$15/month";
    if (subscription?.productId === "pro-monthly") return "$20/month";
    return "Pro Pricing";
  };

  return (
    <Sidebar>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="text-center pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-none rounded-full flex items-center justify-center">
                  <Bounty className="w-20 h-20 text-foreground" />
                </div>
              </div>

              <CardTitle className="text-2xl font-bold text-foreground">
                Welcome to Pro!
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">
                    Purchase Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {getPlanName()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Bounty Pro Subscription
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {getPlanPrice()}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        Active
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">
                        Pro Features Unlocked:
                      </h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>Lower fees on bounty transactions</li>
                        <li>Create multiple concurrent bounties</li>
                        <li>Priority support</li>
                        <li>Early access to new features</li>
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-foreground">
                        Order Details:
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>
                          Checkout ID:{" "}
                          <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                            {checkoutId}
                          </span>
                        </p>
                        <p>Account: {session?.user?.email}</p>
                        <p>
                          Status:{" "}
                          <span className="text-foreground font-medium">
                            Active
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => router.push("/dashboard")}
                >
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => router.push("/bounties")}
                >
                  Browse Bounties
                </Button>
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Need help? Contact our support team or check out our
                  documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Sidebar>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <Sidebar>
          <div className="container mx-auto py-8">
            <Card>
              <CardContent className="p-6">
                <Spinner />
              </CardContent>
            </Card>
          </div>
        </Sidebar>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
