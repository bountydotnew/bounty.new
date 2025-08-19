"use client";

import { Header } from "@/components/sections/home/header";
import { grim } from "@bounty/dev-logger";
import { WaitlistForm } from "@/components/sections/home/waitlist-form";
import { BountyStatistics } from "@/components/sections/home/bounty-statistics";

const { log } = grim();

export default function Home() {

  return (
    // <div className="bg-landing-background mx-auto w-full">
    //   <Header />
    //   <V0Hero />
    //   <Footer />
    // </div>

    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)",
      }}
    >
      {/* Background geometric shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="153"
          height="179"
          viewBox="0 0 153 179"
          fill="none"
          className="absolute top-0 -right-[35rem] z-0 transition-transform duration-300 ease-out desktop-svg md:opacity-20 lg:opacity-10 opacity-10"
          style={{
            width: "75rem",
            height: "75rem",
          }}
        >
          <path
            d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
            stroke="url(#paint0_linear_34_3652)"
            strokeWidth="21.3696"
          />
          <defs>
            <linearGradient
              id="paint0_linear_34_3652"
              x1="35.4019"
              y1="-16.1847"
              x2="150.598"
              y2="205.685"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="rgba(239, 239, 239, 1)" />
              <stop offset="1" stopColor="rgba(146, 146, 146, 1)" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <Header />


      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20">
        <div className="max-w-4xl">
          <h1 className="text-7xl mb-8 leading-tight font-display" style={{ color: "rgba(239, 239, 239, 1)" }}>
            Ship fast.
            <br />
            Get paid faster.
          </h1>

          <p className="text-xl mb-12 max-w-2xl font-display-book  leading-relaxed" style={{ color: "rgba(146, 146, 146, 1)" }}>
            The bounty platform where creators post challenges and developers deliver solutions. Instant payouts,
            integration, zero friction.
          </p>


          <WaitlistForm />
          <BountyStatistics />
        </div>
      </main>
    </div>
  );
}
