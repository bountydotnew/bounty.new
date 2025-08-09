"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { LINKS } from "@/constants/links";
// import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/utils/trpc";
import { AccessGate } from "@/components/access-gate";


const betaNavigationLinks = [
  { href: LINKS.DASHBOARD, label: "Dashboard" },
  { href: LINKS.BOUNTIES, label: "Bounties" },
];

const productionNavigationLinks = [
  { href: LINKS.DASHBOARD, label: "Apply for Beta Testing" }
];

export function Header() {


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
          <div className="flex items-center gap-6">
            <AccessGate 
              stage="beta"
              fallback={
                productionNavigationLinks.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-primary",
                      "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </Link>
                ))
              }
            >
              {betaNavigationLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </Link>
              ))}
            </AccessGate>
          </div>
        </nav>
      </div>
    </header>
  );
}
