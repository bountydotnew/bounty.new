import {
  HomeIcon as HugeHomeIcon,
  DashboardSquareIcon,
  BookmarksIcon,
  SettingsGearIcon,
  UserIcon,
  DollarBillIcon,
  CardIcon,
} from '@bounty/ui';
import { Users } from 'lucide-react';
import type { ReactElement, ReactNode } from 'react';

export type NavItem = {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive?: boolean;
  disabled?: boolean;
};

export type SettingsSection = {
  title: string;
  items: NavItem[];
};

export type FooterCardConfig = {
  id: string;
  component: React.ElementType;
  when?: 'main-nav-only' | 'always' | 'settings-only';
};

// ============================================================================
// Main Navigation Items
// ============================================================================

export const mainNavItems = (orgSlug?: string): NavItem[] => [
  {
    title: 'Home',
    url: '/dashboard',
    icon: HugeHomeIcon,
  },
  {
    title: 'Bounties',
    url: '/bounties',
    icon: DashboardSquareIcon,
  },
  {
    title: 'Bookmarks',
    url: '/bookmarks',
    icon: BookmarksIcon,
  },
  {
    title: 'Integrations',
    // Integrations are org-scoped, requires active org
    url: orgSlug ? `/${orgSlug}/integrations` : '/dashboard',
    icon: SettingsGearIcon,
  },
];

// ============================================================================
// Settings Navigation Items
// ============================================================================

export const settingsNavSections = (slug: string): SettingsSection[] => [
  {
    title: 'Personal Settings',
    items: [
      {
        title: 'Account',
        url: `/${slug}/settings/account`,
        icon: UserIcon,
      },
      // Security - commented out per user request
      // {
      //   title: 'Security',
      //   url: `/${slug}/settings/security`,
      //   icon: SecurityIcon,
      // },
      {
        title: 'Payments',
        url: `/${slug}/settings/payments`,
        icon: DollarBillIcon,
      },
    ],
  },
  {
    title: 'Organization',
    items: [
      {
        title: 'General',
        url: `/${slug}/settings/general`,
        icon: SettingsGearIcon,
      },
      {
        title: 'Billing',
        url: `/${slug}/settings/billing`,
        icon: CardIcon,
      },
      {
        title: 'Members',
        url: `/${slug}/settings/members`,
        icon: Users,
      },
    ],
  },
];

// ============================================================================
// Footer Card Registry
// ============================================================================

export const footerCardRegistry: FooterCardConfig[] = [
  {
    id: 'getting-started',
    component: () => {
      // Dynamic import to avoid circular dependencies
      const GettingStartedCard = require('@/components/dual-sidebar/getting-started-card').GettingStartedCard;
      return GettingStartedCard;
    },
    when: 'main-nav-only',
  },
  {
    id: 'changelog',
    component: () => {
      const ChangelogCard = require('@/components/dual-sidebar/changelog-card').ChangelogCard;
      return ChangelogCard;
    },
    when: 'main-nav-only',
  },
  // Recent Bounties is already in the sidebar, just needs to be placed correctly
];
