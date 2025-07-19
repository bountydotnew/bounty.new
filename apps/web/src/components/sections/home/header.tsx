"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeaderBase } from "@/components/sections/home/header-base";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { LINKS } from "@/constants/links";

export function Header() {
  const { data: session } = authClient.useSession();

  const leftContent = (
    <Link href="/" className="flex items-center gap-3">
      {/* <Image src="https://opencut.app/logo.svg" alt="Bounty.new Logo" width={32} height={32} /> */}
      <Image src="/bdn-b-w-trans.png" alt="Bounty.new Logo" width={32} height={32} />
      <span className="text-xl font-medium hidden md:block">bounty.new</span>
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-3">
      <Link href={LINKS.CONTRIBUTORS} className="text-sm p-0 hover:no-underline hover:text-primary">
        <Button variant="text" className="text-sm p-0">
          Contributors
        </Button>
      </Link>
      {process.env.NODE_ENV === "development" ? (
        session ? (
          <Link href={LINKS.DASHBOARD}>
            <Button size="sm" className="rounded-lg transition-[color,box-shadow] [&_svg]:size-4 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10">
              Create bounties
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        ) : ( 
          <Link href={LINKS.LOGIN}>
            <Button size="sm" className="rounded-lg transition-[color,box-shadow] [&_svg]:size-4 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10">
              Log in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )
      ) : (
        <Link href={LINKS.SOCIALS.GITHUB} target="_blank">
          <Button size="sm" className="text-sm ml-4">
            GitHub
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  );

  return (
    <div className="mx-auto fixed top-0 left-0 z-30 w-full">
      <HeaderBase
        className="bg-[#1D1D1D]/80 backdrop-blur-sm border border-white/10 rounded-2xl max-w-3xl mx-auto mt-4 pl-4 pr-[14px]"
        leftContent={leftContent}
        rightContent={rightContent}
      />
    </div>
  );
}
