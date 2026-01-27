'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { GithubIcon, DiscordIcon, TwitterIcon, SlackIcon } from '@bounty/ui';
import { SettingsGearIcon } from '@bounty/ui/components/icons/huge/settings-gear';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import { useIntegrations } from '@/hooks/use-integrations';

interface IntegrationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: {
    type: 'installed' | 'coming-soon';
    count?: number;
    accounts?: Array<{
      id: number;
      accountLogin?: string | null;
      icon?: string;
      href?: string;
    }>;
    onAccountSelect?: (id: number | string) => void;
  };
  action?: {
    label: string;
    onClick: () => void;
    disabled?: boolean;
  };
  href?: string;
}

function IntegrationCard({
  icon,
  title,
  description,
  status,
  action,
  href,
}: IntegrationCardProps) {
  const router = useRouter();
  const content = (
    <div className="rounded-[15px] opacity-100 shrink-0 flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] grow basis-0 self-stretch bg-[#191919] border border-solid border-[#2E2E2E] antialiased size-full h-full">
      <div className="shrink-0 flex flex-col justify-center items-start gap-[9px] w-full self-stretch h-fit">
        <div className="shrink-0 size-7 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[14px] leading-[150%] shrink-0 text-white font-bold size-fit">
          {title}
        </div>
        <div className="text-[11px] leading-[125%] w-full h-fit shrink-0 self-stretch text-[#B5B5B5] font-medium">
          {description}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-start gap-[9px] w-full self-stretch h-fit">
        {status?.type === 'installed' && status.count !== undefined && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full h-[29px] rounded-[7px] flex justify-center items-center self-stretch shrink-0 gap-1.5 bg-[#303030] p-0"
              >
                <div className="text-[13px] leading-[150%] shrink-0 text-[#CCCCCC66] font-medium size-fit">
                  {status.count} installed
                </div>
                <SettingsGearIcon className="shrink-0 opacity-40 size-4 text-[#CCCCCC66]" />
              </button>
            </DropdownMenuTrigger>
            {status.accounts && status.accounts.length > 0 && (
              <DropdownMenuContent
                side="top"
                align="center"
                sideOffset={8}
                className="bg-[#191919] border border-[#232323] min-w-[200px]"
              >
                {status.accounts.map((account) => {
                  const accountLabel =
                    account.accountLogin || 'Unknown account';
                  const isImageUrl = account.icon?.startsWith('http');
                  return (
                    <DropdownMenuItem
                      key={account.id}
                      className="focus:bg-[#232323] gap-2"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (account.href) {
                          router.push(account.href);
                        } else {
                          status.onAccountSelect?.(account.id);
                        }
                      }}
                    >
                      {isImageUrl ? (
                        <Image
                          src={account.icon ?? ''}
                          alt=""
                          width={16}
                          height={16}
                          className="rounded-full"
                        />
                      ) : (
                        <GithubIcon className="size-4 opacity-60 text-white" />
                      )}
                      {accountLabel}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            )}
          </DropdownMenu>
        )}

        {action && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!action.disabled && status?.type !== 'coming-soon') {
                action.onClick();
              }
            }}
            disabled={action.disabled || status?.type === 'coming-soon'}
            className={`w-full h-[29px] rounded-[7px] flex justify-center items-center shrink-0 self-stretch p-0 font-medium text-[13px] leading-[150%] ${
              status?.type === 'coming-soon' || action.disabled
                ? 'bg-[#232323] text-[#929292] cursor-not-allowed'
                : 'bg-[#929292] text-[#F2F2DD] hover:bg-[#A0A0A0] transition-colors cursor-pointer'
            }`}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );

  if (href && status?.type !== 'coming-soon') {
    return (
      <Link href={href} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

type IntegrationItem =
  | {
      type: 'github';
      installations: Array<{
        id: number;
        accountLogin?: string | null;
        accountType?: string | null;
        repositoryIds?: string[] | null;
      }>;
    }
  | {
      type: 'discord';
      account: {
        discordId: string;
        displayName: string;
        avatar: string | null;
        linkedAt: string | null;
      } | null;
      botInstallUrl?: string;
      onAddBot: () => void;
      onLinkAccount: () => void;
    }
  | { type: 'twitter' }
  | { type: 'slack' };

function renderGithubIntegrationCard(
  installations: Array<{
    id: number;
    accountLogin?: string | null;
    accountType?: string | null;
    repositoryIds?: string[] | null;
  }>,
  filter: 'all' | 'installed',
  installUrl?: { url?: string }
) {
  const primaryInstallation = installations[0];
  const installedCount = installations.length;
  if (filter === 'installed' && installedCount === 0) return null;

  const description =
    installedCount === 0
      ? 'Connect Bounty to your GitHub and access all of our tools from any repository, even your own'
      : installedCount === 1 && primaryInstallation
        ? `${primaryInstallation.accountLogin || 'GitHub'} • ${primaryInstallation.accountType === 'Organization' ? 'Organization' : 'User'} • ${primaryInstallation.repositoryIds?.length || 0} repositories`
        : `${installedCount} accounts connected`;

  return (
    <IntegrationCard
      key="github"
      icon={<GithubIcon className="size-7 text-white" />}
      title="GitHub"
      description={description}
      status={
        installedCount > 0
          ? {
              type: 'installed',
              count: installedCount,
              accounts: installations.map((installation) => ({
                id: installation.id,
                accountLogin: installation.accountLogin,
                href: `/integrations/github/${installation.id}`,
              })),
            }
          : undefined
      }
      action={{
        label: 'Install',
        onClick: () => {
          const fallbackUrl =
            'https://github.com/apps/bountydotnew/installations/new';
          window.location.href = installUrl?.url || fallbackUrl;
        },
      }}
      href={
        primaryInstallation
          ? `/integrations/github/${primaryInstallation.id}`
          : undefined
      }
    />
  );
}

function renderIntegrationCard(
  item: IntegrationItem,
  filter: 'all' | 'installed',
  installUrl?: { url?: string }
) {
  const comingSoonProps = {
    action: {
      label: 'Coming soon',
      onClick: () => {},
      disabled: true,
    },
  };

  switch (item.type) {
    case 'github':
      return renderGithubIntegrationCard(
        item.installations,
        filter,
        installUrl
      );
    case 'discord': {
      const isLinked = !!item.account;
      const displayName =
        item.account?.displayName || item.account?.discordId || 'your account';
      const description = isLinked
        ? `Linked as ${displayName}`
        : 'Link your Discord account or add the Bounty bot to your server';
      return (
        <IntegrationCard
          key="discord"
          icon={<DiscordIcon className="size-7 text-white" />}
          title="Discord"
          description={description}
          status={
            isLinked
              ? {
                  type: 'installed',
                  count: 1,
                  accounts: [
                    {
                      id: 1,
                      accountLogin: displayName,
                      icon: item.account?.avatar ?? undefined,
                      href: '/integrations/discord',
                    },
                  ],
                }
              : undefined
          }
          action={
            isLinked
              ? {
                  label: 'Install',
                  onClick: item.onAddBot,
                  disabled: !item.botInstallUrl,
                }
              : {
                  label: 'Link Account',
                  onClick: item.onLinkAccount,
                }
          }
          href={isLinked ? '/integrations/discord' : undefined}
        />
      );
    }
    case 'twitter':
      return (
        <IntegrationCard
          key="twitter"
          icon={<TwitterIcon className="size-7 text-white" />}
          title="X (Twitter)"
          description="Create bounties from any tweet or thread"
          {...comingSoonProps}
        />
      );
    case 'slack':
      return (
        <IntegrationCard
          key="slack"
          icon={<SlackIcon className="size-7 text-white" />}
          title="Slack"
          description="Create bounties directly from Slack"
          {...comingSoonProps}
        />
      );
    default:
      return null;
  }
}

export function IntegrationsSettings() {
  const [setupAction, setSetupAction] = useQueryState(
    'setup_action',
    parseAsString.withDefault('')
  );
  const [installationId, setInstallationId] = useQueryState(
    'setup_id',
    parseAsString.withDefault('')
  );

  // Use the new integrations hook
  const {
    isLoading,
    githubInstallations,
    githubInstallUrl,
    discordAccount,
    discordBotInstallUrl,
    hasDiscord,
    addDiscordBot,
    linkDiscord,
    invalidateAll,
  } = useIntegrations();

  const [filter, setFilter] = useState<'all' | 'installed'>('all');

  // Track if we've already handled this setup action to prevent infinite loops
  const handledSetupRef = useRef<string>(`${setupAction}-${installationId}`);

  useEffect(() => {
    const key = `${setupAction}-${installationId}`;
    if (setupAction && installationId && key !== handledSetupRef.current) {
      handledSetupRef.current = key;
      invalidateAll();
      setSetupAction(null);
      setInstallationId(null);
    }
  }, [setupAction, installationId, invalidateAll]);

  const installedCount =
    githubInstallations.length +
    (hasDiscord ? 1 : 0);

  const allIntegrations = useMemo(
    () => [
      {
        type: 'github' as const,
        installations: githubInstallations,
      },
      {
        type: 'discord' as const,
        account: discordAccount,
        botInstallUrl: discordBotInstallUrl,
        onAddBot: addDiscordBot,
        onLinkAccount: linkDiscord,
      },
      { type: 'twitter' as const },
      { type: 'slack' as const },
    ],
    [
      githubInstallations,
      discordAccount,
      discordBotInstallUrl,
      addDiscordBot,
      linkDiscord,
    ]
  );

  const filteredIntegrations =
    filter === 'installed'
      ? allIntegrations.filter(
          (item) =>
            (item.type === 'github' && item.installations.length > 0) ||
            (item.type === 'discord' && item.account)
        )
      : allIntegrations;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5A5A5A] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Switcher */}
      {installedCount > 0 && (
        <div className="relative inline-flex rounded-full bg-[#191919] border border-[#232323] p-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-[#232323] text-white'
                : 'text-[#929292] hover:text-white'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('installed')}
            className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === 'installed'
                ? 'bg-[#232323] text-white'
                : 'text-[#929292] hover:text-white'
            }`}
          >
            Installed {installedCount}
          </button>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredIntegrations.map((item) =>
          renderIntegrationCard(item, filter, { url: githubInstallUrl })
        )}
      </div>
    </div>
  );
}
