'use client';

import { useSession } from '@/context/session-context';
import { useState } from 'react';
import { toast } from 'sonner';
import { AccountDropdown } from '@/components/billing/account-dropdown';
import { PricingDialog } from '@/components/billing/pricing-dialog';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';

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
  const { session, isPending } = useSession();
  const isAuthenticated = !!session?.user;

  const handleUpgrade = async () => {
    if (!session?.user) {
      toast.error('Please sign in to upgrade your account.');
      return;
    }

    setPricingDialogOpen(true);
  };

  return (
    <>
      {isAuthenticated && !isPending && <NotificationsDropdown />}
      <AccountDropdown onUpgradeClick={handleUpgrade} user={user} />

      <PricingDialog
        onOpenChange={setPricingDialogOpen}
        open={pricingDialogOpen}
      />
    </>
  );
}
