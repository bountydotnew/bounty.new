import {
  HomeIcon as HugeHomeIcon,
  DashboardSquareIcon,
  BookmarksIcon,
  SettingsGearIcon,
  UserIcon,
  DollarBillIcon,
  CardIcon,
  SecurityIcon,
} from '@bounty/ui';
import { Users, EyeOff, Activity } from 'lucide-react';

type NavItem = {
  title: string;
  url: string;
  icon?: React.ElementType;
  isActive?: boolean;
  disabled?: boolean;
};

type SettingsSection = {
  title: string;
  items: NavItem[];
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

// ============================================================================
// Admin Navigation Items
// ============================================================================

export const adminNavSections: SettingsSection[] = [
  {
    title: 'Admin',
    items: [
      {
        title: 'Users',
        url: '/admin/users',
        icon: Users,
      },
      {
        title: 'Moderation',
        url: '/admin/moderation',
        icon: EyeOff,
      },
      {
        title: 'Events',
        url: '/admin/events',
        icon: Activity,
      },
    ],
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
