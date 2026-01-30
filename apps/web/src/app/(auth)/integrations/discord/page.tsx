'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { DiscordIcon } from '@bounty/ui';
import { ExternalLink, Plus, Users } from 'lucide-react';
import { trpc, trpcClient } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { toast } from 'sonner';
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

export default function DiscordDetailPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: accountData,
    isLoading,
    error,
  } = useQuery(trpc.discord.getLinkedAccount.queryOptions());

  const { data: botInstallData } = useQuery(
    trpc.discord.getBotInstallUrl.queryOptions()
  );

  const { data: guildsData, isLoading: guildsLoading } = useQuery(
    trpc.discord.getGuilds.queryOptions()
  );

  const unlinkMutation = useMutation({
    mutationFn: () => trpcClient.discord.unlinkAccount.mutate(),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [['discord', 'getLinkedAccount']],
      });
      toast.success('Discord account unlinked');
      router.push('/integrations');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to unlink Discord');
    },
  });

  const handleUnlink = () => {
    if (confirm('Unlink your Discord account?')) {
      unlinkMutation.mutate();
    }
  };

  const handleAddBot = () => {
    if (botInstallData?.url) {
      window.open(botInstallData.url, '_blank');
    }
  };

  const handleLinkAccount = async () => {
    // Use Better Auth's linkSocial to link Discord to existing account
    await authClient.linkSocial({
      provider: 'discord',
      callbackURL: '/integrations/discord',
    });
  };

  const account = accountData?.account;
  const isLinked = accountData?.linked;
  const guilds = guildsData?.guilds ?? [];

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
          {row.linkedAt
            ? new Date(row.linkedAt).toLocaleDateString()
            : 'Unknown'}
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

  // If not linked, show setup view
  if (!(isLoading || isLinked)) {
    return (
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

          <div>
            <SectionHeader title="Available features" />
            <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
              <li>Create bounties directly from Discord</li>
              <li>Receive notifications about bounty updates</li>
              <li>Manage submissions and approvals</li>
              <li>Use /login to authenticate bot commands</li>
            </ul>
          </div>
        </div>
      </IntegrationDetailPage>
    );
  }

  return (
    <IntegrationDetailPage
      isLoading={isLoading || guildsLoading}
      error={error as Error | null}
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
                disabled: unlinkMutation.isPending,
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
                window.open('https://discord.com/channels/@me', '_blank')
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
            <SectionHeader title="Available features" />
            <ul className="text-sm text-text-muted list-disc list-inside space-y-1">
              <li>Create bounties directly from Discord</li>
              <li>Receive notifications about bounty updates</li>
              <li>Manage submissions and approvals</li>
              <li>Use /login to authenticate bot commands</li>
            </ul>
          </div>
        </>
      )}
    </IntegrationDetailPage>
  );
}
