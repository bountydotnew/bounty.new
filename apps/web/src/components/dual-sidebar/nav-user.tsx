"use client";

import {
  BadgeCheck,
  Bell,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { authClient } from "@bounty/auth/client";
import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useBilling } from "@/hooks/use-billing";
import { toast } from "sonner";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}) {
  const { isMobile } = useSidebar();
  const { data: session } = authClient.useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const { isPro, isLoading: isBillingLoading, openBillingPortal, checkout } = useBilling();

  const handleSubscription = async () => {
    setPricingDialogOpen(true); 
  };

  const handleUpgrade = async () => {
    if (!session?.user) {
      toast.error("Please sign in to upgrade your account.");
      return;
    }

    try {
      setIsLoading(true);
      await checkout("pro-annual");
      toast.success("Redirecting to checkout...");
    } catch (error) {
      console.error("Checkout failed:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    if (!session?.user) {
      toast.error("Please sign in to access billing.");
      return;
    }

    try {
      await openBillingPortal();
      toast.success("Opening billing portal...");
    } catch (error) {
      console.error("Failed to open billing portal:", error);
      toast.error("Failed to open billing portal. Please try again.");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton>
              <div>
                <Avatar className="h-8 w-8 rounded-lg">
                  {session?.user?.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
                  <AvatarFallback className="rounded-lg">{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {session?.user?.image && <AvatarImage src={session.user.image} alt={session.user.name} />}
                  <AvatarFallback className="rounded-lg">{session?.user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{session?.user?.name}</span>
                    {!isBillingLoading && isPro && <span className="text-xs text-muted-foreground">Pro</span>}
                  </div>
                  <span className="truncate text-xs">{session?.user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {!isBillingLoading && !isPro && (
                <DropdownMenuItem onClick={handleUpgrade} disabled={isLoading}>
                  {isLoading ? (
                    <svg className="mr-2 h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <Sparkles />
                  )}
                  Upgrade to Pro
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleBillingPortal}>
                <CreditCard />
                Billing
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => authClient.signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
