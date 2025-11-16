'use client';

import { authClient } from '@bounty/auth/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useBilling } from '@/hooks/use-billing';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { LINKS } from '@/constants';
import type {
  AccountDropdownProps,
  UserDisplayData,
} from '@/types/billing-components';
import {
  HugeSettingsIcon,
  SwitchWorkspaceIcon,
  ManageUsersWorkspaceIcon,
  BillingSettingsIcon,
  DropdownIcon,
  SwitchUsersIcon,
} from '@bounty/ui';

// Constants for better maintainability
const MESSAGES = {
  SIGN_IN_REQUIRED: 'Please sign in to access billing.',
  BILLING_PORTAL_SUCCESS: 'Opening billing portal...',
  BILLING_PORTAL_ERROR: 'Failed to open billing portal. Please try again.',
  LOADING: 'Loading...',
  CHECKING_SUBSCRIPTION: 'Checking...',
  VERIFYING_SUBSCRIPTION: 'Verifying subscription...',
  PRO_BADGE: 'Pro',
} as const;

const LOGIN_REDIRECT = '/login';

// Custom hook for user display logic
function useUserDisplay(
  sessionUser?: { name?: string; email?: string; image?: string | null } | null,
  fallbackUser?: { name?: string; email?: string; image?: string | null }
): UserDisplayData {
  return React.useMemo(() => {
    const user = sessionUser || fallbackUser;
    const name = user?.name || '';
    const email = user?.email || '';
    const image = user?.image || null;
    const initials = name ? name.charAt(0).toUpperCase() : '?';

    return { name, email, image, initials };
  }, [sessionUser, fallbackUser]);
}

// Custom hook for billing portal operations
function useBillingPortal() {
  const { data: session } = authClient.useSession();
  const { openBillingPortal } = useBilling({ enabled: false });

  const handleBillingPortal = React.useCallback(async () => {
    if (!session?.user) {
      toast.error(MESSAGES.SIGN_IN_REQUIRED);
      return;
    }

    try {
      await openBillingPortal();
      toast.success(MESSAGES.BILLING_PORTAL_SUCCESS);
    } catch (_error) {
      toast.error(MESSAGES.BILLING_PORTAL_ERROR);
    }
  }, [session?.user, openBillingPortal]);

  return handleBillingPortal;
}

// Custom hook for sign out functionality
function useSignOut() {
  const router = useRouter();
  return React.useCallback(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(LOGIN_REDIRECT);
        },
      },
    });
  }, [router]);
}

// Main component
export function AccountDropdown({
  user,
  children,
  onOpenChange: externalOnOpenChange,
}: AccountDropdownProps & {
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      externalOnOpenChange?.(open);
    },
    [externalOnOpenChange]
  );

  // Custom hooks for better separation of concerns
  const userDisplay = useUserDisplay(session?.user, user);
  const handleBillingPortal = useBillingPortal();
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu onOpenChange={handleOpenChange} open={menuOpen}>
      <DropdownMenuTrigger asChild>
        {children || (
          <button
            aria-label={`Account menu for ${userDisplay.name}`}
            type="button"
          >
            {userDisplay.name}
          </button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="rounded-[15px] w-74 bg-nav-active-bg border border-card-border-color">
        {/* User header section */}
        <div className="flex flex-col gap-1.5 border-b border-[#292828] px-4 py-1.5">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0">
              <div className="text-lg font-medium leading-[150%] text-text-workspace">
                {userDisplay.name}
              </div>
              <div className="text-base font-medium leading-[150%] tracking-[0.03em] text-[#999999]">
                {userDisplay.email}
              </div>
            </div>
            <SwitchUsersIcon className="h-[19px] w-[19px] text-text-secondary" />
          </div>
          <button
            className="flex items-center gap-2 rounded-[10px] px-0 py-1.5 text-text-tertiary transition-colors hover:text-white"
            onClick={() => router.push(LINKS.SETTINGS)}
            type="button"
          >
            <HugeSettingsIcon className="h-[19px] w-[19px]" />
            <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
              Settings
            </span>
          </button>
        </div>

        {/* Actions section */}
        <div className="flex flex-col gap-2 border-b border-[#292828] px-0 py-2">
          <button
            className="flex items-center justify-between rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white"
            type="button"
          >
            <div className="flex items-center gap-2.25">
              <SwitchWorkspaceIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Switch workspace
              </span>
            </div>
            <DropdownIcon className="h-[19px] w-[19px] -rotate-90" />
          </button>
          <button
            className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white"
            type="button"
          >
            <ManageUsersWorkspaceIcon className="h-[19px] w-[19px]" />
            <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
              Manage members
            </span>
          </button>
          <button
            className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white"
            onClick={handleBillingPortal}
            type="button"
          >
            <BillingSettingsIcon className="h-[19px] w-[19px]" />
            <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
              Billing
            </span>
          </button>
        </div>

        {/* Log out section */}
        <div className="px-4 py-0">
          <button
            className="flex items-center gap-2 rounded-[10px] px-0 py-3 text-text-secondary transition-colors hover:text-white"
            onClick={handleSignOut}
            type="button"
          >
            <LogOut className="h-[19px] w-[19px]" />
            <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
              Log Out
            </span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
