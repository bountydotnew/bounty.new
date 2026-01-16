"use client";

import Image from 'next/image';
import { Plus, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BountyCard } from '@/components/bounty/bounty-card';
import type { Bounty } from '@/types/dashboard';
import { devNames } from './demo-data';
import { MockBrowser, useMockBrowser, TutorialProvider, TutorialHighlight, useTutorial } from './mockup';
import { HomeIcon, BountiesIcon, BookmarksIcon, SettingsGearIcon, GithubIcon } from '@bounty/ui';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';
import { CalendarIcon } from '@bounty/ui/components/icons/huge/calendar';

// ─────────────────────────────────────────────────────────────────────────────
// Bounty Dashboard Page (Create Bounty form + feed)
// ─────────────────────────────────────────────────────────────────────────────
function BountyDashboardPage() {
  const { navigate } = useMockBrowser();
  const { advanceStep } = useTutorial();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [feedBounties, setFeedBounties] = useState<Bounty[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const mockBounties = useMemo(() => {
    const titles = [
      'Add OAuth flow for GitHub + Google',
      'Improve onboarding UX and empty states',
      'Fix Stripe webhook retries and idempotency',
      'Ship dark mode for settings screens',
      'Create a public bounty leaderboard',
      'Implement markdown preview for comments',
      'Polish mobile nav and sticky CTA',
      'Refactor notifications to reduce re-renders',
      'Add repo picker search + fuzzy filter',
      'Improve dashboard loading skeletons',
      'Build a "quick create" modal on /bounties',
      'Add cron to auto-expire old bounties',
    ];
    const descriptions = [
      'Tighten empty states and add onboarding hints for new users.',
      'Make the auth flow resilient and add friendly error messaging.',
      'Prevent duplicate charges and log retry attempts cleanly.',
      'Align spacing, improve contrast, and match dashboard tokens.',
      'Highlight top contributors and most funded bounties.',
      'Support preview and code blocks with clean formatting.',
      'Make the mobile nav feel native with better spacing.',
      'Memoize heavy sections and reduce state churn.',
      'Speed up repo selection with better search.',
      'Add pulse loaders and trim layout shifts.',
      'Add a compact modal to post a bounty fast.',
      'Auto-expire stale bounties after 60 days.',
    ];
    const repos = [
      'https://github.com/bountydotnew/bounty.new',
      'https://github.com/vercel/next.js',
      'https://github.com/supabase/supabase',
      'https://github.com/stripe/stripe-node',
      'https://github.com/tailwindlabs/tailwindcss',
    ];

    return devNames.slice(0, 12).map((author, index) => {
      const createdAt = new Date(Date.now() - index * 1000 * 60 * 45).toISOString();
      const amount = 120 + (index % 6) * 80;
      return {
        id: `demo-bounty-${index}`,
        title: titles[index % titles.length],
        description: descriptions[index % descriptions.length],
        amount,
        currency: 'USD',
        status: 'open',
        deadline: null,
        tags: null,
        repositoryUrl: repos[index % repos.length],
        issueUrl: null,
        createdAt,
        updatedAt: createdAt,
        creator: {
          id: `creator-${index}`,
          name: author,
          image: `https://github.com/${author}.png`,
        },
        votes: 0,
        isFeatured: false,
        paymentStatus: index % 2 === 0 ? 'held' : 'pending',
      } satisfies Bounty;
    });
  }, []);

  useEffect(() => {
    const shuffled = [...mockBounties].sort(() => Math.random() - 0.5);
    setFeedBounties(shuffled);
    setVisibleCount(0);
  }, [mockBounties]);

  useEffect(() => {
    if (feedBounties.length === 0) {
      return () => {
        // no-op
      };
    }
    const interval = setInterval(() => {
      setVisibleCount((count) => {
        if (count >= feedBounties.length) {
          clearInterval(interval);
          return count;
        }
        return count + 1;
      });
    }, 600);
    return () => clearInterval(interval);
  }, [feedBounties]);

  const handleCreateBounty = () => {
    advanceStep();
    navigate('checkout.stripe.com/c/pay_bounty_1234');
  };

  return (
    <div className="bg-[#0E0E0E] h-full flex">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0E0E0E] border-r border-[#232323] flex flex-col">
        {/* Workspace header */}
        <div className="px-[15px] py-4">
          <div className="flex items-center gap-[10px]">
            <div className="h-[27px] w-[27px] rounded-[6px] bg-[#E66700] flex items-center justify-center text-white text-base font-semibold">
              g
            </div>
            <span className="text-[18px] font-semibold leading-[150%] text-[#F2F2F2]">grim</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-[8px] px-[15px] flex-1">
          <button
            type="button"
            className="flex items-center gap-[10px] rounded-[10px] border border-[#232323] bg-[#191919] px-[12px] py-[8px] text-[16px] font-medium text-[#F2F2F2] w-full"
          >
            <HomeIcon className="h-4 w-4 text-[#CFCFCF]" />
            <span>Home</span>
          </button>
          <button type="button" className="flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[16px] font-medium text-[#929292] hover:text-white hover:bg-[#191919] transition-colors w-full">
            <BountiesIcon className="h-4 w-4" />
            <span>Bounties</span>
          </button>
          <button type="button" className="flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[16px] font-medium text-[#929292] hover:text-white hover:bg-[#191919] transition-colors w-full">
            <BookmarksIcon className="h-4 w-4" />
            <span>Bookmarks</span>
          </button>
        </nav>

        {/* Footer */}
        <div className="px-[15px] py-4">
          <button type="button" className="flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[#929292] transition-colors hover:text-white hover:bg-[#191919] w-full">
            <SettingsGearIcon className="h-[18px] w-[18px]" />
            <span className="text-[16px] font-medium leading-[150%]">Settings</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        {/* Header */}
        <div className="flex h-[72px] items-center justify-between bg-[#0E0E0E] border-b border-[#232323] px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex flex-1 items-center justify-center gap-6">
            <button className="relative flex w-[270px] items-center rounded-lg border cursor-pointer border-[#232323] bg-[#191919] py-[5px] pl-[10px] pr-[53px] text-left transition-colors hover:bg-[#141414]" type="button">
              <span className="flex-1 bg-transparent text-[16px] font-medium leading-[150%] tracking-[-0.03em] text-[#5A5A5A] flex items-center">
                Search for anything...
              </span>
              <div className="absolute right-[10px] top-1/2 flex -translate-y-1/2 items-center">
                <div className="flex h-[23px] w-[43px] items-center justify-center rounded-full bg-[#232323]">
                  <span className="text-[16px] font-medium leading-[150%] text-[#5A5A5A]">⌘K</span>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button className="hidden md:flex lg:flex items-center gap-[7px] rounded-[12px] border border-[#232323] bg-[#191919] py-[5px] px-[10px] transition-colors hover:bg-[#141414]" type="button">
              <Plus className="h-4 w-4 text-[#CFCFCF]" />
              <span className="text-[16px] font-semibold leading-[150%] tracking-[0.01em] text-[#CFCFCF]">Create Bounty</span>
            </button>
          </div>
        </div>

        {/* Create bounty form */}
        <div className="flex w-full shrink-0 flex-col px-6 lg:px-8 max-w-[880px] mx-auto min-w-0">
          <div className="w-full flex flex-col mt-8 mb-6 min-w-0">
            <div className="bg-[#191919] text-[#5A5A5A] border border-[#232323] rounded-[24px] relative overflow-hidden w-full min-w-0 p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex flex-row flex-wrap items-center gap-[6px]">
                  <div className="rounded-full flex justify-center items-center px-[11px] py-[6px] shrink-0 gap-2 bg-[#141414] border border-solid border-[#232323]">
                    <span className="text-[16px] leading-5 font-sans text-white">Add OAuth integration</span>
                    <ChevronSortIcon className="size-2 text-[#7D7878] shrink-0" />
                  </div>
                  <div className="rounded-full flex justify-center items-center px-[11px] py-[6px] shrink-0 gap-2 bg-[#141414] border border-solid border-[#232323]">
                    <span className="text-[16px] leading-5 font-sans text-white">$500</span>
                    <ChevronSortIcon className="size-2 text-[#7D7878] shrink-0" />
                  </div>
                  <div className="relative flex">
                    <div className="rounded-full flex justify-center items-center px-[11px] py-[6px] bg-[#141414] border border-solid border-[#232323] text-[16px] leading-5 font-sans text-white pr-8 min-w-[150px]">
                      Deadline, e.g. tomorrow
                    </div>
                    <button type="button" className="absolute top-1/2 right-2 -translate-y-1/2 text-[#7C7878] hover:text-white transition-colors">
                      <CalendarIcon className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <textarea
                readOnly
                value="Need Google & GitHub OAuth integration with proper error handling and session management."
                className="flex-1 min-h-[160px] bg-transparent text-white text-[15px] leading-6 outline-none resize-none"
              />

              <div className="flex flex-row justify-between items-center pt-1">
                <div className="relative flex items-center gap-2">
                  <div className="flex flex-row items-center gap-2 text-[#5A5A5A]">
                    <GithubIcon className="w-4 h-4" />
                    <span className="text-[14px] leading-[150%] tracking-[-0.02em] font-medium text-white">
                      bountydotnew/bounty.new
                    </span>
                    <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
                <TutorialHighlight stepId="create-bounty" tooltip="Click to create your bounty" borderRadius="rounded-full">
                  <button
                    type="button"
                    onClick={handleCreateBounty}
                    className="flex items-center justify-center gap-1.5 px-[16px] h-[34px] rounded-full text-[15px] font-medium bg-white text-black shadow-[0_6px_16px_rgba(255,255,255,0.18)] hover:bg-gray-100 transition-colors"
                  >
                    Create bounty
                  </button>
                </TutorialHighlight>
              </div>
            </div>
          </div>
        </div>

        {/* Feed divider */}
        <div className="h-px w-full shrink-0 bg-[#232323]" />

        {/* Bounty feed */}
        <div className="flex w-full shrink-0 flex-col px-6 lg:px-8 max-w-[880px] mx-auto min-w-0 pb-10">
          <div className="flex flex-col gap-3 pt-4 pointer-events-none">
            {feedBounties.slice(0, visibleCount).map((bounty, index) => (
              <div key={bounty.id} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <BountyCard
                  bounty={bounty}
                  stats={{
                    commentCount: 3 + index,
                    voteCount: 2,
                    submissionCount: 1 + (index % 2),
                    isVoted: false,
                    bookmarked: false,
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe Checkout Page
// ─────────────────────────────────────────────────────────────────────────────
function StripeCheckoutPage() {
  const { navigate } = useMockBrowser();
  const { advanceStep } = useTutorial();

  const handlePay = () => {
    advanceStep();
    navigate('github.com/bountydotnew/bounty.new/issues/42');
  };

  return (
    <div className="h-full bg-white overflow-auto">
      <div className="min-h-full flex flex-col">
        {/* Stripe header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E6E6E6]">
          <button type="button" className="text-[#666] hover:text-[#333] transition-colors">
            ←
          </button>
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" fill="#635BFF" />
          </svg>
          <span className="px-2 py-0.5 text-xs font-medium bg-[#F0F0F0] text-[#666] rounded">Sandbox</span>
        </div>

        {/* Checkout content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          {/* Left: Order summary */}
          <div className="bg-[#FAFAFA] p-8 lg:p-12 border-r border-[#E6E6E6]">
            <div className="max-w-md">
              <p className="text-sm text-[#666] mb-1">Pay Bounty sandbox</p>
              <h1 className="text-[42px] font-semibold tracking-tight text-[#111] mb-8">$1,029.30</h1>

              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#111]">Bounty creation deposit</p>
                    <p className="text-sm text-[#666]">Upfront bounty creation deposit</p>
                  </div>
                  <span className="text-[#111]">$1,000.00</span>
                </div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#111]">Processing Fees</p>
                    <p className="text-sm text-[#666]">Stripe processing fees (2.9% + $0.30)</p>
                  </div>
                  <span className="text-[#111]">$29.30</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment form */}
          <div className="p-8 lg:p-12">
            <div className="max-w-md mx-auto">
              {/* Express checkout */}
              <div className="flex gap-2 mb-6">
                <button type="button" className="flex-1 h-12 rounded-md bg-[#00D775] text-white font-semibold flex items-center justify-center gap-2">
                  <span className="text-lg">⚡</span> Link
                </button>
                <button type="button" className="flex-1 h-12 rounded-md bg-[#FFB3C7] text-[#111] font-semibold">
                  Klarna
                </button>
                <button type="button" className="flex-1 h-12 rounded-md bg-[#FFD814] text-[#111] font-semibold text-sm">
                  amazon pay
                </button>
              </div>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-[#E6E6E6]" />
                <span className="text-sm text-[#666]">OR</span>
                <div className="flex-1 h-px bg-[#E6E6E6]" />
              </div>

              {/* Contact info */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#111] mb-2">Contact information</p>
                <div className="rounded-md border border-[#E6E6E6] px-4 py-3 text-[#444]">
                  grim@bounty.new
                </div>
              </div>

              {/* Payment methods */}
              <div className="mb-6">
                <p className="text-sm font-medium text-[#111] mb-2">Payment method</p>
                <div className="rounded-md border border-[#E6E6E6] divide-y divide-[#E6E6E6]">
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                    <input type="radio" name="payment" defaultChecked className="w-4 h-4 accent-[#635BFF]" />
                    <span className="flex-1 text-[#111]">Card</span>
                    <span className="text-xs text-[#888]">VISA MC AMEX</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                    <input type="radio" name="payment" className="w-4 h-4 accent-[#635BFF]" />
                    <span className="flex-1 text-[#111]">Affirm</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                    <input type="radio" name="payment" className="w-4 h-4 accent-[#635BFF]" />
                    <span className="flex-1 text-[#111]">Cash App Pay</span>
                  </label>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-[#FAFAFA]">
                    <input type="radio" name="payment" className="w-4 h-4 accent-[#635BFF]" />
                    <span className="flex-1 text-[#111]">Klarna</span>
                  </label>
                </div>
              </div>

              {/* Save info checkbox */}
              <label className="flex items-start gap-3 mb-6 cursor-pointer">
                <input type="checkbox" defaultChecked className="w-4 h-4 mt-0.5 accent-[#635BFF]" />
                <div>
                  <p className="text-sm text-[#111]">Save my information for faster checkout</p>
                  <p className="text-xs text-[#666]">Pay securely at Bounty sandbox and everywhere Link is accepted.</p>
                </div>
              </label>

              {/* Pay button */}
              <TutorialHighlight stepId="stripe-pay" tooltip="Click to complete payment" tooltipPosition="bottom" borderRadius="rounded-md" fullWidth>
                <button
                  type="button"
                  onClick={handlePay}
                  className="w-full h-12 rounded-md bg-[#111] text-white font-semibold hover:bg-[#333] transition-colors"
                >
                  Pay
                </button>
              </TutorialHighlight>

              <p className="text-xs text-[#666] text-center mt-4">
                By paying, you agree to Link&apos;s Terms and Privacy.
              </p>

              <div className="flex items-center justify-center gap-2 mt-6 text-xs text-[#888]">
                <span>Powered by</span>
                <span className="font-semibold text-[#635BFF]">stripe</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GitHub Issue Page
// ─────────────────────────────────────────────────────────────────────────────
function GitHubIssuePage({ onShowNotifications }: { onShowNotifications?: () => void }) {
  const [botCommentVisible, setBotCommentVisible] = useState(false);
  const [botReacted, setBotReacted] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timed sequence for bot animations
  useEffect(() => {
    const t1 = setTimeout(() => setBotCommentVisible(true), 800);
    const t2 = setTimeout(() => setBotReacted(true), 2000);
    const t3 = setTimeout(() => {
      setShowSuccess(true);
      onShowNotifications?.();
    }, 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onShowNotifications]);

  // Auto-scroll when new content appears
  useEffect(() => {
    if (botCommentVisible || botReacted || showSuccess) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);
    }
  }, [botCommentVisible, botReacted, showSuccess]);

  return (
    <div className="h-full bg-[#0d1117] overflow-auto" ref={scrollRef}>
      {/* GitHub header */}
      <div className="bg-[#010409] border-b border-[#30363d] px-6 py-4">
        <div className="flex items-center gap-4">
          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="text-white text-sm">bountydotnew / bounty.new</span>
        </div>
      </div>

      {/* Issue content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Issue header */}
        <div className="mb-6">
          <h1 className="text-[26px] font-semibold text-[#e6edf3] mb-2">
            Add OAuth integration for Google + GitHub
            <span className="text-[#7d8590] font-normal ml-2">#42</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-sm font-medium rounded-full bg-[#238636] text-white">Open</span>
            <span className="text-sm text-[#7d8590]">
              <span className="text-[#e6edf3]">grim</span> opened this issue 2 minutes ago
            </span>
          </div>
        </div>

        {/* Issue body */}
        <div className="border border-[#30363d] rounded-md mb-6">
          <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-[#E66700] flex items-center justify-center text-white text-sm font-semibold">
              g
            </div>
            <span className="text-sm text-[#e6edf3] font-semibold">grim</span>
            <span className="text-sm text-[#7d8590]">commented 2 minutes ago</span>
          </div>
          <div className="p-4 text-sm text-[#e6edf3]">
            <p className="mb-4">Need Google & GitHub OAuth integration with proper error handling and session management.</p>
            <p className="text-[#7d8590]">This bounty was created via bounty.new</p>
          </div>
        </div>

        {/* Bot comment - Bounty created (animated) */}
        {botCommentVisible && (
          <div className="border border-[#30363d] rounded-md mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center gap-3">
              <Image
                src="/images/ruo10xfk-400x400.jpg"
                alt="bountydotnew"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-sm text-[#58a6ff] font-semibold">bountydotnew</span>
              <span className="inline-flex items-center gap-1 bg-[#30363d] text-[#8b949e] px-1.5 py-0.5 rounded text-xs border border-[#30363d]">
                bot
              </span>
              <span className="text-sm text-[#7d8590]">commented just now</span>
            </div>
            <div className="p-4 text-sm text-[#e6edf3]">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 text-xs font-medium rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40 transition-all duration-500 ${showSuccess ? 'shadow-[0_0_12px_rgba(63,185,80,0.5)]' : ''}`}>
                  💰 Bounty Active
                </span>
              </div>
              <p className="mb-3">This issue has a <strong>$500.00 USD</strong> bounty attached!</p>
              <div className="bg-[#161b22] border border-[#30363d] rounded-md p-3 text-[#7d8590] text-xs">
                <p><strong className="text-[#e6edf3]">To claim this bounty:</strong></p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Submit a pull request that fixes this issue</li>
                  <li>Comment <code className="px-1.5 py-0.5 bg-[#30363d] rounded">/submit #PR_NUMBER</code> on this issue</li>
                  <li>Wait for the maintainer to approve your solution</li>
                </ol>
              </div>
            </div>
            {/* Bot reactions */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-[#30363d] flex items-center justify-center text-[#8b949e] hover:border-[#58a6ff] hover:text-[#58a6ff] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {botReacted && (
                <span className="inline-flex items-center gap-1 bg-[#30363d] px-2 py-0.5 rounded-full text-xs animate-in fade-in zoom-in duration-300">
                  <span>👀</span>
                  <span className="text-[#8b949e]">1</span>
                </span>
              )}
              {showSuccess && (
                <span className="inline-flex items-center gap-1 bg-[#238636]/20 px-2 py-0.5 rounded-full text-xs animate-in fade-in zoom-in duration-300">
                  <span>🎉</span>
                  <span className="text-[#3fb950]">1</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Labels sidebar simulation */}
        <div className="border border-[#30363d] rounded-md p-4 bg-[#161b22]">
          <p className="text-xs font-semibold text-[#7d8590] uppercase tracking-wide mb-3">Labels</p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#238636] text-white">bounty: $500</span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#1f6feb] text-white">enhancement</span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#8957e5] text-white">auth</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Demo Component
// ─────────────────────────────────────────────────────────────────────────────
export function CreateBountyDemo({ onShowNotifications }: { onShowNotifications?: () => void }) {
  return (
    <MockBrowser initialUrl="bounty.new/dashboard" headlights>
      <TutorialProvider>
        <MockBrowser.Toolbar />
        <div className="flex-1 relative overflow-hidden">
          <MockBrowser.Page url="bounty.new/dashboard">
            <BountyDashboardPage />
          </MockBrowser.Page>
          <MockBrowser.Page url="checkout.stripe.com/c/pay_bounty_1234">
            <StripeCheckoutPage />
          </MockBrowser.Page>
          <MockBrowser.Page url="github.com/bountydotnew/bounty.new/issues/42">
            <GitHubIssuePage onShowNotifications={onShowNotifications} />
          </MockBrowser.Page>
        </div>
      </TutorialProvider>
    </MockBrowser>
  );
}
