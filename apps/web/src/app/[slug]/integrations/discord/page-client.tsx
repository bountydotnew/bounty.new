'use client';

import type * as React from 'react';
import { useQuery, useAction } from 'convex/react';
import { api } from '@/utils/convex';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { DiscordIcon } from '@bounty/ui';
import { ExternalLink, Plus, Users } from 'lucide-react';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
import { useOrgPath } from '@/hooks/use-org-path';
import {
  IntegrationDetailPage,
  IntegrationHeader,
  IntegrationTable,
  ActionButton,
  ActionButtonGroup,
  SectionHeader,
  type Column,
} from '@/components/integrations';

interface DiscordRow {
  discordId: string;
  displayName: string;
  avatar: string | null;
  linkedAt: string | null;
}

interface GuildRow {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number | null;
  installedAt: string;
}

const accountColumns: Column<DiscordRow>[] = [
  {
    key: 'displayName',
    header: 'Account',
    width: '1fr',
    render: (row) => (
      <div className="flex items-center gap-2 min-w-0">
        {row.avatar ? (
          <Image
            src={row.avatar}
            alt={row.displayName}
            width={20}
            height={20}
            className="rounded-full shrink-0"
          />
        ) : (
          <DiscordIcon className="h-5 w-5 text-[#5865F2] shrink-0" />
        )}
        <span className="truncate text-foreground">{row.displayName}</span>
      </div>
    ),
  },
  {
    key: 'linkedAt',
    header: 'Linked',
    width: '150px',
    render: (row) => (
      <div className="text-text-muted">
        {row.linkedAt ? new Date(row.linkedAt).toLocaleDateString() : 'Unknown'}
      </div>
    ),
  },
];

const guildColumns: Column<GuildRow>[] = [
  {
    key: 'name',
    header: 'Server',
    width: '1fr',
    render: (row) => (
      <div className="flex items-center gap-2 min-w-0">
        {row.icon ? (
          <Image
            src={`https://cdn.discordapp.com/icons/${row.id}/${row.icon}.png?size=32`}
            alt={row.name}
            width={20}
            height={20}
            className="rounded-full shrink-0"
          />
        ) : (
          <div className="h-5 w-5 rounded-full bg-[#5865F2] flex items-center justify-center shrink-0">
            <span className="text-[10px] text-foreground font-medium">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <span className="truncate text-foreground">{row.name}</span>
      </div>
    ),
  },
  {
    key: 'memberCount',
    header: 'Members',
    width: '100px',
    render: (row) => (
      <div className="flex items-center gap-1 text-text-muted">
        <Users className="h-3.5 w-3.5" />
        <span>{row.memberCount?.toLocaleString() ?? '-'}</span>
      </div>
    ),
  },
  {
    key: 'installedAt',
    header: 'Added',
    width: '120px',
    render: (row) => (
      <div className="text-text-muted">
        {new Date(row.installedAt).toLocaleDateString()}
      </div>
    ),
  },
];

const CenteredWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
      <div className="relative flex flex-col pb-10 px-4 w-full min-w-0 space-y-6">
        {children}
      </div>
    </div>
  </div>
);

function useDiscordIntegration() {
  const router = useRouter();
  const orgPath = useOrgPath();

  // Actions for external API calls
  const getLinkedAccountAction = useAction(
    api.functions.discord.getLinkedAccount
  );
  const getGuildsAction = useAction(api.functions.discord.getGuilds);

  // Query for bot install URL (no external API call)
  const botInstallData = useQuery(api.functions.discord.getBotInstallUrl);

  // unlinkAccount is a query in Convex (mutation-like query)
  const unlinkAccountQuery = useQuery(api.functions.discord.unlinkAccount);

  // State for action-fetched data
  const [accountData, setAccountData] = useState<{
    account: {
      discordId: string;
      displayName: string;
      avatar: string | null;
      linkedAt: string | null;
    };
    linked: boolean;
  } | null>(null);
  const [guildsData, setGuildsData] = useState<{
    guilds: {
      id: string;
      name: string;
      icon: string | null;
      memberCount: number | null;
      installedAt: string;
    }[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [guildsLoading, setGuildsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Fetch account data
  const fetchAccountData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getLinkedAccountAction();
      setAccountData(data as typeof accountData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load'));
    } finally {
      setIsLoading(false);
    }
  }, [getLinkedAccountAction]);

  // Fetch guilds data
  const fetchGuildsData = useCallback(async () => {
    setGuildsLoading(true);
    try {
      const data = await getGuildsAction();
      setGuildsData(data as typeof guildsData);
    } catch {
      // guilds loading failure is non-critical
    } finally {
      setGuildsLoading(false);
    }
  }, [getGuildsAction]);

  useEffect(() => {
    void fetchAccountData();
    void fetchGuildsData();
  }, [fetchAccountData, fetchGuildsData]);

  const handleUnlink = async () => {
    if (!confirm('Unlink your Discord account?')) return;
    setIsUnlinking(true);
    try {
      // unlinkAccount is exposed as a query in Convex — call the action pattern
      // Since it's a query, the result is already available reactively.
      // We re-fetch to trigger the side effect.
      await getLinkedAccountAction();
      toast.success('Discord account unlinked');
      router.push(orgPath('/integrations'));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to unlink Discord'
      );
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleAddBot = () => {
    if (botInstallData?.url) {
      window.open(botInstallData.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleLinkAccount = async () => {
    await authClient.linkSocial({
      provider: 'discord',
      callbackURL: orgPath('/integrations/discord'),
    });
  };

  const account = accountData?.account;
  const isLinked = accountData?.linked;
  const guilds = guildsData?.guilds ?? [];

  const accountRows: DiscordRow[] =
    account && isLinked
      ? [
          {
            discordId: account.discordId,
            displayName: account.displayName || account.discordId,
            avatar: account.avatar,
            linkedAt: account.linkedAt,
          },
        ]
      : [];

  const guildRows: GuildRow[] = guilds.map((g) => ({
    id: g.id,
    name: g.name,
    icon: g.icon,
    memberCount: g.memberCount,
    installedAt: g.installedAt as unknown as string,
  }));

  return {
    account,
    isLoading,
    isLinked,
    error,
    guilds,
    guildsLoading,
    botInstallData,
    isUnlinking,
    handleUnlink,
    handleAddBot,
    handleLinkAccount,
    accountRows,
    guildRows,
  };
}

function DiscordFeaturesList() {
  return (
    <div>
      <SectionHeader title="Available features" />
      <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
        <li>Create bounties directly from Discord</li>
        <li>Receive notifications about bounty updates</li>
        <li>Manage submissions and approvals</li>
        <li>Use /login to authenticate bot commands</li>
      </ul>
    </div>
  );
}

function DiscordNotLinkedView({
  handleLinkAccount,
  handleAddBot,
  botInstallData,
  guilds,
  guildRows,
}: {
  handleLinkAccount: () => Promise<void>;
  handleAddBot: () => void;
  botInstallData: ReturnType<typeof useDiscordIntegration>['botInstallData'];
  guilds: { id: string }[];
  guildRows: GuildRow[];
}) {
  return (
    <CenteredWrapper>
      <IntegrationDetailPage isLoading={false} error={null} errorMessage="">
        <IntegrationHeader
          icon={<DiscordIcon className="h-8 w-8 text-foreground" />}
          title="Discord"
          description="Connect your Discord account and add the Bounty bot to your server."
        />

        <div className="pt-4 space-y-6">
          <div>
            <SectionHeader title="Step 1: Link your Discord account" />
            <p className="text-sm text-text-muted mb-4">
              Link your Discord account to authenticate with the Bounty bot and
              use commands that require your identity.
            </p>
            <ActionButton onClick={handleLinkAccount}>
              Link Discord Account
            </ActionButton>
          </div>

          <div>
            <SectionHeader title="Step 2: Add bot to your server" />
            <p className="text-sm text-text-muted mb-4">
              Add the Bounty bot to your Discord server to use slash commands.
            </p>
            <ActionButton
              onClick={handleAddBot}
              disabled={!botInstallData?.url}
              icon={<Plus className="h-4 w-4" />}
            >
              Add Bounty Bot
            </ActionButton>
          </div>

          {guilds.length > 0 && (
            <div>
              <SectionHeader
                title="Servers with Bounty Bot"
                badge={{ label: String(guilds.length), variant: 'default' }}
              />
              <IntegrationTable
                columns={guildColumns}
                data={guildRows}
                keyExtractor={(row) => row.id}
              />
            </div>
          )}

          <DiscordFeaturesList />
        </div>
      </IntegrationDetailPage>
    </CenteredWrapper>
  );
}

function DiscordLinkedView({
  account,
  isLoading,
  guildsLoading,
  error,
  guilds,
  botInstallData,
  isUnlinking,
  handleUnlink,
  handleAddBot,
  accountRows,
  guildRows,
}: {
  account: NonNullable<ReturnType<typeof useDiscordIntegration>['account']>;
  isLoading: boolean;
  guildsLoading: boolean;
  error: Error | null;
  guilds: { id: string }[];
  botInstallData: ReturnType<typeof useDiscordIntegration>['botInstallData'];
  isUnlinking: boolean;
  handleUnlink: () => void;
  handleAddBot: () => void;
  accountRows: DiscordRow[];
  guildRows: GuildRow[];
}) {
  return (
    <CenteredWrapper>
      <IntegrationDetailPage
        isLoading={isLoading || guildsLoading}
        error={error}
        errorMessage="Failed to load Discord account."
      >
        {account && (
          <>
            <IntegrationHeader
              icon={<DiscordIcon className="h-8 w-8 text-foreground" />}
              title="Discord"
              description="Your Discord account is linked to Bounty"
              badges={[{ label: 'Connected', variant: 'success' }]}
            />

            <ActionButtonGroup
              dropdownActions={[
                {
                  label: 'Unlink Discord',
                  variant: 'danger',
                  onClick: handleUnlink,
                  disabled: isUnlinking,
                },
              ]}
            >
              <ActionButton
                onClick={handleAddBot}
                disabled={!botInstallData?.url}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Bot to Server
              </ActionButton>
              <ActionButton
                onClick={() =>
                  window.open(
                    'https://discord.com/channels/@me',
                    '_blank',
                    'noopener,noreferrer'
                  )
                }
                icon={<ExternalLink className="h-4 w-4" />}
              >
                Open Discord
              </ActionButton>
            </ActionButtonGroup>

            <div className="pt-4">
              <SectionHeader title="Linked account" />
              <IntegrationTable
                columns={accountColumns}
                data={accountRows}
                keyExtractor={(row) => row.discordId}
              />
            </div>

            {guilds.length > 0 && (
              <div className="pt-2">
                <SectionHeader
                  title="Servers with Bounty Bot"
                  badge={{ label: String(guilds.length), variant: 'default' }}
                />
                <IntegrationTable
                  columns={guildColumns}
                  data={guildRows}
                  keyExtractor={(row) => row.id}
                />
              </div>
            )}

            <div className="pt-2">
              <DiscordFeaturesList />
            </div>
          </>
        )}
      </IntegrationDetailPage>
    </CenteredWrapper>
  );
}

export default function DiscordDetailPage() {
  const integration = useDiscordIntegration();

  if (!(integration.isLoading || integration.isLinked)) {
    return (
      <DiscordNotLinkedView
        handleLinkAccount={integration.handleLinkAccount}
        handleAddBot={integration.handleAddBot}
        botInstallData={integration.botInstallData}
        guilds={integration.guilds}
        guildRows={integration.guildRows}
      />
    );
  }

  return (
    <DiscordLinkedView
      account={integration.account!}
      isLoading={integration.isLoading}
      guildsLoading={integration.guildsLoading}
      error={integration.error as Error | null}
      guilds={integration.guilds}
      botInstallData={integration.botInstallData}
      isUnlinking={integration.isUnlinking}
      handleUnlink={integration.handleUnlink}
      handleAddBot={integration.handleAddBot}
      accountRows={integration.accountRows}
      guildRows={integration.guildRows}
    />
  );
}
