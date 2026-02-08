'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { GithubIcon, DiscordIcon, TwitterIcon, SlackIcon } from '@bounty/ui';
import { LinearIcon } from '@bounty/ui/components/icons/huge/linear';
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
import { Button } from '@bounty/ui/components/button';
import { useIntegrations } from '@/hooks/use-integrations';
import { useOrgSlug } from '@/context/org-slug-context';

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
    <div className="rounded-[15px] opacity-100 shrink-0 flex flex-col justify-between items-start px-[18px] py-[18px] gap-[18px] grow basis-0 self-stretch bg-surface-1 border border-solid border-border-default antialiased size-full h-full">
      <div className="shrink-0 flex flex-col justify-center items-start gap-[9px] w-full self-stretch h-fit">
        <div className="shrink-0 size-7 flex items-center justify-center">
          {icon}
        </div>
        <div className="text-[14px] leading-[150%] shrink-0 text-foreground font-bold size-fit">
          {title}
        </div>
        <div className="text-[11px] leading-[125%] w-full h-fit shrink-0 self-stretch text-text-secondary font-medium">
          {description}
        </div>
      </div>
      <div className="shrink-0 flex flex-col items-start gap-[9px] w-full self-stretch h-fit">
        {status?.type === 'installed' && status.count !== undefined && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild nativeButton>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="w-full h-[29px] rounded-[7px] flex justify-center items-center gap-1.5 bg-surface-3 hover:bg-black/5 dark:hover:bg-black/20"
              >
                <span className="text-[13px] leading-[150%] text-text-secondary/40 font-medium">
                  {status.count} installed
                </span>
                <SettingsGearIcon className="shrink-0 opacity-40 size-4 text-text-secondary/40" />
              </Button>
            </DropdownMenuTrigger>
            {status.accounts && status.accounts.length > 0 && (
              <DropdownMenuContent
                side="top"
                align="center"
                sideOffset={8}
                className="bg-surface-1 border border-border-subtle min-w-[200px]"
              >
                {status.accounts.map((account) => {
                  const accountLabel =
                    account.accountLogin || 'Unknown account';
                  const isImageUrl = account.icon?.startsWith('http');
                  // Use LinearIcon for Linear accounts (no icon URL provided)
                  const isLinearAccount = title === 'Linear' && !account.icon;
                  return (
                    <DropdownMenuItem
                      key={account.id}
                      className="focus:bg-surface-3 gap-2"
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
                      ) : isLinearAccount ? (
                        <LinearIcon className="size-4 opacity-60 text-foreground" />
                      ) : (
                        <GithubIcon className="size-4 opacity-60 text-foreground" />
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
          <Button
            variant={
              status?.type === 'coming-soon' || action.disabled
                ? 'ghost'
                : 'secondary'
            }
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!action.disabled && status?.type !== 'coming-soon') {
                action.onClick();
              }
            }}
            disabled={action.disabled || status?.type === 'coming-soon'}
            className={`w-full h-[29px] rounded-[7px] font-medium text-[13px] leading-[150%] ${
              status?.type === 'coming-soon' || action.disabled
                ? 'bg-surface-3 text-text-tertiary'
                : 'bg-foreground text-background hover:bg-black/80 dark:hover:bg-white/80 [:active,[data-pressed]]:bg-background/80'
            }`}
          >
            {action.label}
          </Button>
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
  | {
      type: 'linear';
      workspace: {
        id: string;
        name: string;
        key?: string;
        url?: string;
      } | null;
      onLinkAccount: () => Promise<void>;
    }
  | { type: 'twitter' }
  | { type: 'slack' };

function GitHubIntegrationCard({
  installations,
  filter,
  installUrl,
  pathPrefix = '',
}: {
  installations: Array<{
    id: number;
    accountLogin?: string | null;
    accountType?: string | null;
    repositoryIds?: string[] | null;
  }>;
  filter: 'all' | 'installed';
  installUrl?: { url?: string };
  pathPrefix?: string;
}) {
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
      icon={<GithubIcon className="size-7 text-foreground" />}
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
                href: `${pathPrefix}/integrations/github/${installation.id}`,
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
          ? `${pathPrefix}/integrations/github/${primaryInstallation.id}`
          : undefined
      }
    />
  );
}

function renderIntegrationCard(
  item: IntegrationItem,
  filter: 'all' | 'installed',
  installUrl?: { url?: string },
  pathPrefix = ''
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
      return (
        <GitHubIntegrationCard
          key="github"
          installations={item.installations}
          filter={filter}
          installUrl={installUrl}
          pathPrefix={pathPrefix}
        />
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
          icon={<DiscordIcon className="size-7 text-foreground" />}
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
                      href: `${pathPrefix}/integrations/discord`,
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
          href={isLinked ? `${pathPrefix}/integrations/discord` : undefined}
        />
      );
    }
    case 'twitter':
      return (
        <IntegrationCard
          key="twitter"
          icon={<TwitterIcon className="size-7 text-foreground" />}
          title="X (Twitter)"
          description="Create bounties from any tweet or thread"
          {...comingSoonProps}
        />
      );
    case 'slack':
      return (
        <IntegrationCard
          key="slack"
          icon={<SlackIcon className="size-7 text-foreground" />}
          title="Slack"
          description="Create bounties directly from Slack"
          {...comingSoonProps}
        />
      );
    case 'linear': {
      const isConnected = !!item.workspace;
      const displayName = item.workspace?.name || 'your Linear workspace';
      const workspaceHref = item.workspace
        ? `${pathPrefix}/integrations/linear/${item.workspace.id}`
        : `${pathPrefix}/integrations/linear`;
      const description = isConnected
        ? `Connected to ${displayName}`
        : 'Connect your Linear workspace to create bounties from issues';

      return (
        <IntegrationCard
          key="linear"
          icon={<LinearIcon className="size-7 text-foreground" />}
          title="Linear"
          description={description}
          status={
            isConnected
              ? {
                  type: 'installed',
                  count: 1,
                  accounts: [
                    {
                      id: 1,
                      accountLogin: item.workspace?.name ?? null,
                      icon: undefined,
                      href: workspaceHref,
                    },
                  ],
                }
              : undefined
          }
          action={
            isConnected
              ? {
                  label: 'Manage',
                  onClick: () => {},
                  disabled: false,
                }
              : {
                  label: 'Connect',
                  onClick: item.onLinkAccount,
                  disabled: false,
                }
          }
          href={isConnected ? workspaceHref : undefined}
        />
      );
    }
    default:
      return null;
  }
}

export function IntegrationsSettings() {
  const orgSlug = useOrgSlug();
  if (!orgSlug) {
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('IntegrationsSettings must be rendered inside a [slug] route');
    }
    return null;
  }
  const pathPrefix = `/${orgSlug}`;

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
    linearWorkspace,
    hasLinear,
    hasLinearOAuth,
    linkLinear,
    syncLinearWorkspace,
    invalidateAll,
  } = useIntegrations();

  const [filter, setFilter] = useState<'all' | 'installed'>('all');

  // Track if we've already handled this setup action to prevent infinite loops
  const handledSetupRef = useRef<string>(`${setupAction}-${installationId}`);
  const handledLinearSyncRef = useRef<boolean>(false);

  useEffect(() => {
    const key = `${setupAction}-${installationId}`;
    if (setupAction && installationId && key !== handledSetupRef.current) {
      handledSetupRef.current = key;
      invalidateAll();
      setSetupAction(null);
      setInstallationId(null);
    }
  }, [setupAction, installationId, invalidateAll]);

  // Auto-sync Linear workspace if user has OAuth but no connected workspace
  useEffect(() => {
    if (
      hasLinearOAuth &&
      !hasLinear &&
      !handledLinearSyncRef.current &&
      !isLoading
    ) {
      handledLinearSyncRef.current = true;
      syncLinearWorkspace().then(() => {
        invalidateAll();
      });
    }
  }, [
    hasLinearOAuth,
    hasLinear,
    isLoading,
    syncLinearWorkspace,
    invalidateAll,
  ]);

  const installedCount =
    githubInstallations.length + (hasDiscord ? 1 : 0) + (hasLinear ? 1 : 0);

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
      {
        type: 'linear' as const,
        workspace: linearWorkspace,
        onLinkAccount: linkLinear,
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
      linearWorkspace,
      linkLinear,
    ]
  );

  const filteredIntegrations =
    filter === 'installed'
      ? allIntegrations.filter(
          (item) =>
            (item.type === 'github' && item.installations.length > 0) ||
            (item.type === 'discord' && item.account) ||
            (item.type === 'linear' && item.workspace)
        )
      : allIntegrations;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-default border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Switcher */}
      {installedCount > 0 && (
        <div className="relative inline-flex rounded-full bg-surface-1 border border-border-subtle p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('all')}
            className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === 'all'
                ? 'bg-surface-3 text-foreground'
                : 'text-text-tertiary hover:text-foreground'
            }`}
          >
            All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilter('installed')}
            className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filter === 'installed'
                ? 'bg-surface-3 text-foreground'
                : 'text-text-tertiary hover:text-foreground'
            }`}
          >
            Installed {installedCount}
          </Button>
        </div>
      )}

      {/* Integration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredIntegrations.map((item) =>
          renderIntegrationCard(
            item,
            filter,
            { url: githubInstallUrl },
            pathPrefix
          )
        )}
      </div>
    </div>
  );
}
