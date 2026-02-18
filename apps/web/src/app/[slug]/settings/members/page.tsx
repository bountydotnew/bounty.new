'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { authClient } from '@bounty/auth/client';
import { useActiveOrg } from '@/hooks/use-active-org';
import { toast } from 'sonner';
import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import { cn } from '@bounty/ui/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import {
  MoreHorizontal,
  UserPlus,
  Crown,
  UserMinus,
  Mail,
  X,
  Clock,
} from 'lucide-react';
import { useSession } from '@/context/session-context';

interface MemberRow {
  id: string;
  userId: string;
  role: string;
  createdAt: Date | string;
  user: {
    name: string | null;
    email: string;
    image: string | null;
    handle: string | null;
  };
}

interface InvitationRow {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: Date | string;
  organizationId: string;
}

function useMembersData() {
  const { session } = useSession();
  const { activeOrg, isPersonalTeam } = useActiveOrg();
  const queryClient = useQueryClient();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'owner'>('member');
  const [isInviting, setIsInviting] = useState(false);

  const { data: membersData, isLoading } = useQuery(
    trpc.organization.getMembers.queryOptions()
  );

  const {
    data: invitationsData,
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useQuery({
    queryKey: ['organization', 'invitations', activeOrg?.id],
    queryFn: async () => {
      if (!activeOrg?.id) return [];
      const result = await authClient.organization.listInvitations({
        query: { organizationId: activeOrg.id },
      });
      if (result.error) {
        console.error('Failed to fetch invitations:', result.error);
        return [];
      }
      return (result.data ?? []) as InvitationRow[];
    },
    enabled: !!activeOrg?.id,
    staleTime: 30_000,
  });

  const pendingInvitations = (invitationsData ?? []).filter(
    (inv) => inv.status === 'pending'
  );

  const members = (membersData?.members ?? []) as MemberRow[];
  const currentUserId = session?.user?.id;
  const isOwner =
    members.find((m) => m.userId === currentUserId)?.role === 'owner';

  const invalidateAll = () => {
    queryClient.invalidateQueries({
      queryKey: [['organization', 'getMembers']],
    });
    refetchInvitations();
  };

  const handleInvite = async () => {
    if (!(inviteEmail.trim() && activeOrg)) return;

    setIsInviting(true);
    try {
      const result = await authClient.organization.inviteMember({
        email: inviteEmail.trim(),
        role: inviteRole,
        organizationId: activeOrg.id,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Failed to send invite');
        return;
      }

      toast.success(`Invitation sent to ${inviteEmail.trim()}`);
      setInviteEmail('');
      invalidateAll();
      setIsInviting(false);
    } catch (err) {
      console.error('Failed to invite:', err);
      toast.error('Failed to send invitation');
      setIsInviting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const result = await authClient.organization.cancelInvitation({
        invitationId,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Failed to cancel invitation');
        return;
      }

      toast.success('Invitation cancelled');
      invalidateAll();
    } catch (err) {
      console.error('Failed to cancel invitation:', err);
      toast.error('Failed to cancel invitation');
    }
  };

  const handleRemoveMember = async (memberId: string, memberUserId: string) => {
    if (memberUserId === currentUserId) {
      toast.error("You can't remove yourself");
      return;
    }

    if (!confirm('Remove this member from the team?')) return;

    try {
      await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: activeOrg!.id,
      });
      toast.success('Member removed');
      invalidateAll();
    } catch (err) {
      console.error('Failed to remove member:', err);
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateRole = async (
    memberId: string,
    newRole: 'owner' | 'member'
  ) => {
    try {
      await authClient.organization.updateMemberRole({
        memberId,
        role: newRole,
        organizationId: activeOrg!.id,
      });
      toast.success('Role updated');
      invalidateAll();
    } catch (err) {
      console.error('Failed to update role:', err);
      toast.error('Failed to update role');
    }
  };

  return {
    activeOrg,
    isPersonalTeam,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    isInviting,
    isLoading,
    invitationsLoading,
    pendingInvitations,
    members,
    currentUserId,
    isOwner,
    handleInvite,
    handleCancelInvitation,
    handleRemoveMember,
    handleUpdateRole,
  };
}

function InviteMembersForm({
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  isInviting,
  handleInvite,
}: {
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: 'member' | 'owner';
  setInviteRole: (v: 'member' | 'owner') => void;
  isInviting: boolean;
  handleInvite: () => void;
}) {
  return (
    <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Mail className="h-4 w-4 text-text-tertiary" />
        <h2 className="text-sm font-semibold text-foreground">
          Invite members
        </h2>
      </div>
      <div className="flex gap-2">
        <input
          type="email"
          value={inviteEmail}
          onChange={(e) => setInviteEmail(e.target.value)}
          placeholder="Email address"
          className="flex-1 rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleInvite();
          }}
        />
        <select
          value={inviteRole}
          onChange={(e) => setInviteRole(e.target.value as 'member' | 'owner')}
          className="rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
        >
          <option value="member">Member</option>
          <option value="owner">Owner</option>
        </select>
        <button
          onClick={handleInvite}
          disabled={!inviteEmail.trim() || isInviting}
          className="flex items-center gap-1.5 rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          <UserPlus className="h-3.5 w-3.5" />
          {isInviting ? 'Sending...' : 'Invite'}
        </button>
      </div>
    </div>
  );
}

function PendingInvitationsList({
  pendingInvitations,
  handleCancelInvitation,
}: {
  pendingInvitations: InvitationRow[];
  handleCancelInvitation: (invitationId: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border-subtle overflow-hidden">
      <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle flex items-center gap-2">
        <Clock className="h-3.5 w-3.5 text-text-tertiary" />
        <span className="text-sm font-medium text-text-secondary">
          {pendingInvitations.length} pending{' '}
          {pendingInvitations.length === 1 ? 'invitation' : 'invitations'}
        </span>
      </div>
      <div className="divide-y divide-border-subtle">
        {pendingInvitations.map((inv) => (
          <div
            key={inv.id}
            className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-8 w-8 rounded-full shrink-0">
                <AvatarFacehash name={inv.email} size={32} />
              </Avatar>
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground truncate block">
                  {inv.email}
                </span>
                <span className="text-xs text-text-muted">
                  Invited as {inv.role === 'owner' ? 'owner' : 'member'}
                  {inv.expiresAt && (
                    <>
                      {' '}
                      &middot; expires{' '}
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </>
                  )}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleCancelInvitation(inv.id)}
              className="p-1.5 rounded-md text-text-tertiary hover:text-red-500 hover:bg-surface-hover transition-colors"
              title="Cancel invitation"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function MemberRowItem({
  member,
  currentUserId,
  isOwner,
  isPersonalTeam,
  handleUpdateRole,
  handleRemoveMember,
}: {
  member: MemberRow;
  currentUserId: string | undefined;
  isOwner: boolean | undefined;
  isPersonalTeam: boolean;
  handleUpdateRole: (memberId: string, newRole: 'owner' | 'member') => void;
  handleRemoveMember: (memberId: string, memberUserId: string) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-surface-hover transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <Avatar className="h-8 w-8 rounded-full shrink-0">
          {member.user.image && (
            <AvatarImage alt={member.user.name ?? ''} src={member.user.image} />
          )}
          <AvatarFacehash
            name={member.user.handle ?? member.user.email}
            size={32}
          />
        </Avatar>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground truncate">
              {member.user.name ?? member.user.email}
            </span>
            {member.userId === currentUserId && (
              <span className="text-[11px] text-text-tertiary bg-surface-2 px-1.5 py-0.5 rounded">
                you
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted truncate block">
            {member.user.handle ? `@${member.user.handle}` : member.user.email}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className={cn(
            'text-xs font-medium px-2 py-0.5 rounded',
            member.role === 'owner'
              ? 'bg-amber-500/10 text-amber-500'
              : 'bg-surface-2 text-text-secondary'
          )}
        >
          {member.role === 'owner' ? 'Owner' : 'Member'}
        </span>

        {isOwner && member.userId !== currentUserId && !isPersonalTeam && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="p-1 rounded-md text-text-tertiary hover:text-foreground hover:bg-surface-hover transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-[12px] bg-surface-1 border border-border-subtle"
            >
              <DropdownMenuItem
                onClick={() =>
                  handleUpdateRole(
                    member.id,
                    member.role === 'owner' ? 'member' : 'owner'
                  )
                }
                className="flex items-center gap-2 text-sm"
              >
                <Crown className="h-3.5 w-3.5" />
                {member.role === 'owner'
                  ? 'Demote to member'
                  : 'Promote to owner'}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleRemoveMember(member.id, member.userId)}
                className="flex items-center gap-2 text-sm text-red-500 focus:text-red-500"
              >
                <UserMinus className="h-3.5 w-3.5" />
                Remove from team
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

export default function MembersPage() {
  const {
    activeOrg,
    isPersonalTeam,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    isInviting,
    isLoading,
    pendingInvitations,
    members,
    currentUserId,
    isOwner,
    handleInvite,
    handleCancelInvitation,
    handleRemoveMember,
    handleUpdateRole,
  } = useMembersData();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Members</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage who has access to {activeOrg?.name ?? 'this team'}.
        </p>
      </div>

      {isOwner && !isPersonalTeam && (
        <InviteMembersForm
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          inviteRole={inviteRole}
          setInviteRole={setInviteRole}
          isInviting={isInviting}
          handleInvite={handleInvite}
        />
      )}

      {isPersonalTeam && (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-4">
          <p className="text-sm text-text-muted">
            This is your personal team. To collaborate with others, create a new
            team from the workspace switcher.
          </p>
        </div>
      )}

      {isOwner && !isPersonalTeam && pendingInvitations.length > 0 && (
        <PendingInvitationsList
          pendingInvitations={pendingInvitations}
          handleCancelInvitation={handleCancelInvitation}
        />
      )}

      <div className="rounded-xl border border-border-subtle overflow-hidden">
        <div className="bg-surface-1 px-4 py-3 border-b border-border-subtle">
          <span className="text-sm font-medium text-text-secondary">
            {members.length} {members.length === 1 ? 'member' : 'members'}
          </span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-sm text-text-tertiary">
            Loading members...
          </div>
        ) : (
          <div className="divide-y divide-border-subtle">
            {members.map((m) => (
              <MemberRowItem
                key={m.id}
                member={m}
                currentUserId={currentUserId}
                isOwner={isOwner}
                isPersonalTeam={isPersonalTeam}
                handleUpdateRole={handleUpdateRole}
                handleRemoveMember={handleRemoveMember}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
