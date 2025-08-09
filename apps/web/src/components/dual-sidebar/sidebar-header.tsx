"use client";

import Link from "next/link";

import { cn } from "@/lib/utils";
import { LINKS } from "@/constants/links";
import { AccessGate } from "@/components/access-gate";
// import { SidebarTrigger } from "@/components/ui/sidebar";

type NavItem = { href: string; label: string };

const NavLinks = ({ items }: { items: ReadonlyArray<NavItem> }) => (
  <ul className="flex items-center gap-6">
    {items.map(({ href, label }) => (
      <li key={href}>
        <Link
          href={href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            "text-muted-foreground hover:text-foreground"
          )}
        >
          {label}
        </Link>
      </li>
    ))}
  </ul>
);

const betaNavigationLinks = [
  { href: LINKS.DASHBOARD, label: "Dashboard" },
  { href: LINKS.BOUNTIES, label: "Bounties" },
];

const productionNavigationLinks = [
  { href: LINKS.DASHBOARD, label: "Apply for Beta Testing" }
];

export const Header = () => {


  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "px-4 sm:px-6"
      )}
    >
      <div className="flex items-center gap-6">
        {/* <SidebarTrigger /> */}
        <nav className="flex items-center">
          <AccessGate
            stage="beta"
            fallback={<NavLinks items={productionNavigationLinks} />}
          >
            <NavLinks items={betaNavigationLinks} />
          </AccessGate>
        </nav>
      </div>
    </header>
  );
}
