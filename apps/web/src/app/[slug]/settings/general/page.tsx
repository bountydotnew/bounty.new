'use client';

import { useState } from 'react';
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
  Input,
} from '@bounty/ui';
import { Button } from '@bounty/ui';
import { ConfirmAlertDialog } from '@bounty/ui/components/alert-dialog';
import { Copy, AlertTriangle, Check } from 'lucide-react';

export default function OrgGeneralSettingsPage() {
  const router = useRouter();
  const { activeOrg, isPersonalTeam, orgs, switchOrg } = useActiveOrg();
  const [slugInput, setSlugInput] = useState('');
  const [isSlugDialogOpen, setIsSlugDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Get active org data
  const { data: orgData } = useQuery(
    trpc.organization.getActiveOrg.queryOptions()
  );

  // Update slug mutation
  const updateSlugMutation = useMutation(
    trpc.organization.updateSlug.mutationOptions({
      onSuccess: (data) => {
        toast.success('Slug updated successfully');
        setIsSlugDialogOpen(false);
        setSlugInput('');
        // Navigate to new slug URL
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

        // Switch session to personal org before navigating, so stale queries
        // don't fire against the deleted org's activeOrganizationId
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

  const handleDeleteOrg = () => {
    if (!activeOrg) return;
    deleteOrgMutation.mutate();
  };

  const handleCopySlug = () => {
    if (activeOrg?.slug) {
      navigator.clipboard.writeText(activeOrg.slug);
      setCopiedSlug(true);
      setTimeout(() => setCopiedSlug(false), 2000);
    }
  };

  if (!orgData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-text-tertiary">Loading...</div>
      </div>
    );
  }

  const isOwner = orgData.role === 'owner';

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
              Your organization's unique identifier in URLs
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
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    Delete Organization
                  </Button>
                  <ConfirmAlertDialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    title="Delete Organization"
                    description={
                      <>
                        This will permanently delete{' '}
                        <span className="font-semibold text-foreground">
                          {activeOrg?.name}
                        </span>
                        . All bounties, members, and data will be lost.{' '}
                        <span className="font-semibold text-red-400">
                          This can not be undone.
                        </span>
                      </>
                    }
                    confirmValue={activeOrg?.name || ''}
                    confirmLabel="Delete Organization"
                    pendingLabel="Deleting..."
                    isPending={deleteOrgMutation.isPending}
                    onConfirm={handleDeleteOrg}
                  />
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
