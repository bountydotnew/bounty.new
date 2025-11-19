'use client';

import { authClient } from '@bounty/auth/client';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { BellIcon } from '@bounty/ui/components/bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@bounty/ui/components/sidebar';
import { Spinner } from '@bounty/ui/components/spinner';
import { UserIcon } from '@bounty/ui/components/user';
import { useBilling } from '@/hooks/use-billing';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, LogOut, Shield, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { LINKS } from '@/constants';
import type {
  AccountDropdownProps,
  SessionUser,
  User,
  UserDisplayData,
} from '@/types/billing-components';
import { trpc } from '@/utils/trpc';
import { AccountSwitcher } from '@/components/auth/account-switcher';

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

const MENU_ITEMS = {
  UPGRADE: 'Upgrade to Pro',
  ACCOUNT: 'Account',
  BILLING: 'Billing',
  NOTIFICATIONS: 'Notifications',
  LOGOUT: 'Log out',
} as const;

const LOGIN_REDIRECT = '/login';

// Custom hook for user display logic
function useUserDisplay(
  sessionUser?: SessionUser | null,
  fallbackUser?: User
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
  return useCallback(() => {
    authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push(LOGIN_REDIRECT);
        },
      },
    });
  }, [router]);
}

// Memoized Avatar component to prevent unnecessary re-renders
const UserAvatar = React.memo<{
  userDisplay: UserDisplayData;
  isLoading: boolean;
  className?: string;
}>(({ userDisplay, isLoading, className = 'h-8 w-8 rounded-lg' }) => (
  <Avatar className={className}>
    {userDisplay.image && (
      <AvatarImage
        alt={userDisplay.name}
        onError={(e) => {
          // Fallback to initials if image fails to load
          e.currentTarget.style.display = 'none';
        }}
        src={userDisplay.image}
      />
    )}
    <AvatarFallback className="rounded-lg">
      {isLoading ? (
        <Spinner aria-label="Loading user information" size="sm" />
      ) : (
        userDisplay.initials
      )}
    </AvatarFallback>
  </Avatar>
));

UserAvatar.displayName = 'UserAvatar';

// Memoized dropdown header component
const DropdownHeader = React.memo<{
  userDisplay: UserDisplayData;
  isPro: boolean;
  isLoading: boolean;
}>(({ userDisplay, isPro, isLoading }) => (
  <DropdownMenuLabel className="p-0 font-normal">
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <UserAvatar isLoading={isLoading} userDisplay={userDisplay} />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {isLoading ? MESSAGES.LOADING : userDisplay.name}
          </span>
          {!isLoading && isPro && (
            <span className="text-muted-foreground text-xs">
              {MESSAGES.PRO_BADGE}
            </span>
          )}
          {isLoading && (
            <span className="animate-pulse text-muted-foreground text-xs">
              {MESSAGES.CHECKING_SUBSCRIPTION}
            </span>
          )}
        </div>
        <span className="truncate text-xs">
          {isLoading ? MESSAGES.VERIFYING_SUBSCRIPTION : userDisplay.email}
        </span>
      </div>
    </div>
  </DropdownMenuLabel>
));

DropdownHeader.displayName = 'DropdownHeader';

// Upgrade menu item component
const UpgradeMenuItem = React.memo<{
  isPro: boolean;
  isLoading: boolean;
  onUpgradeClick: () => void;
}>(({ isPro, isLoading, onUpgradeClick }) => {
  if (isLoading) {
    return (
      <DropdownMenuItem aria-label="Loading subscription status" disabled>
        <Spinner className="mr-2" size="sm" />
        Checking subscription...
      </DropdownMenuItem>
    );
  }

  if (!isPro) {
    return (
      <DropdownMenuItem
        aria-label="Upgrade to Pro plan"
        onClick={onUpgradeClick}
      >
        <Sparkles />
        {MENU_ITEMS.UPGRADE}
      </DropdownMenuItem>
    );
  }

  return null;
});

UpgradeMenuItem.displayName = 'UpgradeMenuItem';

// Main component
export function AccountDropdown({
  user,
  onUpgradeClick,
}: AccountDropdownProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();
  const { data: session } = authClient.useSession();
  const [menuOpen, setMenuOpen] = React.useState(false);
  const { isPro, isLoading: isBillingLoading } = useBilling({
    enabled: menuOpen && !!session?.user,
  });
  const { data: me } = useQuery({
    ...trpc.user.getMe.queryOptions(),
    enabled: !!session?.user,
  });
  const isImpersonating = Boolean(
    (session as any)?.session?.impersonatedBy ||
      (session as any)?.impersonatedBy
  );

  // Custom hooks for better separation of concerns
  const userDisplay = useUserDisplay(session?.user, user);
  const handleBillingPortal = useBillingPortal();
  const handleSignOut = useSignOut();

  // Memoize dropdown content positioning
  const dropdownProps = React.useMemo(
    () => ({
      className:
        'w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg',
      side: isMobile ? ('bottom' as const) : ('right' as const),
      align: 'end' as const,
      sideOffset: 4,
    }),
    [isMobile]
  );

  const handleAccountClick = useCallback(() => {
    router.push(LINKS.ACCOUNT);
  }, [router]);

  const handleAdminClick = useCallback(() => {
    if (pathname?.startsWith('/admin')) {
      router.push('/');
    } else {
      router.push('/admin');
    }
  }, [router, pathname]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu onOpenChange={setMenuOpen} open={menuOpen}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              aria-expanded={false}
              aria-label={`Account menu for ${userDisplay.name}`}
            >
              <div>
                <UserAvatar
                  isLoading={isBillingLoading}
                  userDisplay={userDisplay}
                />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent {...dropdownProps}>
            <DropdownHeader
              isLoading={isBillingLoading}
              isPro={isPro}
              userDisplay={userDisplay}
            />

            <DropdownMenuSeparator />

            {/* Upgrade section */}
            <DropdownMenuGroup>
              {(me?.role === 'admin' || isImpersonating) && (
                <DropdownMenuItem
                  aria-label="Open admin panel"
                  onClick={handleAdminClick}
                >
                  <Shield />
                  Admin
                </DropdownMenuItem>
              )}

              <UpgradeMenuItem
                isLoading={isBillingLoading}
                isPro={isPro}
                onUpgradeClick={onUpgradeClick}
              />
            </DropdownMenuGroup>

            {/* Account actions */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                aria-label="View account settings"
                onClick={handleAccountClick}
              >
                <UserIcon />
                {MENU_ITEMS.ACCOUNT}
              </DropdownMenuItem>

              <DropdownMenuItem
                aria-label="Open billing portal"
                disabled={isBillingLoading}
                onClick={handleBillingPortal}
              >
                <CreditCard />
                {isBillingLoading ? MESSAGES.LOADING : MENU_ITEMS.BILLING}
              </DropdownMenuItem>

              <DropdownMenuItem aria-label="View notifications">
                <BellIcon />
                {MENU_ITEMS.NOTIFICATIONS}
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Account Switcher */}
            <AccountSwitcher currentUserId={session?.user?.id} />

            <DropdownMenuSeparator />

            {/* Sign out */}
            <DropdownMenuItem
              aria-label="Sign out of account"
              onClick={handleSignOut}
              variant="destructive"
            >
              <LogOut />
              {MENU_ITEMS.LOGOUT}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
