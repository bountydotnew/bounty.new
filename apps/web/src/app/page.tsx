'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { authClient } from '@bounty/auth/client';
import { Footer } from '@/components/sections/home/footer';
import { Header } from '@/components/sections/home/header';
import { BackedByBadge } from '@bounty/ui/components/backed-by-badge';
import { BountyForm } from '@/components/waitlist/bounty-form';
import { BountyStatistics } from '@/components/sections/home/bounty-statistics';
import { WaitlistCount } from '@/components/sections/home/waitlist-count';

const WAITLIST_STORAGE_KEY = 'bounty_waitlist_entry';

interface WaitlistEntry {
  entryId: string;
  email: string;
}

export default function Home() {
  const router = useRouter();
  const [existingEntry, setExistingEntry] = useState<WaitlistEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing waitlist entry on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WAITLIST_STORAGE_KEY);
      if (stored) {
        const entry = JSON.parse(stored) as WaitlistEntry;
        if (entry.entryId && entry.email) {
          setExistingEntry(entry);
        }
      }
    } catch {
      // Invalid stored data, ignore
    }
    setIsLoading(false);
  }, []);

  const handleCheckPlace = () => {
    if (existingEntry) {
      router.push(`/waitlist/dashboard?entryId=${existingEntry.entryId}`);
    }
  };

  const handleStartOver = () => {
    localStorage.removeItem(WAITLIST_STORAGE_KEY);
    setExistingEntry(null);
  };

  const handleLoginWithGithub = () => {
    authClient.signIn.social({
      provider: 'github',
      callbackURL: '/waitlist/dashboard',
    });
  };

  return (
    <>
      <div
        className="relative min-h-screen text-white"
        style={{
          background:
            'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
        }}
      >
        {/* Background geometric shapes */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute right-[-10%] top-[10%] h-[600px] w-[600px] rounded-full opacity-[0.03]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute bottom-[10%] left-[-5%] h-[400px] w-[400px] rounded-full opacity-[0.02]"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
            }}
          />
        </div>

        <Header />

        <main className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col items-center justify-start px-6 py-20">
          <div className="flex w-full max-w-2xl flex-col items-center text-center">
            <div className="">
              <BackedByBadge />
            </div>

            <h1
              className="mb-8 font-display text-5xl leading-tight md:text-7xl"
              style={{ color: 'rgba(239, 239, 239, 1)' }}
            >
              Ship fast.
              <br />
              Get paid faster.
            </h1>

            <p
              className="mb-12 max-w-2xl font-display-book text-xl leading-relaxed"
              style={{ color: 'rgba(146, 146, 146, 1)' }}
            >
              The bounty platform where creators post challenges and developers
              deliver solutions. Instant payouts, integration, zero friction.
            </p>


            {/* Bounty Statistics */}
            {/* <div className="mb-12 flex w-full items-center justify-center">
              <BountyStatistics />
            </div> */}
            {/* Waitlist Count */}
            <div className="flex w-full items-center justify-center mb-8">
              <WaitlistCount />
            </div>

            {isLoading ? (
              <div className="h-[200px] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
              </div>
            ) : existingEntry ? (
              <div className="w-full max-w-md">
                <div className="rounded-[21px] border border-[#232323] bg-[#191919] p-6">
                  <div className="mb-4 flex items-center justify-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#232323]">
                      <svg
                        className="h-6 w-6 text-green-400"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </div>
                  </div>

                  <h3 className="mb-2 text-xl font-medium text-white">
                    You're on the list!
                  </h3>
                  <p className="mb-6 text-sm text-[#929292]">
                    Signed up as{' '}
                    <span className="text-white">{existingEntry.email}</span>
                  </p>

                  <button
                    onClick={handleCheckPlace}
                    className="flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-base font-medium text-white transition-opacity hover:opacity-90"
                    style={{
                      backgroundImage:
                        'linear-gradient(180deg, #ccc 0%, #808080 100%)',
                    }}
                    type="button"
                  >
                    Check your place in line
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 16 16"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 8h10M9 4l4 4-4 4"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  <button
                    onClick={handleStartOver}
                    className="mt-4 text-sm text-[#5A5A5A] transition-colors hover:text-white"
                    type="button"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <BountyForm />

                {/* Divider */}
                <div className="mt-8 flex w-full max-w-md items-center gap-4">
                  <div className="h-px flex-1 bg-[#232323]" />
                  <span className="text-sm text-[#5A5A5A]">or</span>
                  <div className="h-px flex-1 bg-[#232323]" />
                </div>

                {/* Login with GitHub */}
                <button
                  onClick={handleLoginWithGithub}
                  className="mt-6 flex items-center gap-2 text-sm text-[#929292] transition-colors hover:text-white"
                  type="button"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  Already on the list? Log in with GitHub
                </button>
              </>
            )}
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
