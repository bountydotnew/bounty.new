import { ArrowRight } from 'lucide-react';
import { LinearIcon, GithubIcon } from '@bounty/ui';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ContentBlock {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  visual: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual: Linear Integration
// Replicates Linear's actual issue list UI with sidebar + list view
// ─────────────────────────────────────────────────────────────────────────────

function LinearBountyVisual() {
  const issues = [
    {
      id: 'BNT-42',
      title: 'Add OAuth integration for Google + GitHub',
      status: 'in-progress' as const,
      bounty: '$500',
      priority: 'urgent' as const,
      assignee: 'SC',
    },
    {
      id: 'BNT-38',
      title: 'Implement virtual scrolling for bounty list',
      status: 'todo' as const,
      bounty: '$350',
      priority: 'high' as const,
      assignee: 'AR',
    },
    {
      id: 'BNT-35',
      title: 'Fix Stripe webhook retry idempotency',
      status: 'in-progress' as const,
      bounty: '$750',
      priority: 'urgent' as const,
      assignee: 'JK',
    },
    {
      id: 'BNT-31',
      title: 'Ship dark mode for settings pages',
      status: 'done' as const,
      bounty: '$200',
      priority: 'medium' as const,
      assignee: 'MR',
    },
  ];

  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a]">
      <div className="flex min-h-[280px] sm:min-h-[320px]">
        {/* Linear sidebar */}
        <div className="hidden sm:flex w-[180px] flex-col border-r border-[#2a2a2a] bg-[#161616] p-3">
          {/* Workspace */}
          <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
            <LinearIcon className="w-4 h-4 shrink-0" />
            <span className="text-[13px] font-medium text-white truncate">bounty.new</span>
          </div>

          {/* Nav items */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[#a0a0a0] text-[12px]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M2.5 2A1.5 1.5 0 001 3.5v3A1.5 1.5 0 002.5 8h3A1.5 1.5 0 007 6.5v-3A1.5 1.5 0 005.5 2h-3zm0 8A1.5 1.5 0 001 11.5v1A1.5 1.5 0 002.5 14h3A1.5 1.5 0 007 12.5v-1A1.5 1.5 0 005.5 10h-3zm8-8A1.5 1.5 0 009 3.5v1A1.5 1.5 0 0010.5 6h3A1.5 1.5 0 0015 4.5v-1A1.5 1.5 0 0013.5 2h-3zm0 6A1.5 1.5 0 009 9.5v3A1.5 1.5 0 0010.5 14h3A1.5 1.5 0 0015 12.5v-3A1.5 1.5 0 0013.5 8h-3z" /></svg>
              My Issues
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#252525] text-white text-[12px]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" /></svg>
              All Issues
            </div>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[#a0a0a0] text-[12px]">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 1.75V13.5h13.75a.75.75 0 010 1.5H.75a.75.75 0 01-.75-.75V1.75a.75.75 0 011.5 0zm14.28 2.53l-5.25 5.25a.75.75 0 01-1.06 0L7 7.06 4.28 9.78a.75.75 0 01-1.06-1.06l3.5-3.5a.75.75 0 011.06 0L10.25 7.69l4.72-4.72a.75.75 0 111.06 1.06z" /></svg>
              Projects
            </div>
          </div>
        </div>

        {/* Issue list */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-white">All Issues</span>
              <span className="text-[11px] text-[#666] bg-[#252525] px-1.5 py-0.5 rounded">{issues.length}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#666] px-1.5 py-0.5 rounded border border-[#2a2a2a]">Filter</span>
            </div>
          </div>

          {/* Issue rows */}
          <div className="flex-1">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-[#222] hover:bg-[#1f1f1f] transition-colors"
              >
                {/* Priority */}
                <div className="flex-shrink-0">
                  {issue.priority === 'urgent' && (
                    <svg className="w-3.5 h-3.5 text-[#F2994A]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9-3a1 1 0 10-2 0v3a1 1 0 002 0V5zm-.25 6.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" />
                    </svg>
                  )}
                  {issue.priority === 'high' && (
                    <svg className="w-3.5 h-3.5 text-[#EB5757]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31z" />
                    </svg>
                  )}
                  {issue.priority === 'medium' && (
                    <svg className="w-3.5 h-3.5 text-[#F2C94C]" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M3 7.25a.75.75 0 000 1.5h10a.75.75 0 000-1.5H3z" />
                    </svg>
                  )}
                </div>

                {/* Status */}
                <div className="flex-shrink-0">
                  {issue.status === 'done' ? (
                    <svg className="w-3.5 h-3.5 text-[#5E6AD3]" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" fill="#5E6AD3" />
                      <path d="M4.5 7L6.5 9L9.5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : issue.status === 'in-progress' ? (
                    <svg className="w-3.5 h-3.5 text-[#F2C94C]" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#F2C94C" strokeWidth="2" />
                      <path d="M7 1a6 6 0 010 12" fill="#F2C94C" />
                    </svg>
                  ) : (
                    <svg className="w-3.5 h-3.5 text-[#666]" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="7" r="6" stroke="#666" strokeWidth="1.5" />
                    </svg>
                  )}
                </div>

                {/* ID */}
                <span className="text-[11px] text-[#666] flex-shrink-0 hidden sm:inline">
                  {issue.id}
                </span>

                {/* Title */}
                <span className="text-[13px] text-[#eee] truncate flex-1 min-w-0">
                  {issue.title}
                </span>

                {/* Bounty badge */}
                <span className="flex-shrink-0 text-[11px] font-medium text-[#4ade00] bg-[#4ade00]/10 px-2 py-0.5 rounded-full">
                  {issue.bounty}
                </span>

                {/* Assignee */}
                <div className="w-5 h-5 rounded-full bg-[#333] flex items-center justify-center flex-shrink-0 hidden sm:flex">
                  <span className="text-[8px] font-medium text-[#999]">{issue.assignee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual: Process Steps
// ─────────────────────────────────────────────────────────────────────────────

function ProcessStepsVisual() {
  const steps = [
    {
      number: '01',
      title: 'Post a bounty',
      description: 'Describe the work, set a price, and pick a repo.',
    },
    {
      number: '02',
      title: 'Devs compete',
      description: 'Developers submit PRs. Review solutions at your pace.',
    },
    {
      number: '03',
      title: 'Approve & pay',
      description: 'Merge the PR and the developer gets paid instantly.',
    },
  ];

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface-1 border border-border-subtle p-4 sm:p-6 flex flex-col justify-center">
      <div className="space-y-4">
        {steps.map((step, i) => (
          <div
            key={step.number}
            className="flex items-start gap-4 p-4 rounded-xl border border-border-subtle bg-background/50"
          >
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <span className="text-2xl font-display font-medium text-foreground">
                {step.number}
              </span>
              {i < steps.length - 1 && (
                <div className="w-px h-4 bg-border-subtle" />
              )}
            </div>
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

// ─────────────────────────────────────────────────────────────────────────────
// Visual: Bounty Creation Form
// Matches the real bounty creation form from the app (chip selectors, textarea,
// repo selector, create button)
// ─────────────────────────────────────────────────────────────────────────────

function CreateBountyFlowVisual() {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
      <div className="p-4 sm:p-5">
        {/* Form card matching real create bounty form */}
        <div className="bg-surface-1 border border-border-subtle rounded-xl p-3 sm:p-4 flex flex-col gap-3">
          {/* Tag chips row */}
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            <div className="rounded-full flex items-center gap-1.5 bg-surface-2 border border-border-subtle px-2.5 py-1">
              <span className="text-[12px] sm:text-[13px] leading-5 text-white truncate">
                Add OAuth integration
              </span>
              <svg className="w-2 h-2 text-text-muted shrink-0" viewBox="0 0 8 8" fill="currentColor">
                <path d="M4 0L4.9 3.1H8L5.5 5L6.4 8L4 6.2L1.6 8L2.5 5L0 3.1H3.1L4 0Z" />
              </svg>
            </div>
            <div className="rounded-full flex items-center gap-1.5 bg-surface-2 border border-border-subtle px-2.5 py-1">
              <span className="text-[12px] sm:text-[13px] leading-5 text-white">$500</span>
              <svg className="w-2 h-2 text-text-muted shrink-0" viewBox="0 0 8 8" fill="currentColor">
                <path d="M4 0L4.9 3.1H8L5.5 5L6.4 8L4 6.2L1.6 8L2.5 5L0 3.1H3.1L4 0Z" />
              </svg>
            </div>
            <div className="rounded-full flex items-center bg-surface-2 border border-border-subtle px-2.5 py-1 pr-6 relative">
              <span className="text-[12px] sm:text-[13px] leading-5 text-white">Deadline</span>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.5 1a.75.75 0 01.75.75V3h5.5V1.75a.75.75 0 011.5 0V3H13a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0113 15H3a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 013 3h1.25V1.75A.75.75 0 014.5 1zM3 6.5v7h10v-7H3z" />
              </svg>
            </div>
          </div>

          {/* Textarea */}
          <div className="bg-transparent text-text-secondary text-[12px] sm:text-[13px] leading-relaxed min-h-[80px] sm:min-h-[100px]">
            Need Google &amp; GitHub OAuth integration with proper error handling and session management.
          </div>

          {/* Footer: repo selector + create button */}
          <div className="flex flex-row justify-between items-center pt-1 border-t border-border-subtle">
            <div className="flex items-center gap-1.5 text-text-tertiary">
              <GithubIcon className="w-3.5 h-3.5 text-foreground" />
              <span className="text-[12px] sm:text-[13px] font-medium text-white truncate">
                bountydotnew/bounty.new
              </span>
              <svg className="w-2.5 h-2.5 text-text-muted" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-[30px] sm:h-[34px] rounded-full text-[12px] sm:text-[13px] font-medium bg-foreground text-background">
              Create bounty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual: GitHub Integration
// Matches GitHub's actual issue page UI (dark theme)
// ─────────────────────────────────────────────────────────────────────────────

function GitHubIntegrationVisual() {
  return (
    <div className="relative w-full rounded-xl overflow-hidden border border-[#30363d] bg-[#0d1117]">
      {/* GitHub header bar */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-[#30363d] bg-[#161b22]">
        <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        <span className="text-[13px] text-[#c9d1d9]">
          <span className="text-[#58a6ff]">bountydotnew</span>
          <span className="text-[#8b949e] mx-1">/</span>
          <span className="text-[#58a6ff]">bounty.new</span>
        </span>
      </div>

      {/* Issue content */}
      <div className="px-3 sm:px-5 py-4">
        {/* Issue title */}
        <div className="mb-4">
          <h3 className="text-[15px] sm:text-[17px] font-semibold text-[#c9d1d9] mb-1.5">
            Add OAuth integration for Google + GitHub
            <span className="text-[#8b949e] font-normal ml-1.5">#42</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-[#238636] text-white">
              Open
            </span>
            <span className="text-[11px] text-[#8b949e]">
              <span className="text-[#c9d1d9]">grim</span> opened this issue
            </span>
          </div>
        </div>

        {/* Comment thread */}
        <div className="border border-[#30363d] rounded-md overflow-hidden mb-3">
          {/* Original comment */}
          <div className="bg-[#161b22] px-3 py-2 border-b border-[#30363d] flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-[#e66700] flex items-center justify-center text-white text-[9px] font-semibold">
              g
            </div>
            <span className="text-[11px] text-[#c9d1d9] font-semibold">grim</span>
            <span className="text-[11px] text-[#8b949e]">commented</span>
          </div>
          <div className="px-3 py-2.5 text-[12px] text-[#c9d1d9]">
            Need Google &amp; GitHub OAuth integration with proper error handling and session management.
          </div>
        </div>

        {/* Bot comment */}
        <div className="border border-[#30363d] rounded-md overflow-hidden mb-3">
          <div className="bg-[#161b22] px-3 py-2 border-b border-[#30363d] flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-[#333] overflow-hidden flex items-center justify-center">
              <span className="text-[8px] text-[#999]">B</span>
            </div>
            <span className="text-[11px] text-[#58a6ff] font-semibold">bountydotnew</span>
            <span className="inline-flex items-center bg-[#30363d] text-[#8b949e] px-1 py-0.5 rounded text-[9px] border border-[#30363d]">
              bot
            </span>
          </div>
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-[#238636]/20 text-[#3fb950] border border-[#238636]/40">
                Bounty Active
              </span>
            </div>
            <p className="text-[12px] text-[#c9d1d9] mb-2">
              This issue has a <strong>$500.00 USD</strong> bounty attached!
            </p>
            <div className="bg-[#161b22] border border-[#30363d] rounded-md px-2.5 py-2 text-[11px] text-[#8b949e]">
              <p className="text-[#c9d1d9] font-medium text-[10px] mb-1">To claim this bounty:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                <li>Submit a pull request that fixes this issue</li>
                <li>Wait for the maintainer to approve your solution</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#238636] text-white">
            bounty: $500
          </span>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#1f6feb] text-white">
            enhancement
          </span>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-[#1f6feb] text-white">
            auth
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Visual: Payments
// ─────────────────────────────────────────────────────────────────────────────

function PaymentFlowVisual() {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
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
            Funds held securely on our platform account
          </span>
        </div>

        {/* Stripe branding with real Stripe wordmark */}
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <span className="text-[10px] text-text-muted">Powered by</span>
          <svg className="h-[14px] w-auto" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a10.6 10.6 0 01-4.56.95c-4.01 0-6.83-2.5-6.83-7.14 0-4.08 2.38-7.15 6.17-7.15 3.79 0 6.04 3.07 6.04 7.15 0 .42-.01 1.09-.01 1.27zm-5.92-5.62c-1.21 0-2.19 1.14-2.26 2.93h4.39c0-1.8-.83-2.93-2.13-2.93zM40.95 20.2c-1.55 0-2.66-.54-3.37-1.16l-.05 5.08-4.13.88V6.22h3.56l.18 1.08a4.63 4.63 0 013.4-1.38c3 0 5.14 2.7 5.14 7.14 0 5.04-2.22 7.14-4.73 7.14zm-.8-10.76c-.94 0-1.67.43-2.12 1.08l.02 5.54c.44.63 1.16 1.04 2.1 1.04 1.62 0 2.73-1.79 2.73-3.86 0-2.04-1.13-3.8-2.73-3.8zM28.24 5.57c-1.37 0-2.47-1.12-2.47-2.47 0-1.38 1.1-2.48 2.47-2.48a2.47 2.47 0 010 4.95zm-2.06 14.43V6.22h4.13V20h-4.13zM19.45 6.22l.26 1.37c.73-1.05 1.86-1.67 3.3-1.67.46 0 .96.06 1.34.17l-.64 3.87a5.64 5.64 0 00-1.18-.12c-1.09 0-2.16.47-2.65 1.58l.02 8.58h-4.13V6.22h3.68zM6.24 16.95c1.1 0 2.28-.36 3.3-.95v3.5a10.03 10.03 0 01-3.82.7C2.3 20.2 0 18 0 14.74c0-5.35 5.23-6.2 6.03-6.22l.17-.01V5.01c0-.7-.27-1.4-1.81-1.4-1.23 0-2.85.46-4 1.07V1.16A11.4 11.4 0 014.65 0C7.8 0 10.3 1.64 10.3 5.3v5.8c0 .89.37 1.12.82 1.12.15 0 .3-.02.43-.06v3.3a3.85 3.85 0 01-1.69.37c-1.62 0-2.76-.65-3.23-1.77-1 .57-2.06.89-3.14.89-.01 0 2.75 0 2.75-3v.01c0-1.88-1.2-2.73-2.69-2.73V5.56c0 .15 0 .29.02.42.08.52.5 1.37 2.67 1.37zM14.11 20V6.22h4.13V20h-4.13z" fill="#635BFF" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Content Block Row
// ─────────────────────────────────────────────────────────────────────────────

function ContentBlockRow({
  block,
  reversed,
}: {
  block: ContentBlock;
  reversed: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
      <div
        className={`grid gap-8 sm:gap-10 lg:gap-16 lg:grid-cols-2 lg:items-center ${
          reversed ? 'lg:[direction:rtl]' : ''
        }`}
      >
        {/* Text content */}
        <div
          className={`flex flex-col gap-4 sm:gap-5 ${reversed ? 'lg:[direction:ltr]' : ''}`}
        >
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight text-foreground">
            {block.title}
          </h2>
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-lg">
            {block.description}
          </p>
          <a
            href={block.ctaHref}
            target={block.ctaHref.startsWith('http') ? '_blank' : undefined}
            rel={block.ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-text-secondary transition-colors group w-fit"
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
// Main Export
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT_BLOCKS: ContentBlock[] = [
  {
    title: 'Create bounties straight from Linear',
    description:
      'Connect your Linear workspace and turn issues into funded bounties without leaving your project management flow. Sync statuses, priorities, and labels automatically.',
    ctaText: 'Learn about integrations',
    ctaHref: 'https://docs.bounty.new/integrations',
    visual: <LinearBountyVisual />,
  },
  {
    title: 'From issue to payout in three steps',
    description:
      'Post a bounty describing the work you need done. Developers from around the world compete to build the best solution. Approve the PR and they get paid instantly.',
    ctaText: 'Read the getting started guide',
    ctaHref: 'https://docs.bounty.new/getting-started',
    visual: <ProcessStepsVisual />,
  },
  {
    title: 'Set the scope and price, we handle the rest',
    description:
      'Define your bounty with a title, description, budget, and target repo. We create a GitHub issue, hold funds securely via Stripe, and notify eligible developers.',
    ctaText: 'See how bounties work',
    ctaHref: 'https://docs.bounty.new/bounties',
    visual: <CreateBountyFlowVisual />,
  },
  {
    title: 'Everything lives in your GitHub repo',
    description:
      'Bounties become GitHub issues with labels and a bot comment detailing the payout. Developers submit real PRs to your repo — no separate platform to manage.',
    ctaText: 'Explore the GitHub integration',
    ctaHref: 'https://docs.bounty.new/integrations/github',
    visual: <GitHubIntegrationVisual />,
  },
  {
    title: 'Secure payments, instant payouts',
    description:
      'Funds are held on our platform account via Stripe until work is approved and merged. Developers receive their payout immediately — no net-30 invoicing, no chasing payments.',
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
          key={block.title}
          className={index < CONTENT_BLOCKS.length - 1 ? 'border-b border-border-subtle' : ''}
        >
          <ContentBlockRow block={block} reversed={index % 2 !== 0} />
        </div>
      ))}
    </section>
  );
}
