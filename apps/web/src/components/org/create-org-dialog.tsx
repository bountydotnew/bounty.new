'use client';

import { Dialog, DialogContent } from '@bounty/ui/components/dialog';
import { useState } from 'react';
import { useOrganization } from '@/context/organization-context';

interface CreateOrgDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48);
}

export function CreateOrgDialog({ open, onOpenChange }: CreateOrgDialogProps) {
  const { createOrganization } = useOrganization();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!isSlugManual) {
      setSlug(slugify(value));
    }
  };

  const handleSlugChange = (value: string) => {
    setIsSlugManual(true);
    setSlug(slugify(value));
  };

  const handleCreate = async () => {
    if (!name.trim() || !slug.trim()) return;

    setIsCreating(true);
    try {
      await createOrganization(name.trim(), slug.trim());
      setName('');
      setSlug('');
      setIsSlugManual(false);
      onOpenChange(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-[20px] border border-border-subtle bg-surface-1 p-0">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-foreground">
              Create workspace
            </h2>
            <p className="text-sm text-text-muted">
              Workspaces let you organize bounties and collaborate with others.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="org-name"
                className="text-sm font-medium text-foreground"
              >
                Name
              </label>
              <input
                id="org-name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="My Organization"
                className="rounded-[10px] border border-border-subtle bg-surface-2 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="org-slug"
                className="text-sm font-medium text-foreground"
              >
                URL
              </label>
              <div className="flex items-center rounded-[10px] border border-border-subtle bg-surface-2 text-sm">
                <span className="px-3 py-2 text-text-muted">bounty.new/</span>
                <input
                  id="org-slug"
                  type="text"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  placeholder="my-org"
                  className="flex-1 bg-transparent py-2 pr-3 text-foreground placeholder:text-text-muted focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="rounded-[10px] px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:text-foreground"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-[10px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!name.trim() || !slug.trim() || isCreating}
              onClick={handleCreate}
            >
              {isCreating ? 'Creating...' : 'Create workspace'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
