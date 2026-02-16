import { ArrowRight } from 'lucide-react';

// Inline SVG icon components to avoid pulling in client-side hooks
// from the @bounty/ui barrel export in this Server Component.

function LinearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
      <path d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z" fill="#5E6AD3" />
      <path d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z" fill="#5E6AD3" />
      <path d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z" fill="#5E6AD3" />
      <path d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z" fill="#5E6AD3" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" fill="none" {...props}>
      <path fill="currentColor" fillRule="evenodd" d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28s87.04 5.76 128 17.28c97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0" clipRule="evenodd" />
    </svg>
  );
}

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
            {/* Issues - real Linear icon */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-[#252525] text-white text-[12px]">
              <svg className="w-3.5 h-3.5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M13.25 5.25C14.2165 5.25 15 6.0335 15 7V11.75C15 13.5449 13.5449 15 11.75 15H6.75C5.7835 15 5 14.2165 5 13.25C5 12.8358 5.33579 12.5 5.75 12.5C6.16421 12.5 6.5 12.8358 6.5 13.25C6.5 13.3881 6.61193 13.5 6.75 13.5H11.75C12.7165 13.5 13.5 12.7165 13.5 11.75V7C13.5 6.86193 13.3881 6.75 13.25 6.75C12.8358 6.75 12.5 6.41421 12.5 6C12.5 5.58579 12.8358 5.25 13.25 5.25Z" /><path fillRule="evenodd" clipRule="evenodd" d="M8.1543 1.00391C9.73945 1.08421 11 2.39489 11 4V8L10.9961 8.1543C10.9184 9.68834 9.68834 10.9184 8.1543 10.9961L8 11H4L3.8457 10.9961C2.31166 10.9184 1.08163 9.68834 1.00391 8.1543L1 8V4C1 2.39489 2.26055 1.08421 3.8457 1.00391L4 1H8L8.1543 1.00391ZM4 2.5C3.17157 2.5 2.5 3.17157 2.5 4V8C2.5 8.82843 3.17157 9.5 4 9.5H8C8.82843 9.5 9.5 8.82843 9.5 8V4C9.5 3.17157 8.82843 2.5 8 2.5H4Z" /></svg>
              Issues
            </div>
            {/* Projects - Linear project icon (hexagon) */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[#a0a0a0] text-[12px]">
              <svg className="w-3.5 h-3.5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M8.54 1.26a1.1 1.1 0 0 0-1.08 0l-5.5 3.14A1.1 1.1 0 0 0 1.4 5.4v5.2a1.1 1.1 0 0 0 .56 1l5.5 3.14a1.1 1.1 0 0 0 1.08 0l5.5-3.14a1.1 1.1 0 0 0 .56-1V5.4a1.1 1.1 0 0 0-.56-1L8.54 1.26ZM8 2.56 12.94 5.4v5.2L8 13.44 3.06 10.6V5.4L8 2.56Z" /></svg>
              Projects
            </div>
            {/* Views - real Linear views icon */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[#a0a0a0] text-[12px]">
              <svg className="w-3.5 h-3.5" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M13.25 5.25C14.2165 5.25 15 6.0335 15 7V11.75C15 13.5449 13.5449 15 11.75 15H6.75C5.7835 15 5 14.2165 5 13.25C5 12.8358 5.33579 12.5 5.75 12.5C6.16421 12.5 6.5 12.8358 6.5 13.25C6.5 13.3881 6.61193 13.5 6.75 13.5H11.75C12.7165 13.5 13.5 12.7165 13.5 11.75V7C13.5 6.86193 13.3881 6.75 13.25 6.75C12.8358 6.75 12.5 6.41421 12.5 6C12.5 5.58579 12.8358 5.25 13.25 5.25Z" /><path fillRule="evenodd" clipRule="evenodd" d="M8.1543 1.00391C9.73945 1.08421 11 2.39489 11 4V8L10.9961 8.1543C10.9184 9.68834 9.68834 10.9184 8.1543 10.9961L8 11H4L3.8457 10.9961C2.31166 10.9184 1.08163 9.68834 1.00391 8.1543L1 8V4C1 2.39489 2.26055 1.08421 3.8457 1.00391L4 1H8L8.1543 1.00391ZM4 2.5C3.17157 2.5 2.5 3.17157 2.5 4V8C2.5 8.82843 3.17157 9.5 4 9.5H8C8.82843 9.5 9.5 8.82843 9.5 8V4C9.5 3.17157 8.82843 2.5 8 2.5H4Z" /></svg>
              Views
            </div>
          </div>
        </div>

        {/* Issue list */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-[#2a2a2a]">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-white">Issues</span>
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
    <div className="relative w-full rounded-xl overflow-hidden border border-border-subtle bg-surface-1">
      <div className="divide-y divide-border-subtle">
        {steps.map((step) => (
          <div key={step.number} className="flex items-baseline gap-4 sm:gap-6 px-5 sm:px-6 py-5 sm:py-6">
            <span className="text-xs font-medium text-text-muted tabular-nums">{step.number}</span>
            <div>
              <h4 className="text-sm font-medium text-foreground">{step.title}</h4>
              <p className="text-xs text-text-secondary leading-relaxed mt-1">{step.description}</p>
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
        <div className="flex flex-col gap-3">
          {/* Tag chips row */}
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            <div className="rounded-full flex items-center gap-1.5 bg-surface-2 border border-border-subtle px-2.5 py-1">
              <span className="text-[12px] sm:text-[13px] leading-5 text-white truncate">
                Add OAuth integration
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 6 10" fill="none" className="w-2 h-2 text-text-muted shrink-0"><path d="M2.6 9.46667L0.3 6.4C0.176393 6.23519 0.293989 6 0.5 6H5.5C5.70601 6 5.82361 6.23519 5.7 6.4L3.4 9.46667C3.2 9.73333 2.8 9.73333 2.6 9.46667Z" fill="currentColor" /><path d="M2.6 0.533333L0.3 3.6C0.176393 3.76481 0.293989 4 0.5 4H5.5C5.70601 4 5.82361 3.76481 5.7 3.6L3.4 0.533333C3.2 0.266667 2.8 0.266667 2.6 0.533333Z" fill="currentColor" /></svg>
            </div>
            <div className="rounded-full flex items-center gap-1.5 bg-surface-2 border border-border-subtle px-2.5 py-1">
              <span className="text-[12px] sm:text-[13px] leading-5 text-white">$500</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 6 10" fill="none" className="w-2 h-2 text-text-muted shrink-0"><path d="M2.6 9.46667L0.3 6.4C0.176393 6.23519 0.293989 6 0.5 6H5.5C5.70601 6 5.82361 6.23519 5.7 6.4L3.4 9.46667C3.2 9.73333 2.8 9.73333 2.6 9.46667Z" fill="currentColor" /><path d="M2.6 0.533333L0.3 3.6C0.176393 3.76481 0.293989 4 0.5 4H5.5C5.70601 4 5.82361 3.76481 5.7 3.6L3.4 0.533333C3.2 0.266667 2.8 0.266667 2.6 0.533333Z" fill="currentColor" /></svg>
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
          <div className="flex flex-row justify-between items-center pt-4 border-t border-border-subtle">
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
    <div className="relative w-full rounded-xl overflow-hidden border border-border-subtle bg-surface-1">
      {/* GitHub header bar */}
      <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5 border-b border-border-subtle">
        <GithubIcon className="h-5 w-5 text-foreground" aria-hidden="true" />
        <span className="text-[13px] text-text-secondary">
          <span className="text-foreground">bountydotnew</span>
          <span className="text-text-muted mx-1">/</span>
          <span className="text-foreground">bounty.new</span>
        </span>
      </div>

      {/* Issue content */}
      <div className="px-3 sm:px-5 py-4">
        {/* Issue title */}
        <div className="mb-4">
          <h3 className="text-[15px] sm:text-[17px] font-semibold text-foreground mb-1.5">
            Add OAuth integration for Google + GitHub
            <span className="text-text-muted font-normal ml-1.5">#42</span>
          </h3>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-brand-accent/20 text-brand-accent">
              Open
            </span>
            <span className="text-[11px] text-text-muted">
              <span className="text-text-secondary">grim</span> opened this issue
            </span>
          </div>
        </div>

        {/* Bot comment — bounty notice */}
        <div className="border border-border-subtle rounded-md overflow-hidden mb-3">
          <div className="px-3 py-2 border-b border-border-subtle flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-surface-2 overflow-hidden flex items-center justify-center flex-shrink-0">
              <span className="text-[8px] text-text-muted">B</span>
            </div>
            <span className="text-[11px] text-foreground font-semibold">bountydotnew</span>
            <span className="inline-flex items-center bg-surface-2 text-text-muted px-1 py-0.5 rounded text-[9px]">
              bot
            </span>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[12px] text-text-secondary">
              This issue has a <strong className="text-foreground">$500.00 USD</strong> bounty attached.
            </p>
          </div>
        </div>

        {/* Labels */}
        <div className="flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-brand-accent/15 text-brand-accent">
            bounty: $500
          </span>
          <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-surface-2 text-text-secondary">
            enhancement
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
          <svg className="h-[14px] w-auto" viewBox="54 36 360.02 149.84" xmlns="http://www.w3.org/2000/svg" aria-label="Stripe">
            <path fillRule="evenodd" clipRule="evenodd" fill="#635BFF" d="M414,113.4c0-25.6-12.4-45.8-36.1-45.8c-23.8,0-38.2,20.2-38.2,45.6c0,30.1,17,45.3,41.4,45.3   c11.9,0,20.9-2.7,27.7-6.5v-20c-6.8,3.4-14.6,5.5-24.5,5.5c-9.7,0-18.3-3.4-19.4-15.2h48.9C413.8,121,414,115.8,414,113.4z    M364.6,103.9c0-11.3,6.9-16,13.2-16c6.1,0,12.6,4.7,12.6,16H364.6z" />
            <path fillRule="evenodd" clipRule="evenodd" fill="#635BFF" d="M301.1,67.6c-9.8,0-16.1,4.6-19.6,7.8l-1.3-6.2h-22v116.6l25-5.3l0.1-28.3c3.6,2.6,8.9,6.3,17.7,6.3   c17.9,0,34.2-14.4,34.2-46.1C335.1,83.4,318.6,67.6,301.1,67.6z M295.1,136.5c-5.9,0-9.4-2.1-11.8-4.7l-0.1-37.1   c2.6-2.9,6.2-4.9,11.9-4.9c9.1,0,15.4,10.2,15.4,23.3C310.5,126.5,304.3,136.5,295.1,136.5z" />
            <polygon fillRule="evenodd" clipRule="evenodd" fill="#635BFF" points="223.8,61.7 248.9,56.3 248.9,36 223.8,41.3" />
            <rect x="223.8" y="69.3" fillRule="evenodd" clipRule="evenodd" fill="#635BFF" width="25.1" height="87.5" />
            <path fillRule="evenodd" clipRule="evenodd" fill="#635BFF" d="M196.9,76.7l-1.6-7.4h-21.6v87.5h25V97.5c5.9-7.7,15.9-6.3,19-5.2v-23C214.5,68.1,202.8,65.9,196.9,76.7z" />
            <path fillRule="evenodd" clipRule="evenodd" fill="#635BFF" d="M146.9,47.6l-24.4,5.2l-0.1,80.1c0,14.8,11.1,25.7,25.9,25.7c8.2,0,14.2-1.5,17.5-3.3V135   c-3.2,1.3-19,5.9-19-8.9V90.6h19V69.3h-19L146.9,47.6z" />
            <path fillRule="evenodd" clipRule="evenodd" fill="#635BFF" d="M79.3,94.7c0-3.9,3.2-5.4,8.5-5.4c7.6,0,17.2,2.3,24.8,6.4V72.2c-8.3-3.3-16.5-4.6-24.8-4.6   C67.5,67.6,54,78.2,54,95.9c0,27.6,38,23.2,38,35.1c0,4.6-4,6.1-9.6,6.1c-8.3,0-18.9-3.4-27.3-8v23.8c9.3,4,18.7,5.7,27.3,5.7   c20.8,0,35.1-10.3,35.1-28.2C117.4,100.6,79.3,105.9,79.3,94.7z" />
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
        className="grid gap-8 sm:gap-10 lg:gap-16 lg:grid-cols-2 lg:items-center"
      >
        {/* Text content */}
        <div
          className={`flex flex-col gap-4 sm:gap-5 ${reversed ? 'lg:order-2' : ''}`}
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
        <div className={reversed ? 'lg:order-1' : ''}>
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
    ctaHref: 'https://docs.bounty.new/integrations/linear',
    visual: <LinearBountyVisual />,
  },
  {
    title: 'From issue to payout in three steps',
    description:
      'Post a bounty describing the work you need done. Developers from around the world compete to build the best solution. Approve the PR and they get paid instantly.',
    ctaText: 'Read the getting started guide',
    ctaHref: 'https://docs.bounty.new/guides/creating-bounties',
    visual: <ProcessStepsVisual />,
  },
  {
    title: 'Set the scope and price, we handle the rest',
    description:
      'Define your bounty with a title, description, budget, and target repo. We create a GitHub issue, hold funds securely via Stripe, and notify eligible developers.',
    ctaText: 'See how bounties work',
    ctaHref: 'https://docs.bounty.new/guides/creating-bounties',
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
    ctaHref: 'https://docs.bounty.new/guides/payments',
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
