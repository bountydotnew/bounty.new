'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@bounty/ui/components/sheet';
import { Logo } from './logo';
import { useSession } from '@/context/session-context';

const NAV_LINKS = [
  { href: '/blog', label: 'Blog' },
  { href: '/contributors', label: 'For Devs' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/roadmap', label: 'Roadmap' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, session, isPending } = useSession();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border-default/40">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_auto] lg:grid-cols-[auto_1fr_auto] items-center h-16 gap-8">
          <div className="col-start-1">
            <Link
              href="/"
              className="flex items-center gap-1 hover:opacity-80 transition-opacity"
              onClick={() => setIsOpen(false)}
            >
              <Logo className="h-5 w-5" />
              <span className="text-base font-medium text-foreground">
                bounty.new
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center justify-center gap-6 col-start-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-text-muted hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3 col-start-3">
            {/* Loading state */}
            {isPending && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-20 bg-surface-1 animate-pulse rounded-full" />
                <div className="h-9 w-28 bg-surface-1 animate-pulse rounded-full" />
              </div>
            )}

            {/* Not authenticated */}
            {!(isAuthenticated || isPending) && (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center bg-surface-1 text-foreground rounded-full text-xs sm:text-sm font-medium hover:bg-surface-2 transition-colors border border-border-default whitespace-nowrap"
                  style={{ padding: '.4em .75em .42em' }}
                >
                  Sign in
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center bg-foreground text-background rounded-full text-xs sm:text-sm font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap"
                  style={{ padding: '.4em .75em .42em' }}
                >
                  <span className="sm:hidden">Bounties</span>
                  <span className="hidden sm:inline">Browse Bounties</span>
                </Link>
              </>
            )}

            {/* Logged in: show user info with minimal nav */}
            {isAuthenticated && (
              <>
                {session?.user?.image ? (
                  <img
                    src={session.user.image}
                    alt={
                      session?.user?.name || session?.user?.email?.split('@')[0]
                    }
                    className="h-7 w-7 rounded-full hidden sm:block"
                  />
                ) : (
                  <span className="text-sm text-text-muted hidden sm:inline-flex">
                    {session?.user?.name || session?.user?.email?.split('@')[0]}
                  </span>
                )}
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center bg-foreground text-background rounded-full text-xs sm:text-sm font-medium hover:bg-foreground/90 transition-colors whitespace-nowrap"
                  style={{ padding: '.4em .75em .42em' }}
                >
                  Dashboard
                </Link>
              </>
            )}

            {/* Hamburger Menu - mobile only, shows nav links */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-2 text-text-muted hover:text-foreground transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-64 bg-background border-l border-border-default/40 p-6"
              >
                <nav className="flex flex-col gap-6 mt-8">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-base text-text-muted hover:text-foreground transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Loading state */}
                  {isPending && (
                    <>
                      <div className="h-6 bg-surface-1 animate-pulse rounded" />
                      <div className="h-6 bg-surface-1 animate-pulse rounded" />
                    </>
                  )}
                  {/* Not authenticated */}
                  {!(isAuthenticated || isPending) && (
                    <>
                      <Link
                        href="/login"
                        className="text-base text-text-muted hover:text-foreground transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-base text-foreground hover:text-foreground transition-colors font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Browse Bounties
                      </Link>
                    </>
                  )}
                  {/* Show dashboard link when logged in */}
                  {isAuthenticated && (
                    <Link
                      href="/dashboard"
                      className="text-base text-text-muted hover:text-foreground transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                  {/* Not authenticated */}
                  {!(isAuthenticated || isPending) && (
                    <>
                      <Link
                        href="/login"
                        className="text-base text-text-muted hover:text-white transition-colors"
                        onClick={() => setIsOpen(false)}
                      >
                        Sign in
                      </Link>
                      <Link
                        href="/dashboard"
                        className="text-base text-white hover:text-white transition-colors font-medium"
                        onClick={() => setIsOpen(false)}
                      >
                        Browse Bounties
                      </Link>
                    </>
                  )}
                  {/* Show dashboard link when logged in */}
                  {isAuthenticated && (
                    <Link
                      href="/dashboard"
                      className="text-base text-text-muted hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Dashboard
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
