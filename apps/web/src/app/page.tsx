'use client';

import { BountyStatistics } from '@/components/sections/home/bounty-statistics';
import { Footer } from '@/components/sections/home/footer';
import { Header } from '@/components/sections/home/header';
import { WaitlistForm } from '@/components/sections/home/waitlist-form';
import { GCombinator } from '@/components/icons';

export default function Home() {
  return (
    <>
      <div
        className="relative h-screen overflow-hidden text-white"
        style={{
          background:
            'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
        }}
      >
        {/* Background geometric shapes */}
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="-right-[35rem] desktop-svg absolute top-0 z-0 h-[75rem] w-[75rem] opacity-0 transition-transform duration-300 ease-out md:opacity-20 lg:opacity-10"
            fill="none"
            height="179"
            viewBox="0 0 153 179"
            width="153"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
              stroke="url(#paint0_linear_34_3652)"
              strokeWidth="21.3696"
            />
            <defs>
              <linearGradient
                gradientUnits="userSpaceOnUse"
                id="paint0_linear_34_3652"
                x1="35.4019"
                x2="150.598"
                y1="-16.1847"
                y2="205.685"
              >
                <stop stopColor="rgba(239, 239, 239, 1)" />
                <stop offset="1" stopColor="rgba(146, 146, 146, 1)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <Header />

        {/* Main content */}
        <main className="relative z-10 mx-auto max-w-7xl px-6 pt-20">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-1 rounded-full rounded-radius border border-white/8 bg-gradient-to-br from-white/8 to-white/4 px-4 py-1.5 text-xs backdrop-blur-xs">
              <span className="ml-0.5 flex items-center gap-0.75 text-xs">
                <GCombinator />
              </span>
              haven’t applied to ycombinator yet
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

            <WaitlistForm />
            <BountyStatistics />
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
