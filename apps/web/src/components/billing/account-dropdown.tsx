"use client";

import * as React from "react";
import { CreditCard, LogOut, Sparkles } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@bounty/auth/client";
import { useBilling } from "@/hooks/use-billing";
import { toast } from "sonner";
import { LINKS } from "@/constants/links";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { UserIcon } from "@/components/ui/user";
import { BellIcon } from "@/components/ui/bell";

// Constants for better maintainability
const MESSAGES = {
  SIGN_IN_REQUIRED: "Please sign in to access billing.",
  BILLING_PORTAL_SUCCESS: "Opening billing portal...",
  BILLING_PORTAL_ERROR: "Failed to open billing portal. Please try again.",
  LOADING: "Loading...",
  CHECKING_SUBSCRIPTION: "Checking...",
  VERIFYING_SUBSCRIPTION: "Verifying subscription...",
  PRO_BADGE: "Pro",
} as const;

const MENU_ITEMS = {
  UPGRADE: "Upgrade to Pro",
  ACCOUNT: "Account",
  BILLING: "Billing",
  NOTIFICATIONS: "Notifications",
  LOGOUT: "Log out",
} as const;

const LOGIN_REDIRECT = "/login";

// Enhanced TypeScript interfaces
interface User {
  name: string;
  email: string;
  image?: string | null;
}

interface SessionUser {
  id: string;
  email: string;
  emailVerified: boolean;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  image?: string | null;
}

interface AccountDropdownProps {
  user: User;
  onUpgradeClick: () => void;
}

interface UserDisplayData {
  name: string;
  email: string;
  image: string | null;
  initials: string;
}

// Custom hook for user display logic
function useUserDisplay(
  sessionUser?: SessionUser | null,
  fallbackUser?: User,
): UserDisplayData {
  return React.useMemo(() => {
    const user = sessionUser || fallbackUser;
    const name = user?.name || "";
    const email = user?.email || "";
    const image = user?.image || null;
    const initials = name ? name.charAt(0).toUpperCase() : "?";

    return { name, email, image, initials };
  }, [sessionUser, fallbackUser]);
}

// Custom hook for billing portal operations
function useBillingPortal() {
  const { data: session } = authClient.useSession();
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
      console.error("Failed to open billing portal:", error);
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
}>(({ userDisplay, isLoading, className = "h-8 w-8 rounded-lg" }) => (
  <Avatar className={className}>
    {userDisplay.image && (
      <AvatarImage
        src={userDisplay.image}
        alt={userDisplay.name}
        onError={(e) => {
          // Fallback to initials if image fails to load
          e.currentTarget.style.display = "none";
        }}
      />
    )}
    <AvatarFallback className="rounded-lg">
      {isLoading ? (
        <Spinner size="sm" aria-label="Loading user information" />
      ) : (
        userDisplay.initials
      )}
    </AvatarFallback>
  </Avatar>
));

UserAvatar.displayName = "UserAvatar";

// Memoized dropdown header component
const DropdownHeader = React.memo<{
  userDisplay: UserDisplayData;
  isPro: boolean;
  isLoading: boolean;
}>(({ userDisplay, isPro, isLoading }) => (
  <DropdownMenuLabel className="p-0 font-normal">
    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
      <UserAvatar userDisplay={userDisplay} isLoading={isLoading} />
      <div className="grid flex-1 text-left text-sm leading-tight">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">
            {isLoading ? MESSAGES.LOADING : userDisplay.name}
          </span>
          {!isLoading && isPro && (
            <span className="text-xs text-muted-foreground">
              {MESSAGES.PRO_BADGE}
            </span>
          )}
          {isLoading && (
            <span className="text-xs text-muted-foreground animate-pulse">
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

DropdownHeader.displayName = "DropdownHeader";

// Upgrade menu item component
const UpgradeMenuItem = React.memo<{
  isPro: boolean;
  isLoading: boolean;
  onUpgradeClick: () => void;
}>(({ isPro, isLoading, onUpgradeClick }) => {
  if (isLoading) {
    return (
      <DropdownMenuItem disabled aria-label="Loading subscription status">
        <Spinner size="sm" className="mr-2" />
        Checking subscription...
      </DropdownMenuItem>
    );
  }

  if (!isPro) {
    return (
      <DropdownMenuItem
        onClick={onUpgradeClick}
        aria-label="Upgrade to Pro plan"
      >
        <Sparkles />
        {MENU_ITEMS.UPGRADE}
      </DropdownMenuItem>
    );
  }

  return null;
});

UpgradeMenuItem.displayName = "UpgradeMenuItem";

// Main component
export function AccountDropdown({
  user,
  onUpgradeClick,
}: AccountDropdownProps) {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { data: session } = authClient.useSession();
  const { isPro, isLoading: isBillingLoading } = useBilling();

  // Custom hooks for better separation of concerns
  const userDisplay = useUserDisplay(session?.user, user);
  const handleBillingPortal = useBillingPortal();
  const handleSignOut = useSignOut();

  // Memoize dropdown content positioning
  const dropdownProps = React.useMemo(
    () => ({
      className:
        "w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg",
      side: isMobile ? ("bottom" as const) : ("right" as const),
      align: "end" as const,
      sideOffset: 4,
    }),
    [isMobile],
  );

  const handleAccountClick = useCallback(() => {
    router.push(LINKS.ACCOUNT);
  }, [router]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              aria-label={`Account menu for ${userDisplay.name}`}
              aria-expanded={false}
            >
              <div>
                <UserAvatar
                  userDisplay={userDisplay}
                  isLoading={isBillingLoading}
                />
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent {...dropdownProps}>
            <DropdownHeader
              userDisplay={userDisplay}
              isPro={isPro}
              isLoading={isBillingLoading}
            />

            <DropdownMenuSeparator />

            {/* Upgrade section */}
            <DropdownMenuGroup>
              <UpgradeMenuItem
                isPro={isPro}
                isLoading={isBillingLoading}
                onUpgradeClick={onUpgradeClick}
              />
            </DropdownMenuGroup>

            {/* Account actions */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={handleAccountClick}
                aria-label="View account settings"
              >
                <UserIcon />
                {MENU_ITEMS.ACCOUNT}
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={handleBillingPortal}
                disabled={isBillingLoading}
                aria-label="Open billing portal"
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

            {/* Sign out */}
            <DropdownMenuItem
              onClick={handleSignOut}
              aria-label="Sign out of account"
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
