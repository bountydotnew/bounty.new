"use client";

import Link from '@/components/ui/link';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

import { authClient } from "@bounty/auth/client";
import Image from "next/image";
import { LINKS } from "@/constants/links";
import { DevWarningDialog } from "@/components/ui/dev-warning-dialog";
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
    <Link href="/"> 
      <Image
        src="/bdn-b-w-trans.png"
        alt="Bounty Logo"
        width={40}
        height={40}
        className="w-10 h-10"
      />
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-8">
      <Link href={LINKS.BLOG} className="text-gray-300 hover:text-white transition-colors">
        Blog
      </Link>
      <Link href={LINKS.CONTRIBUTORS} className="text-gray-300 hover:text-white transition-colors">
        Contributors
      </Link>
      {process.env.NODE_ENV === "development" ? (
        session ? (
          <Button
            onClick={onButtonPress}
            variant="secondary"
            className="bg-white text-black hover:bg-gray-100"
          >
            Create bounties
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Link href={LINKS.LOGIN}>
            <Button
              variant="secondary"
              className="bg-white text-black hover:bg-gray-100"
            >
              Log in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )
      ) : (
        <Link href={LINKS.SOCIALS.GITHUB} target="_blank">
          <Button variant="secondary" className="bg-white text-black hover:bg-gray-100">
            GitHub
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        {leftContent}
        {rightContent}
      </header>

      <DevWarningDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        onOkay={(hide) => { if (hide) setCookie("hide-dev-warning", "true", 365); setShowDialog(false); }}
        onContinue={(hide) => { if (hide) setCookie("hide-dev-warning", "true", 365); setShowDialog(false); router.push(LINKS.DASHBOARD); }}
      />
    </>
  );
}
