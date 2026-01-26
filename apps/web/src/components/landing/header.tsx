"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Menu, Star, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { GithubIcon } from '@bounty/ui/components/icons/huge/github';
import { Sheet, SheetContent, SheetTrigger } from '@bounty/ui/components/sheet';
import { Logo } from './logo';
import { useSession } from '@/context/session-context';
import { trpc } from '@/utils/trpc';
import { LINKS } from '@/constants';

const REPOSITORY = 'bountydotnew/bounty.new';

const NAV_LINKS = [
  { href: '/blog', label: 'Blog' },
  { href: '/contributors', label: 'For Devs' },
  { href: '/pricing', label: 'Pricing' },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, session, isPending } = useSession();
  const { data: repoStats } = useQuery(
    trpc.repository.stats.queryOptions({ repo: REPOSITORY })
  );

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0E0E0E] border-b border-[#2a2a2a]/40">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_auto] lg:grid-cols-[auto_1fr_auto] items-center h-16 gap-8">
          <div className="col-start-1">
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity" onClick={() => setIsOpen(false)}>
              <Logo className="h-5 w-5" />
              <span className="text-base font-medium text-white">bounty.new</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center justify-center gap-6 col-start-2">
            {/* Hide nav links when logged in */}
            {!isAuthenticated && NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-[#989898] hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3 col-start-3">
            {!isAuthenticated && !isPending && (
              <Link
                href={LINKS.SOCIALS.GITHUB}
                target="_blank"
                className="inline-flex items-center justify-center gap-1.5 bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#252525] transition-colors border border-[#333]"
                style={{ padding: '.4em .9em .42em' }}
              >
                <GithubIcon className="h-3.5 w-3.5" />
                <Star className="h-3 w-3.5 fill-white" />
                <span>
                  {repoStats?.repo.stargazersCount?.toLocaleString() || '0'}
                </span>
              </Link>
            )}

            {/* Logged in: show user info with minimal nav */}
            {isAuthenticated && (
              <>
                <span className="text-sm text-[#989898] hidden sm:inline-flex">
                  {session?.user?.name || session?.user?.email?.split('@')[0]}
                </span>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 bg-white text-[#0E0E0E] rounded-full text-sm font-medium hover:bg-[#e5e5e5] transition-colors px-4 py-2"
                >
                  <User className="h-4 w-4" />
                  Dashboard
                </Link>
              </>
            )}

            {/* Hamburger Menu - mobile only, shows nav links */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <button
                  className="inline-flex items-center justify-center rounded-md p-2 text-[#989898] hover:text-white transition-colors"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-64 bg-[#0E0E0E] border-l border-[#2a2a2a]/40 p-6">
                <nav className="flex flex-col gap-6 mt-8">
                  {/* Hide nav links when logged in */}
                  {!isAuthenticated && NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-base text-[#989898] hover:text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                  {/* Show dashboard link when logged in */}
                  {isAuthenticated && (
                    <Link
                      href="/dashboard"
                      className="text-base text-[#989898] hover:text-white transition-colors"
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
