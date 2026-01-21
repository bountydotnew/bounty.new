'use client';

import { authClient } from '@bounty/auth/client';
import { useSession } from '@/context/session-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useBilling } from '@/hooks/use-billing';
import { cn } from '@bounty/ui';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { toast } from 'sonner';
import { LINKS } from '@/constants';
import type {
  AccountDropdownProps,
  UserDisplayData,
} from '@/types/billing-components';
import { AccountSwitcher } from '@/components/auth/account-switcher';
import { SwitchUsersIcon } from '@bounty/ui/components/icons/huge/switch-users';
import { SettingsGearIcon } from '@bounty/ui/components/icons/huge/settings-gear';
import { SwitchWorkspaceIcon } from '@bounty/ui/components/icons/huge/switch-workspace';
import { ManageUsersWorkspaceIcon } from '@bounty/ui/components/icons/huge/manage-users-workspace';
import { BillingSettingsIcon } from '@bounty/ui/components/icons/huge/billing-settings';
import { DropdownIcon } from '@bounty/ui';
import { Feedback } from '@bounty/ui';
import { UserIcon } from '@bounty/ui';
import { useFeedback } from '@/components/feedback-context';
import { useUser } from '@/context/user-context';
import { useState, useTransition } from 'react';
import { PricingDialog } from '@/components/billing/pricing-dialog';

// Constants for better maintainability
const MESSAGES = {
  BILLING_PORTAL_ERROR: 'Failed to open billing portal. Please try again.',
  BILLING_PORTAL_SUCCESS: 'Opening billing portal...',
  SIGN_IN_REQUIRED: 'Please sign in to access billing.',
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
  const { session } = useSession();
  const { openBillingPortal } = useBilling();

  const handleBillingPortal = React.useCallback(async () => {
    if (!session?.user) {
      toast.error(MESSAGES.SIGN_IN_REQUIRED);
      return;
    }

    try {
      await openBillingPortal();
      toast.success(MESSAGES.BILLING_PORTAL_SUCCESS);
    } catch (error) {
      console.error('Billing portal error', error);
      toast.error(MESSAGES.BILLING_PORTAL_ERROR);
    }
  }, [session?.user, openBillingPortal]);

  return handleBillingPortal;
}

// Custom hook for sign out functionality
function useSignOut() {
  const router = useRouter();
  const [pending, startSignOut] = useTransition();

  const handleSignOut = React.useCallback(() => {
    startSignOut(() => {
      authClient
        .signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push(LOGIN_REDIRECT);
            },
          },
        })
        .catch((error) => {
          console.error('Sign out failed', error);
          toast.error('Failed to sign out. Please try again.');
        });
    });
  }, [router]);

  return { handleSignOut, pending };
}

// Main component
export function AccountDropdown({
  user,
  children,
  onOpenChange: externalOnOpenChange,
  onUpgradeClick,
}: AccountDropdownProps & {
  children?: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const { session } = useSession();
  const { user: currentUser } = useUser();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      setMenuOpen(open);
      externalOnOpenChange?.(open);
    },
    [externalOnOpenChange]
  );

  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const handleUpgrade = async () => {
    if (!session?.user) {
      toast.error('Please sign in to upgrade your account.');
      return;
    }

    setPricingDialogOpen(true);
  };

  // Custom hooks for better separation of concerns
  const userDisplay = useUserDisplay(session?.user, user);
  const handleBillingPortal = useBillingPortal();
  const { handleSignOut, pending: signOutPending } = useSignOut();
  const { startSelection } = useFeedback();

  const profileHref = currentUser?.handle
    ? `/profile/${currentUser.handle}`
    : null;

  const handleProfileNavigation = () => {
    if (!profileHref) {
      return;
    }
    setMenuOpen(false);
    router.push(profileHref);
  };

  return (
    <>
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

              <AccountSwitcher
                currentUserId={session?.user?.id}
                trigger={
                  <button
                    className="cursor-pointer transition-opacity hover:opacity-70"
                    type="button"
                    aria-label="Switch account"
                  >
                    <SwitchUsersIcon className="h-[19px] w-[19px] text-text-secondary" />
                  </button>
                }
              />
            </div>
            <button
              className="flex items-center gap-2 rounded-[10px] px-0 py-1.5 text-text-tertiary transition-colors hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleProfileNavigation}
              disabled={!profileHref}
              type="button"
            >
              <UserIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Profile
              </span>
            </button>
            <button
              className="flex items-center gap-2 rounded-[10px] px-0 py-1.5 text-text-tertiary transition-colors hover:text-white"
              onClick={() => {
                setMenuOpen(false);
                router.push(LINKS.SETTINGS);
              }}
              type="button"
            >
              <SettingsGearIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Settings
              </span>
            </button>
          </div>

          {/* Actions section */}
          <div className="flex flex-col gap-2 border-b border-[#292828] px-0 py-2">
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white focus:bg-nav-hover-bg"
              onClick={() => {
                setMenuOpen(false);
                handleUpgrade();
              }}
            >
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Upgrade
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center justify-between rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white focus:bg-nav-hover-bg"
              onClick={() => setMenuOpen(false)}
            >
              <div className="flex items-center gap-2.25">
                <SwitchWorkspaceIcon className="h-[19px] w-[19px]" />
                <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                  Switch workspace
                </span>
              </div>
              <DropdownIcon className="h-[19px] w-[19px] -rotate-90" />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white focus:bg-nav-hover-bg"
              onClick={() => setMenuOpen(false)}
            >
              <ManageUsersWorkspaceIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Manage members
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white focus:bg-nav-hover-bg"
              onClick={() => {
                setMenuOpen(false);
                handleBillingPortal();
              }}
            >
              <BillingSettingsIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Billing
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-white focus:bg-nav-hover-bg"
              onClick={() => {
                setMenuOpen(false);
                setTimeout(() => startSelection(), 100);
              }}
            >
              <Feedback className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Send Feedback
              </span>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="border-[#292828]" />

          <DropdownMenuItem
            className={cn(
              'flex items-center gap-2 rounded-[10px] px-4 py-2 text-text-secondary transition-colors hover:text-white focus:bg-nav-hover-bg',
              signOutPending && 'opacity-70'
            )}
            disabled={signOutPending}
            onClick={() => {
              setMenuOpen(false);
              handleSignOut();
            }}
          >
            <LogOut className="h-[19px] w-[19px] text-red-500" />
            <span className="text-[16px] font-medium leading-[150%] tracking-[0.03em] text-red-500">
              Sign out
            </span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <PricingDialog
        onOpenChange={setPricingDialogOpen}
        open={pricingDialogOpen}
      />
    </>
  );
}
