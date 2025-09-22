'use client';

import { Divider } from '@bounty/ui/components/divider';
import HomeIcon from '@bounty/ui/components/icons/home';
import Link from '@bounty/ui/components/link';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from '@bounty/ui/components/sidebar';
import {
  AudioWaveform,
  Award,
  BookText,
  Calendar,
  Command,
  FileUser,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { AccessGate } from '@/components/access-gate';
import { SidebarNavSkeleton } from '@/components/dashboard/skeletons/sidebar-nav-skeleton';
import { NavMain } from '@/components/dual-sidebar/nav-main';
// import { NavProjects } from "@/components/dual-sidebar/nav-projects";
import { NavUser } from '@/components/dual-sidebar/nav-user';
import { LINKS } from '@/constants';
import Bookmark from '../icons/bookmark';
import Bounty from '../icons/bounty';

export const AppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  function isActive(path: string) {
    return pathname === path;
  }

  // This is sample data.
  const productionData = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
    teams: [
      {
        name: 'Mail0 Inc.',
        logo: GalleryVerticalEnd,
        logoUrl: 'https://0.email/white-icon.svg',
        plan: 'Enterprise',
      },
      {
        name: 'oss.now',
        logo: AudioWaveform,
        logoUrl: 'https://oss.now/logo.png',
        plan: 'Startup',
      },
      {
        name: 'Inbound.new',
        logo: Command,
        logoUrl:
          'https://inbound.new/_next/image?url=https%3A%2F%2Finbound.new%2Finbound-logo-3.png&w=64&q=75',
        plan: 'Free',
      },
    ],
    navMain: [
      {
        title: 'Dashboard',
        url: LINKS.DASHBOARD,
        icon: HomeIcon,
        isActive: isActive('/dashboard'),
      },
      {
        title: 'Bounties',
        url: LINKS.BOUNTIES,
        icon: Award,
        isActive: isActive('/bounties'),
      },
      {
        title: 'Bookmarks',
        url: LINKS.BOOKMARKS,
        icon: Bookmark,
        isActive: isActive('/bookmarks'),
      },
      {
        title: 'Documentation',
        url: '#',
        icon: BookText,
      },
      {
        title: 'Settings',
        url: LINKS.SETTINGS,
        icon: Settings,
        isActive: isActive('/settings'),
      },
    ],
    projects: [
      {
        name: 'Design Engineering',
        url: '#',
        icon: Frame,
      },
      {
        name: 'Sales & Marketing',
        url: '#',
        icon: PieChart,
      },
      {
        name: 'Travel',
        url: '#',
        icon: Map,
      },
    ],
    news: [
      {
        href: 'https://dub.co/changelog/regions-support',
        title: 'Regions support in analytics',
        summary: 'You can now filter your analytics by regions',
        image: 'https://assets.dub.co/changelog/regions-support.png',
      },
      {
        href: 'https://dub.co/blog/soc2',
        title: 'Dub is now SOC 2 Type II Compliant',
        summary:
          "We're excited to announce that Dub has successfully completed a SOC 2 Type II audit to further demonstrate our commitment to security.",
        image: 'https://assets.dub.co/blog/soc2.jpg',
      },
      {
        href: 'https://dub.co/changelog/utm-templates',
        title: 'UTM Templates',
        summary:
          'You can now create UTM templates to streamline UTM campaign management across your team.',
        image: 'https://assets.dub.co/changelog/utm-templates.jpg',
      },
    ],
  };

  const betaData = {
    user: {
      name: 'shadcn',
      email: 'm@example.com',
      avatar: '/avatars/shadcn.jpg',
    },
    teams: [
      {
        name: 'Mail0 Inc.',
        logo: GalleryVerticalEnd,
        logoUrl: 'https://0.email/white-icon.svg',
        plan: 'Enterprise',
      },
      {
        name: 'oss.now',
        logo: AudioWaveform,
        logoUrl: 'https://oss.now/logo.png',
        plan: 'Startup',
      },
      {
        name: 'Inbound.new',
        logo: Command,
        logoUrl:
          'https://inbound.new/_next/image?url=https%3A%2F%2Finbound.new%2Finbound-logo-3.png&w=64&q=75',
        plan: 'Free',
      },
    ],
    navMain: [
      {
        title: 'Apply for Beta Testing',
        url: LINKS.DASHBOARD,
        icon: FileUser,
      },
    ],
  };

  const user = {
    name: 'Guest',
    email: 'guest@example.com',
    image: null,
  };

  return (
    <Sidebar variant="icononly" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <Link href={LINKS.DASHBOARD}>
          <Bounty className="h-6 w-6" />
        </Link>
      </SidebarHeader>
      <Divider className="my-2 h-[2px] w-8 bg-white" />
      <SidebarContent>
        <AccessGate
          fallback={<NavMain items={betaData.navMain} />}
          skeleton={<SidebarNavSkeleton />}
          stage="beta"
        >
          <NavMain items={productionData.navMain} />
        </AccessGate>

        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
};

export const AdminAppSidebar = ({
  ...props
}: React.ComponentProps<typeof Sidebar>) => {
  const pathname = usePathname();

  function isActive(path: string) {
    return pathname === path;
  }

  const adminNav = [
    {
      title: 'Overview',
      url: '/admin',
      icon: HomeIcon,
      isActive: isActive('/admin'),
    },
    {
      title: 'Beta Applications',
      url: '/admin/beta-applications',
      icon: FileUser,
      isActive: isActive('/admin/beta-applications'),
    },
    {
      title: 'Users',
      url: '/admin/users',
      icon: Users,
      isActive: isActive('/admin/users'),
    },
    {
      title: 'Waitlist',
      url: '/admin/waitlist',
      icon: Calendar,
      isActive: isActive('/admin/waitlist'),
    },
  ];

  const user = { name: 'Admin', email: 'admin@example.com', image: null };

  return (
    <Sidebar variant="icononly" {...props}>
      <SidebarHeader>
        <Link href={LINKS.DASHBOARD}>
          <div className="relative inline-block">
            <div className="rounded-md bg-neutral-800 p-2">
              <Bounty className="h-6 w-6" />
            </div>
            <Shield className="-bottom-1 -right-1 absolute h-5 w-5 fill-white" />
          </div>
        </Link>
      </SidebarHeader>
      <Divider className="my-2 h-[2px] w-8 bg-white" />
      <SidebarContent>
        <NavMain items={adminNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
};
