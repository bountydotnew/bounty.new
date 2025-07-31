"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { HeaderBase } from "@/components/sections/home/header-base";
import { authClient } from "@bounty/auth/client";
import Image from "next/image";
import { LINKS } from "@/constants/links";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";

export function Header() {
  const { data: session } = authClient.useSession();
  const [showDialog, setShowDialog] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const router = useRouter();
  // Cookie helpers
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  // Check cookie on mount
  useEffect(() => {
    const hiddenPref = getCookie("hide-dev-warning");
    if (hiddenPref === "true") {
      // User has chosen to hide the warning
    }
  }, []);

  const onButtonPress = () => {
    const hiddenPref = getCookie("hide-dev-warning");
    if (hiddenPref === "true") {
      // Skip dialog, go directly to dashboard
      router.push(LINKS.DASHBOARD);
    } else {
      setShowDialog(true);
    }
  };

  const handleDialogClose = (action: "okay" | "continue") => {
    if (dontShowAgain) {
      setCookie("hide-dev-warning", "true", 365); // Store for 1 year
    }
    setShowDialog(false);

    if (action === "continue") {
      router.push(LINKS.DASHBOARD);
    }
  };

  const leftContent = (
    <Link href="/" className="flex items-center gap-3">
      <Image
        src="/bdn-b-w-trans.png"
        alt="Bounty.new Logo"
        width={32}
        height={32}
      />
      <span className="text-xl font-medium hidden md:block">bounty.new</span>
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-3">
      <Button variant="text" className="text-sm p-0" asChild>
        <Link
          href={LINKS.BLOG}
          className="hover:no-underline hover:text-primary"
        >
          Blog
        </Link>
      </Button>
      <Button variant="text" className="text-sm p-0" asChild>
        <Link
          href={LINKS.CONTRIBUTORS}
          className="hover:no-underline hover:text-primary"
        >
          Contributors
        </Link>
      </Button>
      {process.env.NODE_ENV === "development" ? (
        session ? (
          <Button
            onClick={onButtonPress}
            size="sm"
            className="rounded-lg transition-[color,box-shadow] [&_svg]:size-4 bg-white text-black shadow-xs hover:bg-white/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10"
          >
            Create bounties
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Link href={LINKS.LOGIN}>
            <Button
              size="sm"
              className="rounded-lg transition-[color,box-shadow] [&_svg]:size-4 bg-white text-black shadow-xs hover:bg-white/90 h-9 px-4 py-2 has-[>svg]:px-3 z-10"
            >
              Log in
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )
      ) : (
        <Link href={LINKS.SOCIALS.GITHUB} target="_blank">
          <Button size="sm" className="text-sm ml-4 bg-white text-black">
            GitHub
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <div className="mx-auto fixed top-0 left-0 z-30 w-full">
        <HeaderBase
          className="bg-[#1D1D1D]/80 backdrop-blur-sm border border-white/10 rounded-sm max-w-3xl mx-auto mt-4 pl-4 pr-[14px]"
          leftContent={leftContent}
          rightContent={rightContent}
        />
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#2D2D2D] border-white/20 text-white max-w-md">
          <DialogHeader className="text-center">
            <div className="w-16 h-16 mx-auto bg-background/20 rounded-full flex items-center justify-center mb-4">
              <Image
                src="/bdn-b-w-trans.png"
                alt="Bounty.new Logo"
                width={32}
                height={32}
              />
            </div>
            <DialogTitle className="text-lg font-semibold">
              App in Development
            </DialogTitle>
            <DialogDescription className="text-white/60">
              This app isn&apos;t released yet and you should expect bugs.
              Functionality is limited, so don&apos;t expect everything to work,
              or even a good looking UI.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked as boolean)
                }
                className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="dont-show-again"
                className="text-sm text-white/60 cursor-pointer"
              >
                Don&apos;t show this message again
              </label>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => handleDialogClose("okay")}
                variant="outline"
                className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Okay
              </Button>
              <Button
                onClick={() => handleDialogClose("continue")}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Continue Anyway
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
