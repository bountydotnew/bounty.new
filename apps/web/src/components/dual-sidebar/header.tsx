"use client";

import { cn } from "@/lib/utils";
import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";

const links = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/bounties", label: "Bounties" },
];

export function Header() {
  return (
    <header
      className={cn(
        "flex h-16 items-center justify-between gap-2 border-b p-2 px-4 sm:p-4",
      )}
    >
      <div className="flex items-center gap-1 sm:gap-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex gap-4 text-lg">
          {links.map(({ to, label }) => {
            return (
              <Link key={to} href={to}>
                {label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
      </div> */}
    </header>
  );
}
