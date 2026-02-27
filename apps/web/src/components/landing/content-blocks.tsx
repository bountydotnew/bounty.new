import { ArrowRight } from 'lucide-react';

// Inline SVG icon components to avoid pulling in client-side hooks
// from the @bounty/ui barrel export in this Server Component.

function LinearIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      {...props}
    >
      <title>Linear Icon</title>
      <path
        d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z"
        fill="#5E6AD3"
      />
      <path
        d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z"
        fill="#5E6AD3"
      />
      <path
        d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z"
        fill="#5E6AD3"
      />
      <path
        d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z"
        fill="#5E6AD3"
      />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1024 1024"
      fill="none"
      {...props}
    >
      <title>Github icon</title>
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M512 0C229.12 0 0 229.12 0 512c0 226.56 146.56 417.92 350.08 485.76 25.6 4.48 35.2-10.88 35.2-24.32 0-12.16-.64-52.48-.64-95.36-128.64 23.68-161.92-31.36-172.16-60.16-5.76-14.72-30.72-60.16-52.48-72.32-17.92-9.6-43.52-33.28-.64-33.92 40.32-.64 69.12 37.12 78.72 52.48 46.08 77.44 119.68 55.68 149.12 42.24 4.48-33.28 17.92-55.68 32.64-68.48-113.92-12.8-232.96-56.96-232.96-252.8 0-55.68 19.84-101.76 52.48-137.6-5.12-12.8-23.04-65.28 5.12-135.68 0 0 42.88-13.44 140.8 52.48 40.96-11.52 84.48-17.28 128-17.28s87.04 5.76 128 17.28c97.92-66.56 140.8-52.48 140.8-52.48 28.16 70.4 10.24 122.88 5.12 135.68 32.64 35.84 52.48 81.28 52.48 137.6 0 196.48-119.68 240-233.6 252.8 18.56 16 34.56 46.72 34.56 94.72 0 68.48-.64 123.52-.64 140.8 0 13.44 9.6 29.44 35.2 24.32C877.44 929.92 1024 737.92 1024 512 1024 229.12 794.88 0 512 0"
        clipRule="evenodd"
      />
    </svg>
  );
}


interface ContentBlock {
  title: string;
  description: string;
  ctaText: string;
  ctaHref: string;
  visual: React.ReactNode;
}


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
    <div className="relative w-full rounded-xl overflow-hidden border border-border-subtle bg-surface-1">
      <div className="flex min-h-[280px] sm:min-h-[320px]">
        {/* Linear sidebar */}
        <div className="hidden sm:flex w-[180px] flex-col border-r border-border-subtle bg-surface-2 p-3">
          {/* Workspace */}
          <div className="flex items-center gap-2 px-2 py-1.5 mb-3">
            <LinearIcon className="w-4 h-4 shrink-0" />
            <span className="text-[13px] font-medium text-foreground truncate">
              bounty.new
            </span>
          </div>

          {/* Nav items */}
          <div className="space-y-0.5">
            {/* Issues - real Linear icon */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-surface-3 text-foreground text-[12px]">
              <svg
                className="w-3.5 h-3.5"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Linear issues icon</title>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.25 5.25C14.2165 5.25 15 6.0335 15 7V11.75C15 13.5449 13.5449 15 11.75 15H6.75C5.7835 15 5 14.2165 5 13.25C5 12.8358 5.33579 12.5 5.75 12.5C6.16421 12.5 6.5 12.8358 6.5 13.25C6.5 13.3881 6.61193 13.5 6.75 13.5H11.75C12.7165 13.5 13.5 12.7165 13.5 11.75V7C13.5 6.86193 13.3881 6.75 13.25 6.75C12.8358 6.75 12.5 6.41421 12.5 6C12.5 5.58579 12.8358 5.25 13.25 5.25Z"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.1543 1.00391C9.73945 1.08421 11 2.39489 11 4V8L10.9961 8.1543C10.9184 9.68834 9.68834 10.9184 8.1543 10.9961L8 11H4L3.8457 10.9961C2.31166 10.9184 1.08163 9.68834 1.00391 8.1543L1 8V4C1 2.39489 2.26055 1.08421 3.8457 1.00391L4 1H8L8.1543 1.00391ZM4 2.5C3.17157 2.5 2.5 3.17157 2.5 4V8C2.5 8.82843 3.17157 9.5 4 9.5H8C8.82843 9.5 9.5 8.82843 9.5 8V4C9.5 3.17157 8.82843 2.5 8 2.5H4Z"
                />
              </svg>
              Issues
            </div>
            {/* Projects - Linear project icon (hexagon) */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-text-muted text-[12px]">
              <svg
                className="w-3.5 h-3.5"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Linear projects icon</title>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8.54 1.26a1.1 1.1 0 0 0-1.08 0l-5.5 3.14A1.1 1.1 0 0 0 1.4 5.4v5.2a1.1 1.1 0 0 0 .56 1l5.5 3.14a1.1 1.1 0 0 0 1.08 0l5.5-3.14a1.1 1.1 0 0 0 .56-1V5.4a1.1 1.1 0 0 0-.56-1L8.54 1.26ZM8 2.56 12.94 5.4v5.2L8 13.44 3.06 10.6V5.4L8 2.56Z"
                />
              </svg>
              Projects
            </div>
            {/* Views - real Linear views icon */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md text-text-muted text-[12px]">
              <svg
                className="w-3.5 h-3.5"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Linear views icon</title>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.93213 2.21398C7.66484 1.90793 8.49512 1.93032 9.21389 2.28028L14.28 4.74739C15.2242 5.20709 15.2441 6.55895 14.3138 7.04673L9.2874 9.6826C8.48012 10.1058 7.51988 10.1058 6.7126 9.6826L1.68618 7.04673C0.75589 6.55895 0.775786 5.20709 1.71995 4.74739L6.78611 2.28028L6.93213 2.21398ZM8.55132 3.67054C8.24643 3.52213 7.89768 3.50303 7.58179 3.61428L7.44868 3.67054L2.83947 5.91363L7.41491 8.31243C7.7819 8.50486 8.2181 8.50486 8.58509 8.31243L13.1595 5.91363L8.55132 3.67054Z"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.9045 10.0768C14.272 9.90435 14.7242 10.0333 14.9153 10.365C15.1063 10.6966 14.9634 11.1047 14.5959 11.2772L9.49912 13.6693C8.55934 14.1102 7.44077 14.1102 6.50099 13.6693L1.40417 11.2772L1.33776 11.2428C1.01976 11.0547 0.905685 10.676 1.08483 10.365C1.26402 10.054 1.67295 9.92085 2.02626 10.0477L2.0956 10.0768L7.19241 12.468L7.38675 12.5464C7.84801 12.7022 8.36492 12.6757 8.80769 12.468L13.9045 10.0768Z"
                />
              </svg>
              Views
            </div>
          </div>
        </div>

        {/* Issue list */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-border-subtle">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-medium text-foreground">
                Issues
              </span>
              <span className="text-[11px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded">
                {issues.length}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-text-muted px-1.5 py-0.5 rounded border border-border-subtle">
                Filter
              </span>
            </div>
          </div>

          {/* Issue rows */}
          <div className="flex-1">
            {issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-border-subtle hover:bg-surface-hover transition-colors"
              >
                {/* Priority */}
                <div className="shrink-0">
                  {issue.priority === 'urgent' && (
                    <svg
                      className="w-3.5 h-3.5 text-[#F2994A]"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <title>issue</title>
                      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9-3a1 1 0 10-2 0v3a1 1 0 002 0V5zm-.25 6.25a.75.75 0 10-1.5 0 .75.75 0 001.5 0z" />
                    </svg>
                  )}
                  {issue.priority === 'high' && (
                    <svg
                      className="w-3.5 h-3.5 text-[#EB5757]"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <title>issue</title>
                      <path d="M4.47.22A.75.75 0 015 0h6a.75.75 0 01.53.22l4.25 4.25c.141.14.22.331.22.53v6a.75.75 0 01-.22.53l-4.25 4.25A.75.75 0 0111 16H5a.75.75 0 01-.53-.22L.22 11.53A.75.75 0 010 11V5a.75.75 0 01.22-.53L4.47.22zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5H5.31z" />
                    </svg>
                  )}
                  {issue.priority === 'medium' && (
                    <svg
                      className="w-3.5 h-3.5 text-[#F2C94C]"
                      viewBox="0 0 16 16"
                      fill="currentColor"
                    >
                      <title>issue</title>
                      <path d="M3 7.25a.75.75 0 000 1.5h10a.75.75 0 000-1.5H3z" />
                    </svg>
                  )}
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {issue.status === 'done' ? (
                    <svg
                      className="w-3.5 h-3.5 text-[#5E6AD3]"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <title>Done</title>
                      <circle cx="7" cy="7" r="6" fill="#5E6AD3" />
                      <path
                        d="M4.5 7L6.5 9L9.5 5"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : issue.status === 'in-progress' ? (
                    <svg
                      className="w-3.5 h-3.5 text-[#F2C94C]"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <title>In Progress</title>
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        stroke="#F2C94C"
                        strokeWidth="2"
                      />
                      <path d="M7 1a6 6 0 010 12" fill="#F2C94C" />
                    </svg>
                  ) : (
                    <svg
                      className="w-3.5 h-3.5 text-text-muted"
                      viewBox="0 0 14 14"
                      fill="none"
                    >
                      <title>Issue</title>
                      <circle
                        cx="7"
                        cy="7"
                        r="6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                  )}
                </div>

                {/* ID */}
                <span className="text-[11px] text-text-muted shrink-0 hidden sm:inline">
                  {issue.id}
                </span>

                {/* Title */}
                <span className="text-[13px] text-foreground truncate flex-1 min-w-0">
                  {issue.title}
                </span>

                {/* Bounty badge */}
                <span className="shrink-0 text-[11px] font-medium text-text-secondary bg-surface-3 px-2 py-0.5 rounded-full">
                  {issue.bounty}
                </span>

                {/* Assignee */}
                <div className="w-5 h-5 rounded-full bg-surface-3 flex items-center justify-center flex-shrink-0 hidden sm:flex">
                  <span className="text-[8px] font-medium text-text-secondary">
                    {issue.assignee}
                  </span>
                </div>
              </div>
            ))}
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
          <div
            key={step.number}
            className="flex items-baseline gap-4 sm:gap-6 px-5 sm:px-6 py-5 sm:py-6"
          >
            <span className="text-xs font-medium text-text-muted tabular-nums">
              {step.number}
            </span>
            <div>
              <h4 className="text-sm font-medium text-foreground">
                {step.title}
              </h4>
              <p className="text-xs text-text-secondary leading-relaxed mt-1">
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function CreateBountyFlowVisual() {
  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-surface-1 border border-border-subtle">
      <div className="p-4 sm:p-5">
        {/* Form card matching real create bounty form */}
        <div className="flex flex-col gap-3">
          {/* Tag chips row */}
          <div className="flex flex-row flex-wrap items-center gap-1.5">
            <div className="rounded-full flex items-center gap-1.5 bg-surface-2 border border-border-subtle px-2.5 py-1">
              <span className="text-[12px] sm:text-[13px] leading-5 text-foreground truncate">
                Add OAuth integration
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 6 10"
                fill="none"
                className="w-2 h-2 text-text-muted shrink-0"
              >
                <title>Arrows</title>
                <path
                  d="M2.6 9.46667L0.3 6.4C0.176393 6.23519 0.293989 6 0.5 6H5.5C5.70601 6 5.82361 6.23519 5.7 6.4L3.4 9.46667C3.2 9.73333 2.8 9.73333 2.6 9.46667Z"
                  fill="currentColor"
                />
                <path
                  d="M2.6 0.533333L0.3 3.6C0.176393 3.76481 0.293989 4 0.5 4H5.5C5.70601 4 5.82361 3.76481 5.7 3.6L3.4 0.533333C3.2 0.266667 2.8 0.266667 2.6 0.533333Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="rounded-full flex items-center gap-1.5 bg-surface-2 border border-border-subtle px-2.5 py-1">
              <span className="text-[12px] sm:text-[13px] leading-5 text-foreground">
                $500
              </span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 6 10"
                fill="none"
                className="w-2 h-2 text-text-muted shrink-0"
              >
                <title>Arrows</title>
                <path
                  d="M2.6 9.46667L0.3 6.4C0.176393 6.23519 0.293989 6 0.5 6H5.5C5.70601 6 5.82361 6.23519 5.7 6.4L3.4 9.46667C3.2 9.73333 2.8 9.73333 2.6 9.46667Z"
                  fill="currentColor"
                />
                <path
                  d="M2.6 0.533333L0.3 3.6C0.176393 3.76481 0.293989 4 0.5 4H5.5C5.70601 4 5.82361 3.76481 5.7 3.6L3.4 0.533333C3.2 0.266667 2.8 0.266667 2.6 0.533333Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            <div className="rounded-full flex items-center bg-surface-2 border border-border-subtle px-2.5 py-1 pr-6 relative">
              <span className="text-[12px] sm:text-[13px] leading-5 text-foreground">
                Deadline
              </span>
              <svg
                className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <title>Calendar</title>
                <path d="M4.5 1a.75.75 0 01.75.75V3h5.5V1.75a.75.75 0 011.5 0V3H13a1.5 1.5 0 011.5 1.5v9A1.5 1.5 0 0113 15H3a1.5 1.5 0 01-1.5-1.5v-9A1.5 1.5 0 013 3h1.25V1.75A.75.75 0 014.5 1zM3 6.5v7h10v-7H3z" />
              </svg>
            </div>
          </div>

          {/* Textarea */}
          <div className="bg-transparent text-text-secondary text-[12px] sm:text-[13px] leading-relaxed min-h-[80px] sm:min-h-[100px]">
            Need Google &amp; GitHub OAuth integration with proper error
            handling and session management.
          </div>

          {/* Footer: repo selector + create button */}
          <div className="flex flex-row flex-wrap justify-between items-center gap-2 pt-4 border-t border-border-subtle">
            <div className="flex items-center gap-1.5 text-text-tertiary min-w-0">
              <GithubIcon className="w-3.5 h-3.5 text-foreground shrink-0" />
              <span className="text-[12px] sm:text-[13px] font-medium text-foreground truncate">
                bountydotnew/bounty.new
              </span>
              <svg
                className="w-2.5 h-2.5 text-text-muted"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <title>github icon</title>
                <path d="M4.427 7.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 7H4.604a.25.25 0 00-.177.427z" />
              </svg>
            </div>
            <div className="flex items-center justify-center gap-1.5 px-3 sm:px-4 h-[30px] sm:h-[34px] rounded-full text-[12px] sm:text-[13px] font-medium bg-foreground text-background whitespace-nowrap shrink-0">
              Create bounty
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


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
            <span className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-[#238636] text-white">
              Open
            </span>
          </div>
        </div>

        {/* Bot comment — bounty notice */}
        <div className="border border-border-subtle rounded-md overflow-hidden mb-3">
          <div className="px-3 py-2 border-b border-border-subtle flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-surface-2 overflow-hidden flex items-center justify-center shrink-0">
              <span className="text-[8px] text-text-muted">B</span>
            </div>
            <span className="text-[11px] text-foreground font-semibold">
              bountydotnew
            </span>
            <span className="inline-flex items-center bg-surface-2 text-text-muted px-1 py-0.5 rounded text-[9px]">
              bot
            </span>
          </div>
          <div className="px-3 py-2.5">
            <p className="text-[12px] text-text-secondary">
              This issue has a $500.00 USD bounty
              attached.
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


function ContentBlockRow({
  block,
  reversed,
}: {
  block: ContentBlock;
  reversed: boolean;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
      <div className="grid gap-8 sm:gap-10 lg:gap-16 lg:grid-cols-2 lg:items-center min-w-0">
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
            rel={
              block.ctaHref.startsWith('http')
                ? 'noopener noreferrer'
                : undefined
            }
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-text-secondary transition-colors group w-fit"
          >
            {block.ctaText}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        {/* Visual content */}
        <div
          className={`min-w-0 overflow-hidden ${reversed ? 'lg:order-1' : ''}`}
        >
          {block.visual}
        </div>
      </div>
    </div>
  );
}


const CONTENT_BLOCKS: ContentBlock[] = [
  {
    title: 'Create bounties straight from Linear',
    description:
      'Connect your workspace and turn issues into funded bounties without leaving your project management flow. Sync statuses, priorities, and labels. When the fix ships, Linear updates automatically.',
    ctaText: 'Connect Linear',
    ctaHref: 'https://docs.bounty.new/integrations/linear',
    visual: <LinearBountyVisual />,
  },
  {
    title: 'Post. Fix. Ship.',
    description:
      'Describe what\'s broken and set a price. Developers who\'ve seen the pattern before submit PRs. Approve the fix and they get paid instantly. No interviews, no contracts, no waiting.',
    ctaText: 'See how it works',
    ctaHref: 'https://docs.bounty.new/guides/creating-bounties',
    visual: <ProcessStepsVisual />,
  },
  {
    title: 'Describe the bug, set the bounty',
    description:
      'Paste the error, describe what\'s failing, set your budget. We create a GitHub issue, hold funds via Stripe, and surface it to developers who specialize in AI-generated codebases.',
    ctaText: 'Create your first bounty',
    ctaHref: 'https://docs.bounty.new/guides/creating-bounties',
    visual: <CreateBountyFlowVisual />,
  },
  {
    title: 'Fixes ship as PRs to your repo',
    description:
      'Bounties become GitHub issues with labels and payout details. Developers submit real PRs—review diffs, run CI, merge when ready. No platform lock-in.',
    ctaText: 'Explore the GitHub integration',
    ctaHref: 'https://docs.bounty.new/integrations/github',
    visual: <GitHubIntegrationVisual />,
  },
];

export function ContentBlocks() {
  return (
    <section className="border-t border-border-subtle">
      {CONTENT_BLOCKS.map((block, index) => (
        <div
          key={block.title}
          className={
            index < CONTENT_BLOCKS.length - 1
              ? 'border-b border-border-subtle'
              : ''
          }
        >
          <ContentBlockRow block={block} reversed={index % 2 !== 0} />
        </div>
      ))}
    </section>
  );
}
