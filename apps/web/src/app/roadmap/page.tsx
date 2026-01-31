'use client';

import type React from 'react';
import Link from '@bounty/ui/components/link';
import { useState } from 'react';
import {
  GithubIcon,
  SlackIcon,
  TwitterIcon,
  DiscordIcon,
  LinearIcon,
  QuestionMarkIcon,
  NotionIcon,
  MoneroIcon,
  GmailIcon,
} from '@bounty/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { useSession } from '@/context/session-context';
import { trpc } from '@/utils/trpc';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type Status = 'shipped' | 'in-progress' | 'planned';
type Category = 'platform' | 'features' | 'integrations';

interface RoadmapEntry {
  title: string;
  status: Status;
  description: string;
  date: string; // Parsed from date.new format (e.g., "2024-12-15", "2025-Q1", "2025-Q2")
  category: Category;
}

const roadmapEntries: RoadmapEntry[] = [
  {
    title: 'SDK & API',
    status: 'planned',
    description:
      'Let any project wrap this contribution model around their own workflow. Bounty as infrastructure.',
    date: '2026-Q2',
    category: 'platform',
  },
  {
    title: 'AI Probability Flagging',
    status: 'in-progress',
    description:
      'Flag AI likelihood with transparency—maintaining freedom while giving maintainers the signal they need.',
    date: '2026-Q1',
    category: 'features',
  },
  {
    title: 'Trust Scoring System',
    status: 'in-progress',
    description:
      'Rubric-based evaluation of code quality, best practices, meaningful comments, and proper methods. Not biased against new contributors.',
    date: '2026-Q1',
    category: 'features',
  },
  {
    title: 'GitHub Integration',
    status: 'shipped',
    description:
      'Import issues as bounties, automatic PR tracking, repository linking, and code review workflows.',
    date: '2025-12-15',
    category: 'integrations',
  },
  {
    title: 'User Profiles',
    status: 'shipped',
    description:
      'User profiles with portfolio showcase and public profile pages.',
    date: '2025-11-20',
    category: 'features',
  },
  {
    title: 'Reputation System',
    status: 'planned',
    description:
      'Reputation tracking, skill verification, and contribution history to build trust over time.',
    date: '2026-Q2',
    category: 'features',
  },
  {
    title: 'Payment Integration',
    status: 'shipped',
    description:
      'Secure payment system for bounty funds, automatic payouts, and billing management.',
    date: '2025-10-15',
    category: 'platform',
  },
  {
    title: 'Bounty System',
    status: 'shipped',
    description:
      'Create bounties, browse available tasks, application system, difficulty levels, and submission workflow.',
    date: '2025-09-10',
    category: 'features',
  },
  {
    title: 'Core Platform',
    status: 'shipped',
    description: 'Authentication, database, API layer, and app structure.',
    date: '2025-08-01',
    category: 'platform',
  },
  {
    title: 'Project Foundation',
    status: 'shipped',
    description:
      "Repository created, initial project structure, and the vision for a bounty platform that doesn't suck.",
    date: '2025-06-23',
    category: 'platform',
  },
];

// Format date for display (e.g., "2024-12-15" -> "Dec 15, 2024", "2025-Q1" -> "Q1 2025")
// Currently unused - dates are hidden in the timeline
// function formatDate(date: string): string {
//   if (date.includes('-Q')) {
//     const [year, quarter] = date.split('-');
//     return `${quarter} ${year}`;
//   }
//   const d = new Date(date);
//   return d.toLocaleDateString('en-US', {
//     month: 'short',
//     day: 'numeric',
//     year: 'numeric',
//   });
// }

function getStatusLabel(status: Status): string {
  switch (status) {
    case 'shipped':
      return 'Shipped';
    case 'in-progress':
      return 'In Progress';
    case 'planned':
      return 'Planned';
    default:
      return '';
  }
}

function getStatusBadgeStyle(status: Status): string {
  switch (status) {
    case 'shipped':
      return 'bg-green-500/10 text-green-500';
    case 'in-progress':
      return 'bg-yellow-500/10 text-yellow-500';
    case 'planned':
      return 'bg-surface-3 text-text-muted';
    default:
      return 'bg-surface-3 text-text-muted';
  }
}

function VoteButton({
  isPending,
  isAuthenticated,
  hasVoted,
  hasSelection,
  selectionDiffersFromVote,
  onClick,
  onRemove,
  isRemoving,
}: {
  isPending: boolean;
  isAuthenticated: boolean;
  hasVoted: boolean;
  hasSelection: boolean;
  selectionDiffersFromVote: boolean;
  onClick: () => void;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const canVote =
    (hasSelection && selectionDiffersFromVote) || (hasSelection && !hasVoted);

  const getButtonText = () => {
    if (isPending) {
      return 'Voting...';
    }
    if (!isAuthenticated) {
      return 'Log in to Vote';
    }
    if (hasVoted && !selectionDiffersFromVote) {
      return 'Voted';
    }
    return 'Vote';
  };

  const showTrashButton = hasVoted && isAuthenticated;

  return (
    <div className="flex w-full relative">
      <button
        type="button"
        onClick={onClick}
        disabled={!canVote && hasVoted}
        className={`flex-1 h-[29px] flex justify-center items-center transition-colors ${
          showTrashButton
            ? 'rounded-l-[7px] md:rounded-r-none'
            : 'rounded-[7px]'
        } ${
          canVote
            ? 'bg-surface-hover text-foreground hover:bg-surface-3 cursor-pointer'
            : 'bg-surface-3 text-text-tertiary cursor-not-allowed'
        }`}
      >
        {/* Offset the text on desktop when trash button is shown to keep it visually centered across the full row */}
        <span
          className={`text-[13px] leading-[150%] font-medium ${showTrashButton ? 'md:ml-[14.5px]' : ''}`}
        >
          {getButtonText()}
        </span>
      </button>
      {showTrashButton && (
        <button
          type="button"
          onClick={onRemove}
          disabled={isRemoving}
          className="hidden md:flex h-[29px] w-[29px] rounded-r-[7px] rounded-l-none items-center justify-center bg-surface-3 text-text-tertiary hover:bg-surface-hover hover:text-text-secondary transition-colors cursor-pointer"
          title="Remove vote"
        >
          {isRemoving ? (
            <div className="size-3 border-2 border-[#929292] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="size-3.5"
            >
              <title>Remove vote</title>
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

// VS Code icon component (inline since it's not in @bounty/ui yet)
function VSCodeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <title>VS Code</title>
      <mask
        id="vscode-mask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="100"
        height="100"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7452L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1872 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z"
          fill="white"
        />
      </mask>
      <g mask="url(#vscode-mask)">
        <path
          d="M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 63.5765C-0.515693 65.2318 -0.513607 68.0912 1.30308 69.7437L6.81272 74.7526C8.29793 76.1038 10.5347 76.2033 12.1338 74.9896L93.3609 13.3699C96.086 11.3026 100 13.2462 100 16.6667V16.4275C100 14.0265 98.6246 11.8378 96.4614 10.7962Z"
          fill="#0065A9"
        />
        <g filter="url(#filter0_d)">
          <path
            d="M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 36.4235C-0.515693 34.7682 -0.513607 31.9088 1.30308 30.2563L6.81272 25.2474C8.29793 23.8962 10.5347 23.7967 12.1338 25.0104L93.3609 86.6301C96.086 88.6974 100 86.7538 100 83.3333V83.5765C100 85.9775 98.6246 88.1662 96.4614 89.2038Z"
            fill="#007ACC"
          />
        </g>
        <g filter="url(#filter1_d)">
          <path
            d="M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 98.5895 75 95.3278V4.67213C75 1.41039 71.0564 -0.223106 68.75 2.08329C70.6219 0.211402 73.4721 -0.273666 75.8578 0.873633L96.4587 10.7807C98.6234 11.8217 100 14.0112 100 16.4132V83.5871C100 85.9891 98.6234 88.1786 96.4588 89.2196L75.8578 99.1263Z"
            fill="#1F9CF0"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d"
          x="-8.39411"
          y="15.8291"
          width="116.727"
          height="92.2456"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="4.16667" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="overlay"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
        <filter
          id="filter1_d"
          x="60.4167"
          y="-8.07558"
          width="googletag.cmd.pushasync47.9167"
          height="googletag.cmd.pushasync116.151"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          />
          <feOffset />
          <feGaussianBlur stdDeviation="4.16667" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
          />
          <feBlend
            mode="overlay"
            in2="BackgroundImageFix"
            result="effect1_dropShadow"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow"
            result="shape"
          />
        </filter>
      </defs>
    </svg>
  );
}

const VOTABLE_INTEGRATIONS = [
  {
    key: 'vscode',
    label: 'VS Code',
    description: 'Extension to view/claim bounties while coding',
    icon: VSCodeIcon,
  },
  {
    key: 'notion',
    label: 'Notion',
    description: 'Create bounties from Notion tasks, sync status',
    icon: NotionIcon,
  },
  {
    key: 'crypto',
    label: 'Crypto',
    description: 'Web3 payouts with USDC, ETH, and more',
    icon: MoneroIcon,
  },
  {
    key: 'email',
    label: 'Email',
    description: 'Digest and notifications for bounty updates',
    icon: GmailIcon,
  },
] as const;

function IntegrationVoteCard() {
  const { isAuthenticated } = useSession();
  const queryClient = useQueryClient();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const { data: votes } = useQuery(
    trpc.featureVotes.getIntegrationVotes.queryOptions()
  );
  const { data: userVote } = useQuery({
    ...trpc.featureVotes.getUserVote.queryOptions(),
    enabled: isAuthenticated,
  });

  const voteMutation = useMutation({
    ...trpc.featureVotes.vote.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.featureVotes.getIntegrationVotes.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.featureVotes.getUserVote.queryKey(),
      });
      setSelectedKey(null);
    },
  });

  const removeMutation = useMutation({
    ...trpc.featureVotes.removeVote.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: trpc.featureVotes.getIntegrationVotes.queryKey(),
      });
      queryClient.invalidateQueries({
        queryKey: trpc.featureVotes.getUserVote.queryKey(),
      });
      setSelectedKey(null);
    },
  });

  const handleRemoveVote = () => {
    removeMutation.mutate();
  };

  const handleVote = () => {
    if (!selectedKey) {
      return;
    }
    if (!isAuthenticated) {
      window.location.href = '/login?callback=/roadmap';
      return;
    }
    voteMutation.mutate({
      integrationKey: selectedKey as 'vscode' | 'notion' | 'crypto' | 'email',
    });
  };

  // Get the currently displayed integration (selected or user's vote or default)
  const displayedKey = selectedKey ?? userVote ?? null;
  const displayedIntegration = displayedKey
    ? VOTABLE_INTEGRATIONS.find((i) => i.key === displayedKey)
    : null;
  const DisplayedIcon = displayedIntegration?.icon ?? QuestionMarkIcon;

  const totalVotes = votes?.reduce((sum, v) => sum + v.voteCount, 0) ?? 0;
  const hasVoted = !!userVote;
  const hasSelection = !!selectedKey;
  const selectionDiffersFromVote = selectedKey && selectedKey !== userVote;

  return (
    <div
      id="vote"
      className="rounded-[15px] flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] bg-surface-1 border border-dashed border-border-default scroll-mt-24"
    >
      <div className="flex flex-col justify-center items-start gap-[9px] w-full">
        <div className="size-7 flex items-center justify-center">
          <DisplayedIcon
            className="size-7"
            style={displayedIntegration ? undefined : { color: '#969696' }}
          />
        </div>
        <div className="text-[14px] leading-[150%] text-foreground font-bold">
          {displayedIntegration?.label ?? "What's Next?"}
        </div>
        <div className="text-[11px] leading-[125%] text-text-secondary font-medium">
          {displayedIntegration
            ? displayedIntegration.description
            : 'Vote for the next integration we should build.'}
        </div>
        {hasVoted && !hasSelection && (
          <div className="text-[10px] text-text-muted">
            {totalVotes} total vote{totalVotes !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-[9px] w-full">
        {/* Select Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="w-full h-[29px] rounded-[7px] flex justify-center items-center bg-surface-3 text-text-secondary hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <span className="text-[13px] leading-[150%] font-medium">
                {displayedIntegration ? 'Change Selection' : 'Select Option'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="center"
            sideOffset={8}
            className="bg-surface-1 border border-border-subtle min-w-[200px]"
          >
            {VOTABLE_INTEGRATIONS.map((integration) => {
              const voteData = votes?.find((v) => v.key === integration.key);
              const isCurrentSelection = displayedKey === integration.key;
              const isUserVote = userVote === integration.key;
              const IconComponent = integration.icon;
              return (
                <DropdownMenuItem
                  key={integration.key}
                  className={`focus:bg-surface-3 gap-2 cursor-pointer ${isCurrentSelection ? 'bg-surface-3' : ''}`}
                  onClick={() => setSelectedKey(integration.key)}
                >
                  <IconComponent className="size-4 shrink-0" />
                  <div className="flex-1">
                    <span className="text-foreground">{integration.label}</span>
                    {isUserVote && (
                      <span className="ml-1 text-green-500 text-xs">
                        (your vote)
                      </span>
                    )}
                  </div>
                  <span className="text-text-muted text-xs">
                    {voteData?.voteCount ?? 0}
                  </span>
                </DropdownMenuItem>
              );
            })}
            {/* Mobile-only remove vote option */}
            {hasVoted && isAuthenticated && (
              <DropdownMenuItem
                className="md:hidden focus:bg-surface-3 gap-2 cursor-pointer text-red-400 hover:text-red-300"
                onClick={handleRemoveVote}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-4 shrink-0"
                >
                  <title>Remove vote</title>
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span>Remove vote</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Vote Button */}
        <VoteButton
          isPending={voteMutation.isPending}
          isAuthenticated={isAuthenticated}
          hasVoted={hasVoted}
          hasSelection={hasSelection}
          selectionDiffersFromVote={!!selectionDiffersFromVote}
          onClick={handleVote}
          onRemove={handleRemoveVote}
          isRemoving={removeMutation.isPending}
        />
      </div>
    </div>
  );
}

const sections = [
  { id: 'integrations', label: 'Integrations' },
  { id: 'changelog', label: 'Changelog' },
  { id: 'contribute', label: 'Contribute' },
];

export default function RoadmapPage() {
  const [activeFilter, setActiveFilter] = useState<Category | 'all'>('all');

  const filteredItems = roadmapEntries.filter(
    (item) => activeFilter === 'all' || item.category === activeFilter
  );

  const filters: { label: string; value: Category | 'all' }[] = [
    { label: 'All Changes', value: 'all' },
    { label: 'Platform', value: 'platform' },
    { label: 'Features', value: 'features' },
    { label: 'Integrations', value: 'integrations' },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="px-8 pt-32 pb-12">
          <div className="mx-auto max-w-5xl">
            <h1 className="mb-6 font-display text-5xl tracking-tight text-foreground md:text-6xl">
              Roadmap
            </h1>
            <p className="text-lg text-text-muted">
              Updates to the bounty.new platform and service.
            </p>
          </div>
        </section>

        {/* Main content with sidebar */}
        <section className="border-t border-border-subtle px-8 py-12">
          <div className="mx-auto max-w-5xl">
            <div className="grid grid-cols-1 gap-12 xl:grid-cols-[180px_1fr]">
              {/* Sidebar - sticky outline */}
              <div className="hidden xl:block">
                <nav className="sticky top-32">
                  <ul className="space-y-3">
                    {sections.map((section) => (
                      <li key={section.id}>
                        <a
                          href={`#${section.id}`}
                          className="text-[15px] text-text-muted transition-colors duration-150 hover:text-foreground"
                        >
                          {section.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>

              {/* Main content */}
              <div className="max-w-3xl space-y-16">
                {/* Integrations Section */}
                <section id="integrations" className="scroll-mt-24">
                  <h2 className="mb-4 font-display text-2xl tracking-tight text-foreground">
                    Integrations
                  </h2>
                  <p className="mb-10 text-[15px] text-text-muted">
                    Connect bounty.new with the tools you already use. Vote for
                    the next integration we should build.
                  </p>

                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Vote for Next Integration - Featured first */}
                    <IntegrationVoteCard />

                    {/* GitHub */}
                    <div className="rounded-[15px] flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] bg-surface-1 border border-solid border-border-default">
                      <div className="flex flex-col justify-center items-start gap-[9px] w-full">
                        <div className="size-7 flex items-center justify-center">
                          <GithubIcon className="size-7 text-foreground" />
                        </div>
                        <div className="text-[14px] leading-[150%] text-foreground font-bold">
                          GitHub
                        </div>
                        <div className="text-[11px] leading-[125%] text-text-secondary font-medium">
                          Connect Bounty to your GitHub and access all of our
                          tools from any repository
                        </div>
                      </div>
                      <div className="w-full h-[29px] rounded-[7px] flex justify-center items-center bg-surface-3">
                        <span className="text-[13px] leading-[150%] text-text-secondary/40 font-medium">
                          Live
                        </span>
                      </div>
                    </div>

                    {/* Discord */}
                    <div className="rounded-[15px] flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] bg-surface-1 border border-solid border-border-default">
                      <div className="flex flex-col justify-center items-start gap-[9px] w-full">
                        <div className="size-7 flex items-center justify-center">
                          <DiscordIcon className="size-7 text-foreground" />
                        </div>
                        <div className="text-[14px] leading-[150%] text-foreground font-bold">
                          Discord
                        </div>
                        <div className="text-[11px] leading-[125%] text-text-secondary font-medium">
                          Link your Discord account or add the Bounty bot to
                          your server
                        </div>
                      </div>
                      <div className="w-full h-[29px] rounded-[7px] flex justify-center items-center bg-surface-3">
                        <span className="text-[13px] leading-[150%] text-text-secondary/40 font-medium">
                          Live
                        </span>
                      </div>
                    </div>

                    {/* Slack */}
                    <div className="rounded-[15px] flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] bg-surface-1 border border-solid border-border-default">
                      <div className="flex flex-col justify-center items-start gap-[9px] w-full">
                        <div className="size-7 flex items-center justify-center">
                          <SlackIcon className="size-7 text-foreground" />
                        </div>
                        <div className="text-[14px] leading-[150%] text-foreground font-bold">
                          Slack
                        </div>
                        <div className="text-[11px] leading-[125%] text-text-secondary font-medium">
                          Get notified about bounties in your workspace
                        </div>
                      </div>
                      <div className="w-full h-[29px] rounded-[7px] flex justify-center items-center bg-surface-3">
                        <span className="text-[13px] leading-[150%] text-text-tertiary font-medium">
                          Coming soon
                        </span>
                      </div>
                    </div>

                    {/* X/Twitter */}
                    <div className="rounded-[15px] flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] bg-surface-1 border border-solid border-border-default">
                      <div className="flex flex-col justify-center items-start gap-[9px] w-full">
                        <div className="size-7 flex items-center justify-center">
                          <TwitterIcon className="size-7 text-foreground" />
                        </div>
                        <div className="text-[14px] leading-[150%] text-foreground font-bold">
                          X (Twitter)
                        </div>
                        <div className="text-[11px] leading-[125%] text-text-secondary font-medium">
                          Auto-post bounties and showcase completed work
                        </div>
                      </div>
                      <div className="w-full h-[29px] rounded-[7px] flex justify-center items-center bg-surface-3">
                        <span className="text-[13px] leading-[150%] text-text-tertiary font-medium">
                          Coming soon
                        </span>
                      </div>
                    </div>

                    {/* Linear */}
                    <div className="rounded-[15px] flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] bg-surface-1 border border-solid border-border-default">
                      <div className="flex flex-col justify-center items-start gap-[9px] w-full">
                        <div className="size-7 flex items-center justify-center">
                          <LinearIcon className="size-7" />
                        </div>
                        <div className="text-[14px] leading-[150%] text-foreground font-bold">
                          Linear
                        </div>
                        <div className="text-[11px] leading-[125%] text-text-secondary font-medium">
                          Sync issues and automatically update status
                        </div>
                      </div>
                      <div className="w-full h-[29px] rounded-[7px] flex justify-center items-center bg-surface-3">
                        <span className="text-[13px] leading-[150%] text-text-tertiary font-medium">
                          Coming soon
                        </span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Changelog Section */}
                <section id="changelog" className="scroll-mt-24">
                  <h2 className="mb-4 font-display text-2xl tracking-tight text-foreground">
                    Changelog
                  </h2>
                  <p className="mb-6 text-[15px] text-text-muted">
                    Track our progress and see what we're working on next.
                  </p>

                  {/* Filter Tabs */}
                  <div className="mb-8">
                    <div className="relative inline-flex rounded-full bg-surface-1 border border-border-subtle p-1">
                      {filters.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => setActiveFilter(filter.value)}
                          className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                            activeFilter === filter.value
                              ? 'bg-surface-3 text-foreground'
                              : 'text-text-tertiary hover:text-foreground'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="space-y-0">
                    {filteredItems.map((item) => (
                      <div key={item.title} className="relative">
                        <div className="py-6">
                          <div className="flex-1">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h3 className="text-xl font-semibold text-foreground">
                                {item.title}
                              </h3>
                              <span
                                className={`px-2 py-0.5 text-[11px] font-medium rounded ${getStatusBadgeStyle(item.status)}`}
                              >
                                {getStatusLabel(item.status)}
                              </span>
                            </div>
                            <p className="text-[15px] leading-relaxed text-text-muted">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Contribute Section */}
                <section id="contribute" className="scroll-mt-24">
                  <h2 className="mb-6 font-display text-2xl tracking-tight text-foreground">
                    Want to Help Build This?
                  </h2>
                  <p className="mb-10 text-[15px] leading-relaxed text-text-muted">
                    bounty.new is open source and built by the community. Every
                    contribution, no matter how small, helps us build something
                    that doesn't suck.
                  </p>

                  <div className="flex flex-col items-start gap-4 sm:flex-row">
                    <Link
                      className="inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-colors hover:opacity-90"
                      href="https://github.com/bountydotnew/bounty.new"
                      target="_blank"
                    >
                      <GithubIcon className="h-4 w-4" />
                      View on GitHub
                    </Link>
                    <Link
                      className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-1 px-6 py-3 text-[15px] text-foreground transition-colors hover:bg-surface-2"
                      href="https://github.com/bountydotnew/bounty.new/issues"
                      target="_blank"
                    >
                      Request a Feature
                    </Link>
                  </div>

                  <p className="mt-8 text-[14px] text-text-muted">
                    Every PR gets a response. Every contribution matters.
                  </p>
                </section>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
