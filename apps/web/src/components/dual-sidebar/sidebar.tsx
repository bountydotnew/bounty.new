'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowDownIcon,
  NotificationsIcon,
  SettingsGearIcon,
  SidebarToggleIcon,
  FileIcon,
} from '@bounty/ui';
import { cn } from '@bounty/ui/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@bounty/ui/components/sidebar';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { useSession } from '@/context/session-context';
import { useActiveOrg } from '@/hooks/use-active-org';
import { AccountDropdown } from '@/components/billing/account-dropdown';
import { NotificationsDropdown } from '@/components/notifications/notifications-dropdown';
import { RecentBountiesGroup } from '@/components/dual-sidebar/recent-bounties';
import { GettingStartedCard } from './getting-started-card';
import { ChangelogCard } from './changelog-card';
import { mainNavItems, settingsNavSections } from './sidebar-nav-config';
import { ArrowLeftIcon } from 'lucide-react';

const FALLBACK_USER = {
  name: 'Guest',
  email: 'guest@example.com',
  image: null,
};

// ============================================================================
// Subcomponents
// ============================================================================

const WorkspaceSwitcher = () => {
  const { session } = useSession();
  const { activeOrg } = useActiveOrg();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const displayName = activeOrg?.name ?? session?.user?.name ?? 'My Team';
  const displayLabel = activeOrg?.isPersonal
    ? displayName.split("'s team")[0] || displayName
    : displayName;
  const displayLogo = activeOrg?.logo ?? null;
  const avatarSeed = activeOrg?.slug ?? session?.user?.name ?? 'team';

  return (
    <div className="flex items-center justify-between py-0 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hidden">
      <AccountDropdown
        onOpenChange={setIsDropdownOpen}
        user={{
          name: session?.user?.name ?? FALLBACK_USER.name,
          email: session?.user?.email ?? FALLBACK_USER.email,
          image: session?.user?.image ?? FALLBACK_USER.image,
        }}
      >
        <button
          className={cn(
            'group inline-flex items-center gap-[10px] rounded-[11px] px-[5px] py-[5px] text-left transition-colors group-data-[collapsible=icon]:size-[26px] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-[3px]',
            isDropdownOpen
              ? 'bg-surface-2 hover:bg-surface-hover'
              : 'bg-transparent hover:bg-surface-2'
          )}
          type="button"
        >
          <Avatar className="h-[27px] w-[27px] rounded-[6px] border-2 border-brand-primary shadow-[inset_0_2px_3px_rgba(0,0,0,0.2)] group-data-[collapsible=icon]:size-5 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5">
            {displayLogo && (
              <AvatarImage
                alt={displayName}
                src={displayLogo}
                className="rounded-[6px]"
              />
            )}
            <AvatarFacehash
              name={avatarSeed}
              size={27}
              className="rounded-[6px]"
            />
          </Avatar>
          <div className="flex items-center gap-[7px] group-data-[collapsible=icon]:hidden">
            <span className="text-[18px] font-semibold leading-[150%] text-foreground truncate max-w-[140px]">
              {displayLabel}
            </span>
            <ArrowDownIcon className="h-4 w-4 shrink-0 text-text-tertiary transition-colors group-hover:text-foreground" />
          </div>
        </button>
      </AccountDropdown>
      <SidebarTrigger
        aria-label="Toggle sidebar layout"
        className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
      >
        <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
      </SidebarTrigger>
    </div>
  );
};

/**
 * Tracks the most recent pathname that is NOT under a settings route.
 * When the user clicks "Back" from settings, they jump straight to that
 * path instead of cycling through settings sub-pages in history.
 */
let lastNonSettingsPath = '/dashboard';

function useTrackNonSettingsPath() {
  const pathname = usePathname();
  React.useEffect(() => {
    if (pathname && !pathname.includes('/settings')) {
      lastNonSettingsPath = pathname;
    }
  }, [pathname]);
}

const BackToMainButton = (_props: { slug: string }) => {
  const router = useRouter();
  useTrackNonSettingsPath();

  return (
    <button
      type="button"
      onClick={() => router.push(lastNonSettingsPath)}
      className={cn(
        'w-fit text-sm font-medium',
        'inline-flex items-center justify-center gap-0.5 whitespace-nowrap',
        'text-text-tertiary hover:text-foreground transition-colors',
        'bg-transparent hover:bg-surface-2',
        'h-[28px] px-[6px] py-[4px] rounded-lg'
      )}
    >
      <ArrowLeftIcon className="h-4 w-4" />
      <span className="ml-0.5">Back</span>
    </button>
  );
};

const renderNavItems = (
  items: ReturnType<typeof mainNavItems>,
  pathname: string | null
) => {
  return (
    <SidebarMenu className="flex flex-col gap-[8px] w-full">
      {items.map((item) => {
        const isActive = pathname === item.url;
        const IconComponent = item.icon;
        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
              <a href={item.url}>
                {IconComponent && <IconComponent className="h-5 w-5" />}
                <span>{item.title}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

const renderSettingsNav = (
  sections: ReturnType<typeof settingsNavSections>,
  pathname: string | null
) => {
  return (
    <>
      {sections.map((section) => (
        <div key={section.title} className="mb-4">
          <div className="px-[15px] py-0 mb-2">
            <span className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider">
              {section.title}
            </span>
          </div>
          <SidebarMenu className="flex flex-col gap-[8px] w-full">
            {section.items.map((item) => {
              const isActive = pathname === item.url;
              const IconComponent = item.icon;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.title}
                  >
                    <a href={item.url}>
                      {IconComponent && <IconComponent className="h-5 w-5" />}
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      ))}
    </>
  );
};

// ============================================================================
// Main Sidebar Component
// ============================================================================

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();
  const { session, isPending } = useSession();
  const { activeOrgSlug } = useActiveOrg();
  const isAuthenticated = !!session?.user;

  // Determine if we're on a settings route
  // Matches /{slug}/settings/* pattern
  const isSettingsRoute = pathname?.match(/\/[^/]+\/settings/);

  // Get nav items based on context
  const mainNav = mainNavItems(activeOrgSlug || undefined).map((item) => ({
    ...item,
    isActive:
      item.title === 'Integrations'
        ? pathname?.includes('/integrations')
        : pathname === item.url,
  }));

  const settingsNav = settingsNavSections(activeOrgSlug || 'dashboard');

  return (
    <Sidebar collapsible="icon" {...props}>
      <div className="flex h-full flex-col gap-[15px] px-0 group-data-[collapsible=icon]:px-[9px] py-4 md:py-0 lg:py-0">
        {/* Collapsed mode trigger */}
        <div className="hidden group-data-[collapsible=icon]:flex group-data-[collapsible=icon]:px-[5px] group-data-[collapsible=icon]:py-[15px]">
          <SidebarTrigger
            aria-label="Toggle sidebar layout"
            className="flex size-[26px] items-center justify-center rounded-[10px] bg-surface-1 p-[3px] hover:bg-surface-2 hover:text-foreground"
          >
            <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
          </SidebarTrigger>
        </div>

        {/* Header */}
        <SidebarHeader className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          {isSettingsRoute && activeOrgSlug ? (
            <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:hidden">
              <BackToMainButton slug={activeOrgSlug} />
              <SidebarTrigger
                aria-label="Toggle sidebar layout"
                className="flex h-5 w-5 items-center justify-center p-0 hover:bg-transparent"
              >
                <SidebarToggleIcon className="h-5 w-5 text-text-tertiary" />
              </SidebarTrigger>
            </div>
          ) : (
            <WorkspaceSwitcher />
          )}
        </SidebarHeader>

        {/* Content */}
        <SidebarContent className="flex-1 overflow-y-auto px-[15px] py-0 group-data-[collapsible=icon]:px-0">
          {isSettingsRoute ? (
            <SidebarGroup>
              {renderSettingsNav(settingsNav, pathname)}
            </SidebarGroup>
          ) : (
            <SidebarGroup>{renderNavItems(mainNav, pathname)}</SidebarGroup>
          )}
        </SidebarContent>

        {/* Footer - cards on main nav, minimal on settings */}
        <SidebarFooter className="px-0 py-0 group-data-[collapsible=icon]:px-0">
          {isSettingsRoute ? (
            <div className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
              {/* Settings footer - minimal */}
            </div>
          ) : (
            <div className="px-[15px] py-0 group-data-[collapsible=icon]:px-0">
              {/* Footer cards (Getting Started, Changelog, Recent Bounties) */}
              {/* These only show on main nav pages, not settings */}
              <div className="space-y-2 pb-3">
                <GettingStartedCard />
                <ChangelogCard />
              </div>
              <RecentBountiesGroup />
              {/* Bottom actions row */}
              <div className="flex items-center justify-between gap-2 pt-3 mt-3 border-t border-border-subtle group-data-[collapsible=icon]:justify-center">
                {/* Docs link */}
                <button
                  className="inline-flex items-center gap-1.5 rounded-lg bg-surface-1 px-2.5 py-1.5 text-xs text-text-tertiary transition-colors hover:text-foreground group-data-[collapsible=icon]:hidden"
                  onClick={() =>
                    window.open('https://docs.bounty.new', '_blank')
                  }
                  type="button"
                >
                  <FileIcon className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Docs</span>
                </button>
                {/* Notifications */}
                {isAuthenticated && !isPending && (
                  <NotificationsDropdown triggerClassName="flex h-auto w-auto items-center justify-center rounded-lg bg-surface-1 px-2.5 py-1.5 text-text-tertiary transition-colors hover:text-foreground">
                    <NotificationsIcon className="h-3.5 w-3.5" />
                  </NotificationsDropdown>
                )}
              </div>
            </div>
          )}
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
};
