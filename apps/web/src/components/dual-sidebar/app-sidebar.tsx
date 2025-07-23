"use client";

import { ComponentProps } from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/dual-sidebar/nav-main";
import { NavProjects } from "@/components/dual-sidebar/nav-projects";
import { NavUser } from "@/components/dual-sidebar/nav-user";
import { TeamSwitcher } from "@/components/dual-sidebar/team-switcher";
import { News } from "@/components/ui/sidebar-news";
import { authClient } from "@/lib/auth-client";

// This is sample data.
const data = {
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
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
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

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {

  const { data: session } = authClient.useSession();

  const user = {
    name: session?.user?.name || "Guest",
    email: session?.user?.email || "guest@example.com",
    avatar: session?.user?.image || "/avatars/guest.jpg",
  }
  
  return (
    <Sidebar variant="icononly" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
