"use client";

import { ComponentProps } from "react";
import {
  AudioWaveform,
  Award,
  BookOpen, Command,
  FileUser,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/dual-sidebar/nav-main";
// import { NavProjects } from "@/components/dual-sidebar/nav-projects";
import { NavUser } from "@/components/dual-sidebar/nav-user";

import { Divider } from "@/components/ui/divider";
import Bookmark from "../icons/bookmark";
import Bounty from "../icons/bounty";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { LINKS } from "@/constants/links";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const userData = useQuery(trpc.user.getMe.queryOptions());

  function isActive(path: string) {
    return pathname === path;
  }

  // This is sample data.
  const productionData = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Mail0 Inc.",
        logo: GalleryVerticalEnd,
        logoUrl: "https://0.email/white-icon.svg",
        plan: "Enterprise",
      },
      {
        name: "oss.now",
        logo: AudioWaveform,
        logoUrl: "https://oss.now/logo.png",
        plan: "Startup",
      },
      {
        name: "Inbound.new",
        logo: Command,
        logoUrl: "https://inbound.new/_next/image?url=https%3A%2F%2Finbound.new%2Finbound-logo-3.png&w=64&q=75",
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Dashboard",
        url: LINKS.DASHBOARD,
        icon: Bookmark,
        isActive: isActive("/dashboard"),
      },
      {
        title: "Bounties",
        url: LINKS.BOUNTIES,
        icon: Award,
        isActive: isActive("/bounties"),
      },
      {
        title: "Documentation",
        url: "#",
        icon: BookOpen,
        items: [
          {
            title: "Introduction",
            url: "#",
          },
          {
            title: "Get Started",
            url: "#",
          },
          {
            title: "Tutorials",
            url: "#",
          },
          {
            title: "Changelog",
            url: "#",
          },
        ],
      },
      {
        title: "Settings",
        url: "#",
        icon: Settings2,
        items: [
          {
            title: "General",
            url: "#",
          },
          {
            title: "Team",
            url: "#",
          },
          {
            title: "Billing",
            url: "#",
          },
          {
            title: "Limits",
            url: "#",
          },
        ],
      },
    ],
    projects: [
      {
        name: "Design Engineering",
        url: "#",
        icon: Frame,
      },
      {
        name: "Sales & Marketing",
        url: "#",
        icon: PieChart,
      },
      {
        name: "Travel",
        url: "#",
        icon: Map,
      },
    ],
    news: [
      {
        href: "https://dub.co/changelog/regions-support",
        title: "Regions support in analytics",
        summary: "You can now filter your analytics by regions",
        image: "https://assets.dub.co/changelog/regions-support.png",
      },
      {
        href: "https://dub.co/blog/soc2",
        title: "Dub is now SOC 2 Type II Compliant",
        summary:
          "We're excited to announce that Dub has successfully completed a SOC 2 Type II audit to further demonstrate our commitment to security.",
        image: "https://assets.dub.co/blog/soc2.jpg",
      },
      {
        href: "https://dub.co/changelog/utm-templates",
        title: "UTM Templates",
        summary:
          "You can now create UTM templates to streamline UTM campaign management across your team.",
        image: "https://assets.dub.co/changelog/utm-templates.jpg",
      },
    ],
  };

  const betaData = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Mail0 Inc.",
        logo: GalleryVerticalEnd,
        logoUrl: "https://0.email/white-icon.svg",
        plan: "Enterprise",
      },
      {
        name: "oss.now",
        logo: AudioWaveform,
        logoUrl: "https://oss.now/logo.png",
        plan: "Startup",
      },
      {
        name: "Inbound.new",
        logo: Command,
        logoUrl: "https://inbound.new/_next/image?url=https%3A%2F%2Finbound.new%2Finbound-logo-3.png&w=64&q=75",
        plan: "Free",
      },
    ],
    navMain: [
      {
        title: "Apply for Beta Testing",
        url: LINKS.DASHBOARD,
        icon: FileUser
      }
    ],
  }

  const user = {
    name: "Guest",
    email: "guest@example.com",
    image: null,
  }


  const data = userData.data?.betaAccessStatus === "approved" ? productionData : betaData;

  return (
    <Sidebar variant="icononly" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <Link href={LINKS.DASHBOARD}>
          <Bounty className="h-6 w-6" />
        </Link>
      </SidebarHeader>
      <Divider className="h-[2px] w-8 my-2 bg-white" />
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
