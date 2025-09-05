'use client';

import { authClient } from '@bounty/auth/client';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { DevWarningDialog } from '@/components/ui/dev-warning-dialog';
import Link from '@/components/ui/link';
import { LINKS } from '@/constants/links';

export function Header() {
  const { data: session } = authClient.useSession();
  const [showDialog, setShowDialog] = useState(false);
  const router = useRouter();
  // Cookie helpers
  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
  };

  const getCookie = (name: string): string | null => {
    const nameEQ = `${name}=`;
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') {
        c = c.substring(1, c.length);
      }
      if (c.indexOf(nameEQ) === 0) {
        return c.substring(nameEQ.length, c.length);
      }
    }
    return null;
  };

  // Check cookie on mount
  useEffect(() => {
    const hiddenPref = getCookie('hide-dev-warning');
    if (hiddenPref === 'true') {
      // User has chosen to hide the warning
    }
  }, [getCookie]);

  const onButtonPress = () => {
    const hiddenPref = getCookie('hide-dev-warning');
    if (hiddenPref === 'true') {
      // Skip dialog, go directly to dashboard
      router.push(LINKS.DASHBOARD);
    } else {
      setShowDialog(true);
    }
  };

  // const handleDialogClose = (action: 'okay' | 'continue') => {
  //   if (dontShowAgain) {
  //     setCookie('hide-dev-warning', 'true', 365); // Store for 1 year
  //   }
  //   setShowDialog(false);

  //   if (action === 'continue') {
  //     router.push(LINKS.DASHBOARD);
  //   }
  // };

  const leftContent = (
    <Link href="/">
      <Image
        alt="Bounty Logo"
        className="h-10 w-10"
        height={40}
        src="/bdn-b-w-trans.png"
        width={40}
      />
    </Link>
  );

  const rightContent = (
    <nav className="flex items-center gap-8">
      <Link
        className="text-gray-300 transition-colors hover:text-white"
        href={LINKS.BLOG}
      >
        Blog
      </Link>
      <Link
        className="text-gray-300 transition-colors hover:text-white"
        href={LINKS.CONTRIBUTORS}
      >
        Contributors
      </Link>
      {process.env.NODE_ENV === 'development' ? (
        session ? (
          <Button
            className="bg-white text-black hover:bg-gray-100"
            onClick={onButtonPress}
            variant="secondary"
          >
            Create bounties
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Link href={LINKS.LOGIN}>
            <Button
              className="bg-white text-black hover:bg-gray-100"
              variant="secondary"
            >
              Log in
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        )
      ) : (
        <Link href={LINKS.SOCIALS.GITHUB} target="_blank">
          <Button
            className="bg-white text-black hover:bg-gray-100"
            variant="secondary"
          >
            GitHub
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      )}
    </nav>
  );

  return (
    <>
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between p-6">
        {leftContent}
        {rightContent}
      </header>

      <DevWarningDialog
        onContinue={(hide) => {
          if (hide) {
            setCookie('hide-dev-warning', 'true', 365);
          }
          setShowDialog(false);
          router.push(LINKS.DASHBOARD);
        }}
        onOkay={(hide) => {
          if (hide) {
            setCookie('hide-dev-warning', 'true', 365);
          }
          setShowDialog(false);
        }}
        onOpenChange={setShowDialog}
        open={showDialog}
      />
    </>
  );
}
