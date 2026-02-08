'use client';

import { authClient } from '@bounty/auth/client';
import { useSession } from '@/context/session-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useBilling } from '@/hooks/use-billing';
import { cn } from '@bounty/ui';
import { Check, LogOut, Plus, RotateCcw } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
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
import { BillingSettingsIcon } from '@bounty/ui/components/icons/huge/billing-settings';

import { Feedback } from '@bounty/ui';
import { UserIcon } from '@bounty/ui';
import { DollarBillIcon } from '@bounty/ui';
import { useFeedback } from '@/components/feedback-context';
import { useActiveOrg } from '@/hooks/use-active-org';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { useUser } from '@/context/user-context';
import { useState, useTransition } from 'react';
import { PricingDialog } from '@/components/billing/pricing-dialog';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { trpcClient } from '@/utils/trpc';

// Constants for better maintainability
const MESSAGES = {
  BILLING_PORTAL_ERROR: 'Failed to open billing portal. Please try again.',
  BILLING_PORTAL_SUCCESS: 'Opening billing portal...',
  SIGN_IN_REQUIRED: 'Please sign in to access billing.',
  ONBOARDING_RESET_SUCCESS: 'Onboarding reset! Redirecting...',
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

// Custom hook for reset onboarding
function useResetOnboarding() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [pending, startReset] = useTransition();

  const mutation = useMutation({
    mutationFn: () => trpcClient.onboarding.resetOnboarding.mutate(),
    onSuccess: () => {
      // Invalidate the onboarding state query
      queryClient.invalidateQueries({
        queryKey: [['onboarding', 'getState']],
      });
      toast.success(MESSAGES.ONBOARDING_RESET_SUCCESS);
      // Redirect to onboarding
      router.push('/onboarding/step/1');
    },
    onError: () => {
      toast.error('Failed to reset onboarding. Please try again.');
    },
  });

  const handleResetOnboarding = React.useCallback(() => {
    startReset(() => {
      mutation.mutate();
    });
  }, [mutation]);

  return { handleResetOnboarding, pending: pending || mutation.isPending };
}

// Team switcher submenu (inside the account dropdown)
function TeamSwitcherSubmenu({ onClose }: { onClose: () => void }) {
  const { activeOrg, orgs, switchOrg, isLoading } = useActiveOrg();
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitching, setSwitching] = React.useState(false);

  const handleSwitch = React.useCallback(
    async (orgId: string) => {
      if (orgId === activeOrg?.id) {
        onClose();
        return;
      }
      setSwitching(true);
      try {
        await switchOrg(orgId);
        const targetOrg = orgs.find((o) => o.id === orgId);
        if (targetOrg) {
          // Preserve the current route path when switching workspaces
          // If on /{currentSlug}/integrations, go to /{newSlug}/integrations
          // If on /{currentSlug}/settings/billing, go to /{newSlug}/settings/billing
          const currentSlug = activeOrg?.slug;
          if (currentSlug && (pathname === `/${currentSlug}` || pathname?.startsWith(`/${currentSlug}/`))) {
            const newPath = pathname.replace(
              `/${currentSlug}`,
              `/${targetOrg.slug}`
            );
            router.push(newPath);
          } else {
            // Default to integrations if not on a workspace-specific route
            router.push(`/${targetOrg.slug}/integrations`);
          }
        }
        onClose();
      } catch (err) {
        console.error('Failed to switch team:', err);
        toast.error('Failed to switch team');
      } finally {
        setSwitching(false);
      }
    },
    [activeOrg?.id, activeOrg?.slug, orgs, switchOrg, onClose, router, pathname]
  );

  const handleCreateTeam = React.useCallback(async () => {
    onClose();
    const name = window.prompt('Team name:');
    if (!name?.trim()) return;

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug) {
      toast.error('Invalid team name — must contain at least one letter or number');
      return;
    }

    try {
      const result = await authClient.organization.create({
        name: name.trim(),
        slug,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Failed to create team');
        return;
      }

      if (result.data?.id) {
        await switchOrg(result.data.id);
        const serverSlug = result.data.slug ?? slug;
        router.push(`/${serverSlug}/integrations`);
        toast.success(`Team "${name.trim()}" created`);
      }
    } catch (err) {
      console.error('Failed to create team:', err);
      toast.error('Failed to create team');
    }
  }, [switchOrg, onClose, router]);

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className="flex items-center justify-between rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-foreground focus:bg-surface-hover">
        <div className="flex items-center gap-2.25">
          <SwitchWorkspaceIcon className="h-[19px] w-[19px]" />
          <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
            Switch workspace
          </span>
        </div>
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="w-64 rounded-[15px] bg-surface-1 border border-border-subtle">
        <div className="px-1 py-1">
          <div className="px-3 py-1.5 text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Teams
          </div>
          {isLoading ? (
            <div className="px-3 py-2 text-[14px] text-text-tertiary">
              Loading...
            </div>
          ) : (
            orgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                className={cn(
                  'flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-text-secondary transition-colors hover:text-foreground focus:bg-surface-hover cursor-pointer',
                  isSwitching && 'opacity-50 pointer-events-none'
                )}
                onClick={() => handleSwitch(org.id)}
              >
                <Avatar className="h-6 w-6 rounded-[5px] shrink-0">
                  {org.logo && (
                    <AvatarImage
                      alt={org.name}
                      src={org.logo}
                      className="rounded-[5px]"
                    />
                  )}
                  <AvatarFacehash
                    name={org.slug}
                    size={24}
                    className="rounded-[5px]"
                  />
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-medium leading-tight truncate">
                    {org.isPersonal
                      ? org.name.split("'s team")[0] || org.name
                      : org.name}
                  </div>
                  <div className="text-[12px] text-text-tertiary">
                    {org.isPersonal
                      ? 'Personal'
                      : `${org.memberCount} ${org.memberCount === 1 ? 'member' : 'members'}`}
                  </div>
                </div>
                {org.id === activeOrg?.id && (
                  <Check className="h-4 w-4 shrink-0 text-brand-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>
        <DropdownMenuSeparator />
        <div className="px-1 py-1">
          <DropdownMenuItem
            className="flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-text-tertiary transition-colors hover:text-foreground focus:bg-surface-hover cursor-pointer"
            onClick={handleCreateTeam}
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[5px] border border-border-subtle border-dashed">
              <Plus className="h-3.5 w-3.5" />
            </div>
            <span className="text-[15px] font-medium">Create team</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
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
  const { activeOrgSlug } = useActiveOrg();
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
  const { handleResetOnboarding, pending: resetOnboardingPending } =
    useResetOnboarding();
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

        <DropdownMenuContent className="rounded-[15px] w-74 bg-surface-1 border border-border-subtle">
          {/* User header section */}
          <div className="flex flex-col gap-1.5 border-b border-border-subtle px-4 py-1.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0">
                <div className="text-lg font-medium leading-[150%] text-foreground">
                  {userDisplay.name}
                </div>
                <div className="text-base font-medium leading-[150%] tracking-[0.03em] text-text-muted">
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
              className="flex items-center gap-2 rounded-[10px] px-0 py-1.5 text-text-tertiary transition-colors hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="flex items-center gap-2 rounded-[10px] px-0 py-1.5 text-text-tertiary transition-colors hover:text-foreground"
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
          <div className="flex flex-col gap-2 border-b border-border-subtle px-0 py-2">
            <TeamSwitcherSubmenu onClose={() => setMenuOpen(false)} />
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-foreground focus:bg-surface-hover"
              onClick={() => {
                setMenuOpen(false);
                if (activeOrgSlug) {
                  router.push(`/${activeOrgSlug}/settings/billing`);
                } else {
                  handleBillingPortal();
                }
              }}
            >
              <BillingSettingsIcon className="h-[19px] w-[19px]" />
              <span className="text-[17px] font-medium leading-[150%] tracking-[0.03em]">
                Billing
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 rounded-[10px] px-4 py-0.75 text-text-secondary transition-colors hover:text-foreground focus:bg-surface-hover"
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

          <DropdownMenuItem
            className={cn(
              'flex items-center gap-2 rounded-[10px] px-4 py-2 text-text-secondary transition-colors hover:text-foreground focus:bg-surface-hover',
              resetOnboardingPending && 'opacity-70'
            )}
            disabled={resetOnboardingPending}
            onClick={() => {
              setMenuOpen(false);
              handleResetOnboarding();
            }}
          >
            <RotateCcw className="h-[19px] w-[19px]" />
            <span className="text-[16px] font-medium leading-[150%] tracking-[0.03em]">
              Show onboarding
            </span>
          </DropdownMenuItem>

          <DropdownMenuItem
            className={cn(
              'flex items-center gap-2 rounded-[10px] px-4 py-2 text-text-secondary transition-colors hover:text-foreground focus:bg-surface-hover',
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
