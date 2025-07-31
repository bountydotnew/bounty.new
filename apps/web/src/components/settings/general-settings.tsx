"use client";

import { useState, useEffect } from "react";
import { authClient } from "@bounty/auth/client";
import { useBilling } from "@/hooks/use-billing";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
    
export function GeneralSettings() {
  const [isClientMounted, setIsClientMounted] = useState(false);
  const { data: session } = authClient.useSession();
  const { isPro, isLoading: billingLoading } = useBilling();
  const router = useRouter();
  // Prevent hydration mismatch by ensuring client-side rendering
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to sign out");
    }
  };

  // Don't render until client is mounted to prevent hydration issues
  if (!isClientMounted || !session) {
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
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || session?.user?.email} />
              <AvatarFallback>{session?.user?.name?.[0] || session?.user?.email[0]}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{session?.user?.name || "No name set"}</h3>
                {isPro && (
                  <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Pro
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{session?.user?.email}</p>
              <Badge variant="secondary">User ID: {session?.user?.id}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Features */}
      <Card>
        <CardHeader>
          <CardTitle>Current Features</CardTitle>
        </CardHeader>
        <CardContent>
          {billingLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-sm text-muted-foreground">Loading features...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Lower Fees</span>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Reduced platform fees on bounties
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Concurrent Bounties</span>
                  <Badge variant={isPro ? "default" : "secondary"}>
                    {isPro ? "Unlimited" : "Limited"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Create multiple active bounties
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Payment Button</span>
                  <Badge variant="default">
                    Available
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Embeddable payment buttons for GitHub
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Passkey Security</span>
                  <Badge variant="default">
                    Available
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Passwordless authentication
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Sign Out</h4>
              <p className="text-sm text-muted-foreground">Sign out of your account</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}