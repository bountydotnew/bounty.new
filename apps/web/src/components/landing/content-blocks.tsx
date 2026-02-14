'use client';

import { ArrowRight } from 'lucide-react';
import { LinearIcon, GithubIcon } from '@bounty/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Content Block Data
// ─────────────────────────────────────────────────────────────────────────────

interface ContentBlock {
  label: string;
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  visual: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual Components for each block
// ─────────────────────────────────────────────────────────────────────────────

function LinearBountyVisual() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
      {/* Linear-style issue list */}
      <div className="p-4 sm:p-6 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <LinearIcon className="w-5 h-5" />
          <span className="text-sm font-medium text-foreground">Linear</span>
          <span className="text-text-muted text-xs">workspace</span>
          <ArrowRight className="w-3 h-3 text-text-muted mx-1" />
          <span className="text-sm font-medium text-foreground">bounty.new</span>
        </div>

        {/* Issue rows */}
        {[
          {
            id: 'BNT-42',
            title: 'Add OAuth integration for Google + GitHub',
            status: 'in-progress',
            bounty: '$500',
            priority: 'urgent',
          },
          {
            id: 'BNT-38',
            title: 'Implement virtual scrolling for bounty list',
            status: 'todo',
            bounty: '$350',
            priority: 'high',
          },
          {
            id: 'BNT-35',
            title: 'Fix Stripe webhook retry idempotency',
            status: 'in-progress',
            bounty: '$750',
            priority: 'urgent',
          },
          {
            id: 'BNT-31',
            title: 'Ship dark mode for settings pages',
            status: 'done',
            bounty: '$200',
            priority: 'medium',
          },
        ].map((issue) => (
          <div
            key={issue.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-surface-hover transition-colors group"
          >
            {/* Status indicator */}
            <div
              className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${
                issue.status === 'done'
                  ? 'bg-[#5E6AD3] border-[#5E6AD3]'
                  : issue.status === 'in-progress'
                    ? 'border-[#F2C94C] bg-transparent'
                    : 'border-text-muted bg-transparent'
              }`}
            >
              {issue.status === 'done' && (
                <svg
                  className="w-full h-full text-white"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M3.5 6.5L5 8L8.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>

            {/* Priority */}
            <div className="flex-shrink-0">
              {issue.priority === 'urgent' && (
                <div className="w-4 h-4 rounded-sm bg-[#F2994A] flex items-center justify-center">
                  <span className="text-[8px] font-bold text-white">!</span>
                </div>
              )}
              {issue.priority === 'high' && (
                <div className="w-4 h-4 rounded-sm bg-[#EB5757] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v5M6 9v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
              {issue.priority === 'medium' && (
                <div className="w-4 h-4 rounded-sm bg-[#F2C94C] flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                    <path d="M3 6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              )}
            </div>

            <span className="text-xs text-text-muted flex-shrink-0">
              {issue.id}
            </span>
            <span className="text-sm text-foreground truncate flex-1">
              {issue.title}
            </span>

            {/* Bounty badge */}
            <span className="flex-shrink-0 text-xs font-medium text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-full">
              {issue.bounty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateBountyFlowVisual() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
      <div className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-medium text-foreground">
            Create Bounty
          </h3>
          <span className="text-xs text-text-muted">Step 1 of 3</span>
        </div>

        {/* Form mockup */}
        <div className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">
              Title
            </label>
            <div className="bg-background border border-border-default rounded-lg px-3 py-2 text-sm text-foreground">
              Add OAuth integration for Google + GitHub
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">
              Bounty Amount
            </label>
            <div className="bg-background border border-border-default rounded-lg px-3 py-2 text-sm text-foreground flex items-center gap-2">
              <span className="text-text-muted">$</span>
              <span>500.00</span>
              <span className="text-text-muted ml-auto text-xs">USD</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">
              Repository
            </label>
            <div className="bg-background border border-border-default rounded-lg px-3 py-2 text-sm text-foreground flex items-center gap-2">
              <GithubIcon className="w-4 h-4 text-foreground flex-shrink-0" />
              <span>bountydotnew/bounty.new</span>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-secondary mb-1.5 block">
              Description
            </label>
            <div className="bg-background border border-border-default rounded-lg px-3 py-2 text-sm text-text-secondary h-16 overflow-hidden">
              Need Google &amp; GitHub OAuth integration with proper error handling
              and session management...
            </div>
          </div>

          {/* CTA button mockup */}
          <div className="pt-2">
            <div className="bg-foreground text-background text-sm font-medium rounded-full px-4 py-2 text-center">
              Create Bounty &mdash; $500.00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProcessStepsVisual() {
  const steps = [
    {
      number: '01',
      title: 'Post a bounty',
      description: 'Describe the work, set a price, and pick a repo.',
      color: 'text-brand-primary',
      borderColor: 'border-brand-primary/30',
    },
    {
      number: '02',
      title: 'Devs compete',
      description:
        'Developers submit PRs. Review solutions at your pace.',
      color: 'text-[#5E6AD3]',
      borderColor: 'border-[#5E6AD3]/30',
    },
    {
      number: '03',
      title: 'Approve & pay',
      description:
        'Merge the PR and the developer gets paid instantly.',
      color: 'text-brand-accent',
      borderColor: 'border-brand-accent/30',
    },
  ];

  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-1 border border-border-subtle p-4 sm:p-6 flex flex-col justify-center">
      <div className="space-y-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className={`flex items-start gap-4 p-4 rounded-xl border ${step.borderColor} bg-background/50`}
          >
            <span
              className={`text-2xl font-display font-medium ${step.color} flex-shrink-0`}
            >
              {step.number}
            </span>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-1">
                {step.title}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GitHubIntegrationVisual() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
      <div className="p-4 sm:p-6">
        {/* GitHub issue header */}
        <div className="flex items-center gap-2 mb-4">
          <GithubIcon className="w-5 h-5 text-foreground" />
          <span className="text-sm text-text-secondary">
            bountydotnew/bounty.new
          </span>
        </div>

        <div className="border border-border-default rounded-xl overflow-hidden">
          {/* Issue title bar */}
          <div className="px-4 py-3 border-b border-border-default">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-success flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">
                Add OAuth integration for Google + GitHub
              </span>
              <span className="text-xs text-text-muted ml-auto">#42</span>
            </div>
          </div>

          {/* Issue body */}
          <div className="px-4 py-3 space-y-3">
            {/* Original comment */}
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-surface-3 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-text-muted mb-1">
                  grim opened this issue
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Need Google &amp; GitHub OAuth integration with proper
                  error handling...
                </p>
              </div>
            </div>

            {/* Bot comment */}
            <div className="flex items-start gap-3 pt-2 border-t border-border-subtle">
              <div className="w-6 h-6 rounded-full bg-brand-accent/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[8px] font-bold text-brand-accent">
                  B
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-foreground">
                    bounty-bot
                  </span>
                  <span className="text-[10px] bg-surface-3 text-text-muted px-1.5 py-0.5 rounded">
                    bot
                  </span>
                </div>
                <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-lg px-3 py-2">
                  <p className="text-xs text-foreground font-medium">
                    $500.00 USD bounty attached!
                  </p>
                  <p className="text-[10px] text-text-secondary mt-1">
                    Submit a PR to claim this bounty. See docs for details.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentFlowVisual() {
  return (
    <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
      <div className="p-4 sm:p-6 flex flex-col justify-center h-full">
        {/* Payment summary card */}
        <div className="border border-border-default rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 border-b border-border-default bg-background/50">
            <span className="text-xs font-medium text-foreground">
              Payment Summary
            </span>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">Bounty amount</span>
              <span className="text-sm font-medium text-foreground">
                $500.00
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                Platform fee (5%)
              </span>
              <span className="text-sm text-text-secondary">$25.00</span>
            </div>
            <div className="border-t border-border-subtle pt-2 mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">
                Developer receives
              </span>
              <span className="text-sm font-medium text-brand-accent">
                $475.00
              </span>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="flex items-center justify-center gap-2 py-3">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-success font-medium">
            Payment held securely until PR is merged
          </span>
        </div>

        {/* Stripe badge */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <svg
            viewBox="0 0 32 32"
            className="h-4 w-auto fill-text-muted"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12.28 10.66c0-2.16 1.8-3.12 4.66-3.12 2.6 0 5.18.76 5.18.76l.72-4.08s-2.2-.82-5.48-.82c-5.3 0-9.14 2.7-9.14 7.62 0 7.6 10.52 6.32 10.52 9.58 0 2.18-1.94 3.24-5.02 3.24-2.96 0-6.1-1.06-6.1-1.06l-.88 4.34s2.78 1.04 6.5 1.04c5.5 0 9.66-2.62 9.66-7.76 0-8.12-10.62-6.68-10.62-9.74z" />
          </svg>
          <span className="text-[10px] text-text-muted">
            Powered by Stripe
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Block Row Component
// ─────────────────────────────────────────────────────────────────────────────

function ContentBlockRow({
  block,
  reversed,
}: {
  block: ContentBlock;
  reversed: boolean;
}) {
  return (
    <div className="container mx-auto px-6 lg:px-8 py-16 lg:py-24">
      <div
        className={`grid gap-8 lg:gap-16 lg:grid-cols-2 lg:items-center ${
          reversed ? 'lg:[direction:rtl]' : ''
        }`}
      >
        {/* Text content */}
        <div
          className={`flex flex-col gap-5 ${reversed ? 'lg:[direction:ltr]' : ''}`}
        >
          <span className="text-xs font-medium tracking-wider uppercase text-text-muted">
            {block.label}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight text-foreground">
            {block.title}
          </h2>
          <p className="text-base text-text-secondary leading-relaxed max-w-lg">
            {block.description}
          </p>
          <a
            href={block.ctaHref}
            target={block.ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={
              block.ctaHref.startsWith('http') ? 'noreferrer' : undefined
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-primary hover:text-brand-primary-hover transition-colors group w-fit"
          >
            {block.ctaText}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Visual content */}
        <div className={reversed ? 'lg:[direction:ltr]' : ''}>
          {block.visual}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Content Blocks Section
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_BLOCKS: ContentBlock[] = [
  {
    label: 'Linear Integration',
    title: 'Create bounties straight from Linear',
    description:
      'Connect your Linear workspace and turn issues into funded bounties without leaving your project management flow. Sync statuses, priorities, and labels automatically.',
    ctaText: 'Learn about integrations',
    ctaHref: 'https://docs.bounty.new/integrations',
    visual: <LinearBountyVisual />,
  },
  {
    label: 'How It Works',
    title: 'From issue to payout in three steps',
    description:
      'Post a bounty describing the work you need done. Developers from around the world compete to build the best solution. Approve the PR and they get paid instantly.',
    ctaText: 'Read the getting started guide',
    ctaHref: 'https://docs.bounty.new/getting-started',
    visual: <ProcessStepsVisual />,
  },
  {
    label: 'Bounty Creation',
    title: 'Set the scope and price, we handle the rest',
    description:
      'Define your bounty with a title, description, budget, and target repo. We create a GitHub issue, hold funds securely via Stripe, and notify eligible developers.',
    ctaText: 'See how bounties work',
    ctaHref: 'https://docs.bounty.new/bounties',
    visual: <CreateBountyFlowVisual />,
  },
  {
    label: 'GitHub Native',
    title: 'Everything lives in your GitHub repo',
    description:
      'Bounties become GitHub issues with labels and a bot comment detailing the payout. Developers submit real PRs to your repo — no separate platform to manage.',
    ctaText: 'Explore the GitHub integration',
    ctaHref: 'https://docs.bounty.new/integrations/github',
    visual: <GitHubIntegrationVisual />,
  },
  {
    label: 'Payments',
    title: 'Secure escrow, instant payouts',
    description:
      'Funds are held via Stripe until work is approved and merged. Developers receive their payout immediately — no net-30 invoicing, no chasing payments.',
    ctaText: 'View pricing details',
    ctaHref: '/pricing',
    visual: <PaymentFlowVisual />,
  },
];

export function ContentBlocks() {
  return (
    <section className="border-t border-border-subtle">
      {CONTENT_BLOCKS.map((block, index) => (
        <div
          key={block.label}
          className={index < CONTENT_BLOCKS.length - 1 ? 'border-b border-border-subtle' : ''}
        >
          <ContentBlockRow block={block} reversed={index % 2 !== 0} />
        </div>
      ))}
    </section>
  );
}
