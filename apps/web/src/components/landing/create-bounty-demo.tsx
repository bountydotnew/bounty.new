'use client';

import Image from 'next/image';
import { Plus, ChevronDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, useReducer } from 'react';
import {
  CompactBountyCard,
  StandardBountyCard,
} from '@/components/bounty/bounty-card';
import type { Bounty } from '@/types/dashboard';
import { devNames } from './demo-data';
import {
  MockBrowser,
  useMockBrowser,
  TutorialProvider,
  TutorialHighlight,
  useTutorial,
} from './mockup';
import {
  HomeIcon,
  BountiesIcon,
  BookmarksIcon,
  SettingsGearIcon,
  GithubIcon,
} from '@bounty/ui';
import { ChevronSortIcon } from '@bounty/ui/components/icons/huge/chevron-sort';
import { CalendarIcon } from '@bounty/ui/components/icons/huge/calendar';

// Animation state for create-bounty demo
type BountyAnimState = {
  botCommentVisible: boolean;
  botReacted: boolean;
  showSuccess: boolean;
};

type BountyAnimAction =
  | { type: 'SHOW_COMMENT' }
  | { type: 'SET_REACTED' }
  | { type: 'SHOW_SUCCESS' }
  | { type: 'RESET' };

const initialBountyAnimState: BountyAnimState = {
  botCommentVisible: false,
  botReacted: false,
  showSuccess: false,
};

function bountyAnimReducer(
  state: BountyAnimState,
  action: BountyAnimAction
): BountyAnimState {
  switch (action.type) {
    case 'SHOW_COMMENT':
      return { ...state, botCommentVisible: true };
    case 'SET_REACTED':
      return { ...state, botReacted: true };
    case 'SHOW_SUCCESS':
      return { ...state, showSuccess: true };
    case 'RESET':
      return initialBountyAnimState;
    default:
      return state;
  }
}

interface BountyDashboardPageProps {
  compact?: boolean;
}

function DashboardSidebar({ compact }: { compact: boolean }) {
  return (
    <aside
      className={`${compact ? 'w-12' : 'w-64'} bg-background border-r border-border-subtle flex flex-col`}
    >
      <div className={`${compact ? 'px-2 py-3' : 'px-[15px] py-4'}`}>
        <div
          className={`${compact ? ' justify-center flex items-center gap-2' : 'flex items-center gap-2'}`}
        >
          <div
            className={`${compact ? 'h-5 w-5 text-xs' : 'h-[27px] w-[27px]'} rounded-[6px] bg-brand-primary flex items-center justify-center text-white font-semibold shrink-0`}
          >
            g
          </div>
          {!compact && (
            <span className="text-[18px] font-semibold leading-[150%] text-foreground">
              grim
            </span>
          )}
        </div>
      </div>

      <nav
        className={`${compact ? 'gap-1 px-1' : 'flex flex-col gap-[8px] px-[15px]'} flex-1`}
      >
        <button
          type="button"
          className={`${compact ? 'flex items-center justify-center px-1.5 py-1.5' : 'flex items-center gap-[10px] rounded-[10px] border border-border-subtle bg-surface-1 px-[12px] py-[8px] text-[16px]'} font-medium text-foreground w-full`}
        >
          <HomeIcon
            className={`${compact ? 'size-4' : 'size-4'} text-text-secondary shrink-0`}
          />
          {!compact && <span>Home</span>}
        </button>
        <button
          type="button"
          className={`${compact ? 'flex items-center justify-center px-1.5 py-1.5' : 'flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[16px]'} font-medium text-text-tertiary hover:text-foreground hover:bg-surface-1 transition-colors w-full`}
        >
          <BountiesIcon className={compact ? 'size-4' : 'size-4'} shrink-0 />
          {!compact && <span>Bounties</span>}
        </button>
        <button
          type="button"
          className={`${compact ? 'flex items-center justify-center px-1.5 py-1.5' : 'flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[16px]'} font-medium text-text-tertiary hover:text-foreground hover:bg-surface-1 transition-colors w-full`}
        >
          <BookmarksIcon className={compact ? 'size-4' : 'size-4'} shrink-0 />
          {!compact && <span>Bookmarks</span>}
        </button>
      </nav>

      <div className={`${compact ? 'px-1 py-2' : 'px-[15px] py-4'}`}>
        <button
          type="button"
          className={`${compact ? 'flex items-center justify-center px-1.5 py-1.5' : 'flex items-center gap-[10px] rounded-[10px] px-[12px] py-[8px] text-[16px]'} text-text-tertiary transition-colors hover:text-foreground hover:bg-surface-1 w-full`}
        >
          <SettingsGearIcon className={compact ? 'size-4' : 'size-4'} />
        </button>
      </div>
    </aside>
  );
}

function DashboardHeader({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex items-center justify-between bg-background border-b border-border-subtle ${compact ? 'h-10 px-2' : 'h-[72px] px-4 sm:px-6'} sticky top-0 z-10`}
    >
      <div className="flex flex-1 items-center justify-center gap-6" />
      <div className="flex items-center gap-2">
        <button
          className={`flex items-center gap-[7px] rounded-[12px] border border-border-subtle bg-surface-1 transition-colors hover:bg-surface-2 ${compact ? 'px-1.5 py-1' : 'py-[5px] px-[10px]'}`}
          type="button"
        >
          <Plus
            className={`${compact ? 'h-3 w-3' : 'h-4 w-4'} text-text-secondary`}
          />
          <span
            className={`${compact ? 'text-[10px]' : 'text-[16px]'} font-semibold leading-[150%] tracking-[0.01em] text-text-secondary`}
          >
            Create Bounty
          </span>
        </button>
      </div>
    </div>
  );
}

function CreateBountyFormCard({
  compact,
  onCreateBounty,
}: {
  compact: boolean;
  onCreateBounty: () => void;
}) {
  return (
    <div
      className={`flex w-full shrink-0 flex-col ${compact ? 'px-3 py-2' : 'px-6 lg:px-8'} max-w-[880px] mx-auto min-w-0`}
    >
      <div
        className={`w-full flex flex-col ${compact ? 'my-2' : 'mt-8 mb-6'} min-w-0`}
      >
        <div
          className={`bg-surface-1 text-text-tertiary border border-border-subtle ${compact ? 'rounded-xl' : 'rounded-[24px]'} relative overflow-hidden w-full min-w-0 flex flex-col ${compact ? 'p-3 gap-2' : 'p-5 gap-4'}`}
        >
          <div className={`flex flex-col ${compact ? 'gap-1.5' : 'gap-2'}`}>
            <div
              className={`flex flex-row flex-wrap items-center ${compact ? 'gap-1.5' : 'gap-[6px]'}`}
            >
              <div
                className={`rounded-full flex justify-center items-center shrink-0 gap-1.5 bg-surface-2 border border-solid border-border-subtle ${compact ? 'px-2 py-1' : 'px-[11px] py-[6px]'}`}
              >
                <span
                  className={`${compact ? 'text-[11px]' : 'text-[16px]'} leading-5 font-sans text-foreground truncate`}
                >
                  Add OAuth integration
                </span>
                <ChevronSortIcon
                  className={`${compact ? 'size-1.5' : 'size-2'} text-text-muted shrink-0`}
                />
              </div>
              <div
                className={`rounded-full flex justify-center items-center shrink-0 gap-1.5 bg-surface-2 border border-solid border-border-subtle ${compact ? 'px-2 py-1' : 'px-[11px] py-[6px]'}`}
              >
                <span
                  className={`${compact ? 'text-[11px]' : 'text-[16px]'} leading-5 font-sans text-foreground`}
                >
                  $500
                </span>
                <ChevronSortIcon
                  className={`${compact ? 'size-1.5' : 'size-2'} text-text-muted shrink-0`}
                />
              </div>
              <div className={`relative flex ${compact ? '' : ''}`}>
                <div
                  className={`rounded-full flex justify-center items-center bg-surface-2 border border-solid border-border-subtle ${compact ? 'text-[11px] px-2 py-1 pr-6' : 'text-[16px] leading-5 px-[11px] py-[6px] pr-8 min-w-[150px]'} font-sans text-foreground`}
                >
                  Deadline
                </div>
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-text-muted hover:text-foreground transition-colors"
                >
                  <CalendarIcon className={compact ? 'size-2.5' : 'size-3.5'} />
                </button>
              </div>
            </div>
          </div>

          <textarea
            readOnly
            value={
              compact
                ? 'Need Google & GitHub OAuth integration...'
                : 'Need Google & GitHub OAuth integration with proper error handling and session management.'
            }
            className={`flex-1 bg-transparent text-foreground outline-none resize-none ${compact ? 'min-h-[60px] text-[11px] leading-tight' : 'min-h-[160px] text-[15px] leading-6'}`}
          />

          <div
            className={`flex flex-row justify-between items-center ${compact ? 'pt-0' : 'pt-1'}`}
          >
            <div className="relative flex items-center gap-2">
              <div
                className={`flex flex-row items-center gap-1.5 text-text-tertiary ${compact ? '' : ''}`}
              >
                <GithubIcon className={compact ? 'w-3 h-3' : 'w-4 h-4'} />
                <span
                  className={`${compact ? 'text-[11px]' : 'text-[14px]'} leading-[150%] tracking-[-0.02em] font-medium text-foreground truncate`}
                >
                  bountydotnew/bounty.new
                </span>
                <ChevronDown className={compact ? 'w-2 h-2' : 'w-3 h-3'} />
              </div>
            </div>
            {!compact && (
              <TutorialHighlight
                stepId="create-bounty"
                tooltip="Click to create your bounty"
                borderRadius="rounded-full"
              >
                <button
                  type="button"
                  onClick={onCreateBounty}
                  className="flex items-center justify-center gap-1.5 px-[16px] h-[34px] rounded-full text-[15px] font-medium bg-foreground text-background shadow-lg shadow-foreground/20 hover:bg-foreground/90 transition-colors"
                >
                  Create bounty
                </button>
              </TutorialHighlight>
            )}
            {compact && (
              <button
                type="button"
                onClick={onCreateBounty}
                className="flex items-center justify-center gap-1 px-3 h-7 rounded-full text-[11px] font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function BountyFeedList({
  compact,
  feedBounties,
  visibleCount,
}: {
  compact: boolean;
  feedBounties: Bounty[];
  visibleCount: number;
}) {
  return (
    <div
      className={`flex w-full shrink-0 flex-col ${compact ? 'px-3 py-2' : 'px-6 lg:px-8'} max-w-[880px] mx-auto min-w-0 ${compact ? '' : 'pb-10'}`}
    >
      <div
        className={`flex flex-col ${compact ? 'gap-2' : 'gap-3'} ${compact ? 'py-1' : 'pt-4'} pointer-events-none`}
      >
        {feedBounties
          .slice(0, compact ? 3 : visibleCount)
          .map((bounty, index) => (
            <div
              key={bounty.id}
              className="animate-in fade-in slide-in-from-bottom-2 duration-500"
            >
              {compact ? (
                <CompactBountyCard
                  bounty={bounty}
                  stats={{
                    commentCount: 3 + index,
                    voteCount: 2,
                    submissionCount: 1 + (index % 2),
                    isVoted: false,
                    bookmarked: false,
                  }}
                />
              ) : (
                <StandardBountyCard
                  bounty={bounty}
                  stats={{
                    commentCount: 3 + index,
                    voteCount: 2,
                    submissionCount: 1 + (index % 2),
                    isVoted: false,
                    bookmarked: false,
                  }}
                />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function BountyDashboardPage({ compact = false }: BountyDashboardPageProps) {
  const { navigate } = useMockBrowser();
  const { advanceStep } = useTutorial();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(0);
  const [mountTime] = useState(() => Date.now());

  useEffect(() => {
    if (compact) {
      return;
    }
    const timer = setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: 100, behavior: 'smooth' });
      }
    }, 1800);
    return () => clearTimeout(timer);
  }, [compact]);

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
      const createdAt = new Date(
        mountTime - index * 1000 * 60 * 45
      ).toISOString();
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
  }, [mountTime]);

  // Shuffle is stable since mockBounties only changes on mount
  const feedBounties = useMemo(() => {
    const shuffled = [...mockBounties];
    // Fisher-Yates shuffle with seeded index to avoid Math.random in memo
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = (i * 7 + 3) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
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
    <div className="bg-background h-full flex">
      <DashboardSidebar compact={compact} />
      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <DashboardHeader compact={compact} />
        <CreateBountyFormCard
          compact={compact}
          onCreateBounty={handleCreateBounty}
        />
        <div className="h-px w-full shrink-0 bg-surface-3" />
        <BountyFeedList
          compact={compact}
          feedBounties={feedBounties}
          visibleCount={visibleCount}
        />
      </div>
    </div>
  );
}

function StripeOrderSummary() {
  return (
    <div className="bg-surface-1 p-8 lg:p-12 border-r border-border-default">
      <div className="max-w-md">
        <p className="text-sm text-text-muted mb-1">Pay Bounty sandbox</p>
        <h1 className="text-[42px] font-semibold tracking-tight text-foreground mb-8">
          $1,029.30
        </h1>

        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-foreground">
                Bounty creation deposit
              </p>
              <p className="text-sm text-text-muted">
                Upfront bounty creation deposit
              </p>
            </div>
            <span className="text-foreground">$1,000.00</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-foreground">Processing Fees</p>
              <p className="text-sm text-text-muted">
                Stripe processing fees (2.9% + $0.30)
              </p>
            </div>
            <span className="text-foreground">$29.30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function StripePaymentForm({ onPay }: { onPay: () => void }) {
  return (
    <div className="p-8 lg:p-12">
      <div className="max-w-md mx-auto">
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            className="flex-1 h-12 rounded-md bg-success text-white font-semibold flex items-center justify-center gap-2"
          >
            <span className="text-lg">⚡</span> Link
          </button>
          <button
            type="button"
            className="flex-1 h-12 rounded-md bg-destructive-surface text-foreground font-semibold"
          >
            Klarna
          </button>
          <button
            type="button"
            className="flex-1 h-12 rounded-md bg-warning text-foreground font-semibold text-sm"
          >
            amazon pay
          </button>
        </div>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-surface-2" />
          <span className="text-sm text-text-muted">OR</span>
          <div className="flex-1 h-px bg-surface-2" />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">
            Contact information
          </p>
          <div className="rounded-md border border-border-default px-4 py-3 text-text-muted">
            grim@bounty.new
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-foreground mb-2">
            Payment method
          </p>
          <div className="rounded-md border border-border-default divide-y divide-border-default">
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-1">
              <input
                type="radio"
                name="payment"
                defaultChecked
                className="w-4 h-4 accent-info"
              />
              <span className="flex-1 text-foreground">Card</span>
              <span className="text-xs text-text-muted">VISA MC AMEX</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-1">
              <input
                type="radio"
                name="payment"
                className="w-4 h-4 accent-info"
              />
              <span className="flex-1 text-foreground">Affirm</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-1">
              <input
                type="radio"
                name="payment"
                className="w-4 h-4 accent-info"
              />
              <span className="flex-1 text-foreground">Cash App Pay</span>
            </label>
            <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-surface-1">
              <input
                type="radio"
                name="payment"
                className="w-4 h-4 accent-info"
              />
              <span className="flex-1 text-foreground">Klarna</span>
            </label>
          </div>
        </div>

        <label
          className="flex items-start gap-3 mb-6 cursor-pointer"
          aria-label="Save my information for faster checkout"
        >
          <input
            type="checkbox"
            defaultChecked
            className="w-4 h-4 mt-0.5 accent-info"
          />
          <div>
            <p className="text-sm text-foreground">
              Save my information for faster checkout
            </p>
            <p className="text-xs text-text-muted">
              Pay securely at Bounty sandbox and everywhere Link is accepted.
            </p>
          </div>
        </label>

        <TutorialHighlight
          stepId="stripe-pay"
          tooltip="Click to complete payment"
          tooltipPosition="bottom"
          borderRadius="rounded-md"
          fullWidth
        >
          <button
            type="button"
            onClick={onPay}
            className="w-full h-12 rounded-md bg-foreground text-background font-semibold hover:bg-foreground/90 transition-colors"
          >
            Pay
          </button>
        </TutorialHighlight>

        <p className="text-xs text-text-muted text-center mt-4">
          By paying, you agree to Link&apos;s Terms and Privacy.
        </p>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-text-muted">
          <span>Powered by</span>
          <span className="font-semibold text-info">stripe</span>
        </div>
      </div>
    </div>
  );
}

function StripeCheckoutPage() {
  const { navigate } = useMockBrowser();
  const { advanceStep } = useTutorial();

  const handlePay = () => {
    advanceStep();
    navigate('github.com/bountydotnew/bounty.new/issues/42');
  };

  return (
    <div className="h-full bg-background overflow-auto">
      <div className="min-h-full flex flex-col">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border-default">
          <button
            type="button"
            className="text-text-muted hover:text-foreground transition-colors"
          >
            ←
          </button>
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"
              fill="#635BFF"
            />
          </svg>
          <span className="px-2 py-0.5 text-xs font-medium bg-surface-1 text-text-muted rounded">
            Sandbox
          </span>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2">
          <StripeOrderSummary />
          <StripePaymentForm onPay={handlePay} />
        </div>
      </div>
    </div>
  );
}

function GitHubIssuePage({
  onShowNotifications,
}: {
  onShowNotifications?: () => void;
}) {
  const [animState, dispatch] = useReducer(
    bountyAnimReducer,
    initialBountyAnimState
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timed sequence for bot animations
  useEffect(() => {
    const timeline: Array<{ delay: number; action: BountyAnimAction }> = [
      { delay: 800, action: { type: 'SHOW_COMMENT' } },
      { delay: 2000, action: { type: 'SET_REACTED' } },
      { delay: 3200, action: { type: 'SHOW_SUCCESS' } },
    ];
    const timers = timeline.map(({ delay, action }) =>
      setTimeout(() => dispatch(action), delay)
    );
    const notifyTimer = setTimeout(() => onShowNotifications?.(), 3200);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(notifyTimer);
    };
  }, [onShowNotifications]);

  // Auto-scroll when new content appears
  useEffect(() => {
    if (
      animState.botCommentVisible ||
      animState.botReacted ||
      animState.showSuccess
    ) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [
    animState.botCommentVisible,
    animState.botReacted,
    animState.showSuccess,
  ]);

  return (
    <div className="h-full bg-gh-bg overflow-auto" ref={scrollRef}>
      {/* GitHub header */}
      <div className="bg-gh-bg border-b border-gh-border px-6 py-4">
        <div className="flex items-center gap-4">
          <svg
            className="h-8 w-8 text-gh-text"
            fill="currentColor"
            viewBox="0 0 16 16"
            aria-hidden="true"
          >
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
          <span className="text-gh-text text-sm">
            bountydotnew / bounty.new
          </span>
        </div>
      </div>

      {/* Issue content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Issue header */}
        <div className="mb-6">
          <h1 className="text-[26px] font-semibold text-gh-text mb-2">
            Add OAuth integration for Google + GitHub
            <span className="text-gh-text-secondary font-normal ml-2">#42</span>
          </h1>
          <div className="flex items-center gap-2 text-sm text-gh-text-secondary">
            <span className="inline-flex items-center gap-1.5 bg-gh-success text-white px-2.5 py-1 rounded-full text-xs font-medium">
              <svg
                className="w-4 h-4"
                fill="currentColor"
                viewBox="0 0 16 16"
                aria-hidden="true"
              >
                <path d="M8 9.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                <path
                  fillRule="evenodd"
                  d="M8 0a8 8 0 100 16A8 8 0 008 0zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z"
                />
              </svg>
              Open
            </span>
            <span>
              <span className="font-semibold text-gh-text">grim</span> opened
              this issue 2 minutes ago
            </span>
          </div>
        </div>

        {/* Issue body */}
        <div className="border border-gh-border rounded-md mb-6">
          <div className="bg-gh-surface px-4 py-3 border-b border-gh-border flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-semibold">
              g
            </div>
            <span className="text-sm text-gh-text font-semibold">grim</span>
            <span className="text-sm text-gh-text-secondary">
              commented 2 minutes ago
            </span>
          </div>
          <div className="p-4 text-sm text-gh-text">
            <p className="mb-4">
              Need Google & GitHub OAuth integration with proper error handling
              and session management.
            </p>
            <p className="text-gh-text-secondary">
              This bounty was created via bounty.new
            </p>
          </div>
        </div>

        {/* Bot comment - Bounty created (animated) */}
        {animState.botCommentVisible && (
          <div className="border border-gh-border rounded-md mb-6 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="bg-gh-surface px-4 py-3 border-b border-gh-border flex items-center gap-3">
              <Image
                src="/images/ruo10xfk-400x400.jpg"
                alt="bountydotnew"
                width={32}
                height={32}
                className="rounded-full"
              />
              <span className="text-sm text-gh-link font-semibold">
                bountydotnew
              </span>
              <span className="inline-flex items-center gap-1 bg-gh-link/10 text-gh-link px-1.5 py-0.5 rounded text-xs border border-gh-link/20">
                bot
              </span>
              <span className="text-sm text-gh-text-secondary">
                commented just now
              </span>
            </div>
            <div className="p-4 text-sm text-gh-text">
              <div className="flex items-center gap-2 mb-3">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded bg-gh-success/20 text-gh-success-text border border-gh-success/40 transition-all duration-500 ${animState.showSuccess ? 'shadow-md shadow-success/50' : ''}`}
                >
                  💰 Bounty Active
                </span>
              </div>
              <p className="mb-3">
                This issue has a <strong>$500.00 USD</strong> bounty attached!
              </p>
              <div className="bg-gh-surface border border-gh-border rounded-md p-3 text-gh-text-secondary text-xs">
                <p>
                  <strong className="text-gh-text">
                    To claim this bounty:
                  </strong>
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Submit a pull request that fixes this issue</li>
                  <li>
                    Comment{' '}
                    <code className="px-1.5 py-0.5 bg-gh-border rounded">
                      /submit #PR_NUMBER
                    </code>{' '}
                    on this issue
                  </li>
                  <li>Wait for the maintainer to approve your solution</li>
                </ol>
              </div>
            </div>
            {/* Bot reactions */}
            <div className="px-4 pb-3 flex items-center gap-2">
              <button
                type="button"
                className="w-7 h-7 rounded-full border border-gh-border flex items-center justify-center text-gh-text-muted hover:border-gh-link hover:text-gh-link transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              {animState.botReacted && (
                <span className="inline-flex items-center gap-1 bg-gh-border px-2 py-0.5 rounded-full text-xs animate-in fade-in zoom-in duration-300">
                  <span>👀</span>
                  <span className="text-gh-text-muted">1</span>
                </span>
              )}
              {animState.showSuccess && (
                <span className="inline-flex items-center gap-1 bg-gh-success/20 px-2 py-0.5 rounded-full text-xs animate-in fade-in zoom-in duration-300">
                  <span>🎉</span>
                  <span className="text-gh-success-text">1</span>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Labels sidebar simulation */}
        <div className="border border-gh-border rounded-md p-4 bg-gh-surface">
          <p className="text-xs font-semibold text-gh-text-secondary uppercase tracking-wide mb-3">
            Labels
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gh-success text-white">
              bounty: $500
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-info text-white">
              enhancement
            </span>
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-info text-white">
              auth
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CreateBountyDemoProps {
  compact?: boolean;
  onShowNotifications?: () => void;
}

export function CreateBountyDemo({
  compact = false,
  onShowNotifications,
}: CreateBountyDemoProps) {
  return (
    <MockBrowser initialUrl="bounty.new/dashboard" headlights compact={compact}>
      <TutorialProvider>
        <MockBrowser.Toolbar />
        <div className="flex-1 relative overflow-hidden">
          <MockBrowser.Page url="bounty.new/dashboard">
            <BountyDashboardPage compact={compact} />
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
