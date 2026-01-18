"use client";

import Link from 'next/link';
import { Logo } from './logo';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#0E0E0E] border-b border-[#2a2a2a]/40">
      <div className="container mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_auto] lg:grid-cols-[auto_1fr_auto] items-center h-16 gap-8">
          <div className="col-start-1">
            <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              <Logo className="h-5 w-5" />
              <span className="text-base font-medium text-white">bounty.new</span>
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-6 col-start-2">
            <Link href="/blog" className="text-sm text-[#989898] hover:text-white transition-colors">
              Blog
            </Link>
            <Link href="/dashboard" className="text-sm text-[#989898] hover:text-white transition-colors">
              Browse Bounties
            </Link>
            <Link href="/contributors" className="text-sm text-[#989898] hover:text-white transition-colors">
              For Devs
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-[#989898] hover:text-white transition-colors hidden sm:inline-flex"
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-3 col-start-3">

            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-[#1a1a1a] text-white rounded-full text-sm font-medium hover:bg-[#252525] transition-colors border border-[#333] hidden sm:inline-flex"
              style={{ padding: '.4em .75em .42em' }}
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center bg-white text-[#0E0E0E] rounded-full text-sm font-medium hover:bg-[#e5e5e5] transition-colors"
              style={{ padding: '.4em .75em .42em' }}
            >
              Browse Bounties
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
