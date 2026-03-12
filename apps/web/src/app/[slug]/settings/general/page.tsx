'use client';

import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { useActiveOrg } from '@/hooks/use-active-org';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  AlertDialogRoot,
  AlertDialogPopup,
  AlertDialogTrigger,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogClose,
  Card,
} from '@bounty/ui';
import { Button } from '@bounty/ui';
import { AlertDialogHeader } from '@bounty/ui/components/alert-dialog';
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from '@bounty/ui/components/alert';
import { Switch } from '@bounty/ui/components/switch';
import {
  Copy,
  AlertTriangle,
  Check,
  CircleDollarSign,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

export default function OrgGeneralSettingsPage() {
  const router = useRouter();
  const { activeOrg, isPersonalTeam, orgs, switchOrg } = useActiveOrg();
  const [slugInput, setSlugInput] = useState('');
  const [isSlugDialogOpen, setIsSlugDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [confirmToggle, setConfirmToggle] = useState(false);
  const [copied, setCopied] = useState(false);

  // Get active org data
  const { data: orgData } = useQuery(
    trpc.organization.getActiveOrg.queryOptions()
  );

  // Get bounty status for deletion (only fetched when dialog opens)
  const { data: bountyStatus, isLoading: isBountyStatusLoading } = useQuery({
    ...trpc.organization.getOrgBountyStatusForDeletion.queryOptions(),
    enabled: isDeleteDialogOpen && !isPersonalTeam,
  });

  // Update slug mutation
  const updateSlugMutation = useMutation(
    trpc.organization.updateSlug.mutationOptions({
      onSuccess: (data) => {
        toast.success('Slug updated successfully');
        setIsSlugDialogOpen(false);
        setSlugInput('');
        router.push(`/${data.slug}/settings/general`);
        router.refresh();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to update slug');
      },
    })
  );

  // Delete org mutation
  const deleteOrgMutation = useMutation(
    trpc.organization.deleteOrg.mutationOptions({
      onSuccess: async () => {
        toast.success('Organization deleted');
        setIsDeleteDialogOpen(false);

        const personalOrg = orgs.find((o) => o.isPersonal);
        if (personalOrg) {
          await switchOrg(personalOrg.id);
        }

        router.push('/dashboard');
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete organization');
      },
    })
  );

  const handleUpdateSlug = () => {
    if (!slugInput.trim()) return;
    updateSlugMutation.mutate({ slug: slugInput.trim().toLowerCase() });
  };

  const handleDeleteOrg = useCallback(() => {
    if (!activeOrg) return;
    const needsToggle = bountyStatus && bountyStatus.totalSubmissions > 0;
    deleteOrgMutation.mutate({
      confirmBountyCancellation: needsToggle ? true : undefined,
    });
  }, [activeOrg, bountyStatus, deleteOrgMutation]);

  const handleCopySlug = () => {
    if (activeOrg?.slug) {
      navigator.clipboard.writeText(activeOrg.slug);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    }
  };

  const handleDeleteDialogOpenChange = useCallback((open: boolean) => {
    setIsDeleteDialogOpen(open);
    if (!open) {
      setConfirmInput('');
      setConfirmToggle(false);
      setCopied(false);
    }
  }, []);

  const handleCopyName = useCallback(async () => {
    if (!activeOrg?.name) return;
    try {
      await navigator.clipboard.writeText(activeOrg.name);
    } catch {
      // Clipboard API may not be available in all contexts
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [activeOrg?.name]);

  if (!orgData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  const isOwner = orgData.role === 'owner';

  // Deletion state
  const isDeletionBlocked =
    bountyStatus &&
    (bountyStatus.fundedBounties > 0 ||
      bountyStatus.approvedSubmissionBounties > 0);
  const needsConfirmToggle =
    bountyStatus && bountyStatus.totalSubmissions > 0 && !isDeletionBlocked;
  const canConfirm =
    !isBountyStatusLoading &&
    confirmInput === (activeOrg?.name || '') &&
    !deleteOrgMutation.isPending &&
    !isDeletionBlocked &&
    (!needsConfirmToggle || confirmToggle);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">General</h1>
        <p className="text-sm text-text-muted mt-1">
          Manage your organization settings and information.
        </p>
      </div>

      {/* Slug Section */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              Organization Slug
            </h2>
            <p className="text-xs text-text-muted mt-0.5">
              Your organization&apos;s unique identifier in URLs
            </p>
          </div>
          {activeOrg?.slug && (
            <button
              type="button"
              onClick={handleCopySlug}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-text-secondary hover:text-foreground rounded-lg hover:bg-surface-hover transition-colors"
            >
              {copiedSlug ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1">
            <input
              type="text"
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              placeholder="new-slug"
              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-brand-primary/50"
              disabled={!isOwner || isPersonalTeam}
            />
            <p className="text-[11px] text-text-muted mt-1.5">
              Current:{' '}
              <span className="font-mono text-text-secondary">
                {activeOrg?.slug}
              </span>
            </p>
          </div>
          <AlertDialogRoot
            open={isSlugDialogOpen}
            onOpenChange={setIsSlugDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                disabled={!(slugInput.trim() && isOwner) || isPersonalTeam}
                onClick={() => setIsSlugDialogOpen(true)}
              >
                Change Slug
              </Button>
            </AlertDialogTrigger>
            <AlertDialogPopup>
              <div className="p-6">
                <AlertDialogTitle>Change Organization Slug</AlertDialogTitle>
                <AlertDialogDescription className="mt-2">
                  Are you sure you want to change your organization slug from{' '}
                  <span className="font-mono font-medium text-foreground">
                    {activeOrg?.slug}
                  </span>{' '}
                  to{' '}
                  <span className="font-mono font-medium text-foreground">
                    {slugInput.trim().toLowerCase()}
                  </span>
                  ? This will update all URLs for your organization.
                </AlertDialogDescription>
              </div>
              <AlertDialogFooter>
                <AlertDialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </AlertDialogClose>
                <Button
                  variant="destructive"
                  onClick={handleUpdateSlug}
                  disabled={updateSlugMutation.isPending}
                >
                  {updateSlugMutation.isPending ? 'Changing...' : 'Change Slug'}
                </Button>
              </AlertDialogFooter>
            </AlertDialogPopup>
          </AlertDialogRoot>
        </div>

        {isPersonalTeam && (
          <p className="text-xs text-text-muted mt-3">
            Personal team slugs cannot be changed.
          </p>
        )}
      </Card>

      {/* Danger Zone - Delete Organization */}
      {!isPersonalTeam && (
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground">
                Delete Organization
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Permanently delete this organization and all its data. This
                action cannot be undone.
              </p>

              {isOwner ? (
                <>
                  <Button
                    variant="destructive"
                    className="mt-4"
                    onClick={() => handleDeleteDialogOpenChange(true)}
                  >
                    Delete Organization
                  </Button>

                  <AlertDialogRoot
                    open={isDeleteDialogOpen}
                    onOpenChange={handleDeleteDialogOpenChange}
                  >
                    <AlertDialogPopup>
                      <div className="p-6 space-y-4">
                        <AlertDialogHeader className="p-0">
                          <AlertDialogTitle>
                            Delete Organization
                          </AlertDialogTitle>
                          <AlertDialogDescription className="mt-2">
                            This will permanently delete{' '}
                            <span className="font-semibold text-foreground">
                              {activeOrg?.name}
                            </span>
                            . All bounties, members, and data will be lost.{' '}
                            <span className="font-semibold text-red-400">
                              This cannot be undone.
                            </span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>

                        {/* Bounty status section */}
                        {isBountyStatusLoading && (
                          <div className="text-xs text-text-muted py-2">
                            Checking active bounties...
                          </div>
                        )}

                        {bountyStatus && bountyStatus.activeBounties > 0 && (
                          <div className="space-y-3">
                            {/* Funded bounties - BLOCKED */}
                            {bountyStatus.fundedBounties > 0 && (
                              <Alert variant="error">
                                <CircleDollarSign className="h-4 w-4" />
                                <AlertTitle>
                                  {bountyStatus.fundedBounties} funded{' '}
                                  {bountyStatus.fundedBounties === 1
                                    ? 'bounty'
                                    : 'bounties'}
                                </AlertTitle>
                                <AlertDescription>
                                  <p>
                                    You must resolve or cancel funded bounties
                                    before deleting this organization.
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {bountyStatus.bounties
                                      .filter((b) => b.isFunded)
                                      .map((b) => (
                                        <Link
                                          key={b.id}
                                          href={`/bounty/${b.id}`}
                                          target="_blank"
                                          className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                                        >
                                          {b.title.length > 30
                                            ? `${b.title.slice(0, 30)}...`
                                            : b.title}
                                          <ExternalLink className="h-3 w-3" />
                                        </Link>
                                      ))}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Approved submissions - BLOCKED */}
                            {bountyStatus.approvedSubmissionBounties > 0 && (
                              <Alert variant="error">
                                <ShieldCheck className="h-4 w-4" />
                                <AlertTitle>
                                  {bountyStatus.approvedSubmissionBounties}{' '}
                                  {bountyStatus.approvedSubmissionBounties === 1
                                    ? 'bounty has'
                                    : 'bounties have'}{' '}
                                  approved submissions
                                </AlertTitle>
                                <AlertDescription>
                                  <p>
                                    Resolve bounties with approved submissions
                                    before deleting.
                                  </p>
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {bountyStatus.bounties
                                      .filter((b) => b.hasApprovedSubmission)
                                      .map((b) => (
                                        <Link
                                          key={b.id}
                                          href={`/bounty/${b.id}`}
                                          target="_blank"
                                          className="inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
                                        >
                                          {b.title.length > 30
                                            ? `${b.title.slice(0, 30)}...`
                                            : b.title}
                                          <ExternalLink className="h-3 w-3" />
                                        </Link>
                                      ))}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Bounties with submissions (deletable but needs confirm) */}
                            {!isDeletionBlocked &&
                              bountyStatus.totalSubmissions > 0 && (
                                <Alert variant="warning">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>
                                    {bountyStatus.activeBounties} active{' '}
                                    {bountyStatus.activeBounties === 1
                                      ? 'bounty'
                                      : 'bounties'}{' '}
                                    with {bountyStatus.totalSubmissions}{' '}
                                    {bountyStatus.totalSubmissions === 1
                                      ? 'submission'
                                      : 'submissions'}
                                  </AlertTitle>
                                  <AlertDescription>
                                    All active bounties will be cancelled.
                                    Contributors will be notified by email and
                                    on GitHub.
                                  </AlertDescription>
                                </Alert>
                              )}

                            {/* Bounties with zero submissions - simple info */}
                            {!isDeletionBlocked &&
                              bountyStatus.totalSubmissions === 0 && (
                                <Alert variant="warning">
                                  <AlertTriangle className="h-4 w-4" />
                                  <AlertTitle>
                                    {bountyStatus.activeBounties} active{' '}
                                    {bountyStatus.activeBounties === 1
                                      ? 'bounty'
                                      : 'bounties'}{' '}
                                    (no submissions)
                                  </AlertTitle>
                                  <AlertDescription>
                                    These bounties will be cancelled when the
                                    organization is deleted.
                                  </AlertDescription>
                                </Alert>
                              )}
                          </div>
                        )}

                        {/* Confirmation toggle for bounties with submissions */}
                        {needsConfirmToggle && (
                          <label className="flex items-center gap-3 rounded-lg border border-border-subtle bg-muted/32 px-3 py-2.5 cursor-pointer select-none">
                            <Switch
                              checked={confirmToggle}
                              onCheckedChange={(checked) =>
                                setConfirmToggle(checked)
                              }
                            />
                            <span className="text-xs text-text-secondary leading-tight">
                              I understand that {bountyStatus!.totalSubmissions}{' '}
                              {bountyStatus!.totalSubmissions === 1
                                ? 'submission'
                                : 'submissions'}{' '}
                              across {bountyStatus!.activeBounties}{' '}
                              {bountyStatus!.activeBounties === 1
                                ? 'bounty'
                                : 'bounties'}{' '}
                              will be cancelled and contributors will be
                              notified
                            </span>
                          </label>
                        )}

                        {/* Type name to confirm */}
                        {!isDeletionBlocked && (
                          <div className="space-y-3">
                            <div className="text-sm text-text-secondary">
                              Type{' '}
                              <button
                                type="button"
                                tabIndex={-1}
                                onClick={handleCopyName}
                                className="inline-flex items-center gap-1.5 font-mono text-foreground bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 rounded-md hover:bg-white/[0.1] transition-colors cursor-pointer"
                              >
                                {activeOrg?.name}
                                {copied ? (
                                  <Check className="h-3 w-3 text-text-muted" />
                                ) : (
                                  <Copy className="h-3 w-3 text-text-muted" />
                                )}
                              </button>{' '}
                              to confirm.
                            </div>
                            <input
                              type="text"
                              value={confirmInput}
                              onChange={(e) => setConfirmInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && canConfirm) {
                                  handleDeleteOrg();
                                }
                              }}
                              placeholder={activeOrg?.name || ''}
                              className="w-full rounded-lg border border-border-subtle bg-background px-3 py-2 text-sm text-foreground placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-red-500/50"
                            />
                          </div>
                        )}
                      </div>

                      <AlertDialogFooter>
                        <AlertDialogClose asChild>
                          <button
                            type="button"
                            disabled={deleteOrgMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-foreground border border-border-subtle rounded-lg transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </AlertDialogClose>
                        {isDeletionBlocked ? (
                          <button
                            type="button"
                            disabled
                            className="px-4 py-2 text-sm font-medium text-white bg-destructive/50 rounded-lg cursor-not-allowed opacity-50"
                          >
                            Deletion Blocked
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handleDeleteOrg}
                            disabled={!canConfirm}
                            className="px-4 py-2 text-sm font-medium text-white bg-destructive hover:bg-destructive/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleteOrgMutation.isPending
                              ? 'Deleting...'
                              : 'Delete Organization'}
                          </button>
                        )}
                      </AlertDialogFooter>
                    </AlertDialogPopup>
                  </AlertDialogRoot>
                </>
              ) : (
                <p className="text-xs text-text-muted mt-3">
                  Only organization owners can delete the organization.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {!(isOwner || isPersonalTeam) && (
        <div className="rounded-xl border border-border-subtle bg-surface-1 p-5">
          <p className="text-sm text-text-muted">
            Only organization owners can change the slug or delete the
            organization.
          </p>
        </div>
      )}
    </div>
  );
}
