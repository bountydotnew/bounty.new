"use client";

import { useState } from "react";
import Link from "next/link";
import { YCombinator } from "@/components/icons/g-combinator";
import { BackedByBadge } from "../../registry/new-york/gcombinator-badge/gcombinator-badge";
import { BountyForm } from "@/components/waitlist/bounty-form";
import { VerifyEmail } from "@/components/waitlist/verify-email";
import { Onboarding } from "@/components/waitlist/onboarding";
import { DashboardPreview } from "@/components/waitlist/dashboard-preview";

type FlowStep = "landing" | "verify" | "onboarding" | "dashboard";

export default function Home() {
  const [step, setStep] = useState<FlowStep>("landing");
  const [email, setEmail] = useState("");
  const [entryId, setEntryId] = useState("");

  const handleSubmitSuccess = (submittedEmail: string, id: string) => {
    setEmail(submittedEmail);
    setEntryId(id);
    setStep("verify");
  };

  const handleVerified = (id: string) => {
    setEntryId(id);
    setStep("onboarding");
  };

  const handleOnboardingComplete = () => {
    setStep("dashboard");
  };

  const handleBack = () => {
    setStep("landing");
  };

  return (
    <div className="relative min-h-svh bg-[#111111] text-white overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(180deg, #181818 0%, #111111 100%)" }}
      />

      {/* Background SVG - large decorative logo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <svg
          className="absolute -right-[10rem] top-1/2 -translate-y-1/2 h-[50rem] w-[50rem] opacity-[0.06]"
          fill="none"
          viewBox="0 0 153 179"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179"
            stroke="currentColor"
            strokeWidth="21.3696"
          />
        </svg>
      </div>

      {/* Header */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <svg
            fill="none"
            stroke="currentColor"
            strokeWidth="21.3696"
            viewBox="0 0 153 179"
            xmlns="http://www.w3.org/2000/svg"
            className="h-9 w-9"
          >
            <path d="M91.1385 71.1097C107.031 77.947 125.457 70.6065 132.294 54.7141C139.132 38.8217 131.791 20.3956 115.899 13.5582C100.006 6.72079 81.5803 14.0613 74.7429 29.9537C67.9055 45.8461 75.2461 64.2723 91.1385 71.1097ZM91.1385 71.1097L29.921 44.7722M5 102.256L33.9985 114.732C49.8909 121.57 68.317 114.229 75.1544 98.3367C81.9918 82.4443 74.6513 64.0182 58.7589 57.1808L29.7603 44.7048M148.655 95.8569L119.657 83.3808C103.764 76.5434 85.338 83.8839 78.5006 99.7763L78.5182 179" />
          </svg>
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/blog" className="text-base font-medium text-white/90 transition-colors hover:text-white">
            Blog
          </Link>
          <Link href="/contributors" className="text-base font-medium text-white/90 transition-colors hover:text-white">
            Contributors
          </Link>
          <Link
            href="https://github.com/bountydotnew/bounty.new"
            className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-base font-medium text-black transition-opacity hover:opacity-90"
          >
            GitHub
          </Link>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-24 pb-24">
        {step === "landing" && (
          <>
            {/* YC Badge */}
            <BackedByBadge
              className="mb-4 px-4 py-1.5"
              icon={<YCombinator />}
              text="rejected by ycombinator"
            />

            {/* Headline */}
            <h1 className="text-center text-[72px] md:text-[87px] font-medium leading-[1.1] tracking-[-0.06em]">
              <span className="text-white">Ship fast.</span>
            </h1>
            <h1 className="text-center text-[72px] md:text-[87px] font-medium leading-[1.1] tracking-[-0.06em]">
              <span className="text-white">Get paid faster.</span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 max-w-[775px] text-center text-lg md:text-[22px] font-medium leading-relaxed text-[#929292]">
              The bounty platform where creators post challenges and developers deliver solutions. Instant payouts,
              integration, zero friction.
            </p>

            {/* Bounty Form */}
            <div className="mt-10 w-full max-w-[703px]">
              <BountyForm onSubmitSuccess={handleSubmitSuccess} />
            </div>
          </>
        )}

        {step === "verify" && (
          <VerifyEmail email={email} onVerified={handleVerified} onBack={handleBack} />
        )}

        {step === "onboarding" && <Onboarding entryId={entryId} onComplete={handleOnboardingComplete} />}

        {step === "dashboard" && <DashboardPreview entryId={entryId} email={email} />}
      </main>
    </div>
  );
}
