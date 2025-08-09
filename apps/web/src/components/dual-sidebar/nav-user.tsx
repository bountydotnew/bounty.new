"use client";

import { authClient } from "@bounty/auth/client";
import { useState } from "react";
import { toast } from "sonner";
import { PricingDialog } from "@/components/billing/pricing-dialog";
import { AccountDropdown } from "@/components/billing/account-dropdown";

export function NavUser({
  user,
}: {
  user: {
    name: string;
    email: string;
    image: string | null;
  };
}) {
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const { data: session } = authClient.useSession();

  const handleUpgrade = async () => {
    if (!session?.user) {
      toast.error("Please sign in to upgrade your account.");
      return;
    }

    setPricingDialogOpen(true);
  };

  return (
    <>
      <AccountDropdown user={user} onUpgradeClick={handleUpgrade} />
      
      <PricingDialog
        open={pricingDialogOpen}
        onOpenChange={setPricingDialogOpen}
      />
    </>
  );
}
