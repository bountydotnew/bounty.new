'use client';

import {
  Avatar,
  AvatarFacehash,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@bounty/ui/components/popover';
import { Spinner } from '@bounty/ui/components/spinner';
import { Check, Plus } from 'lucide-react';
import * as React from 'react';
import { useOrganization } from '@/context/organization-context';

interface OrgSwitcherProps {
  trigger: React.ReactNode;
  onCreateOrg?: () => void;
}

export function OrgSwitcher({ trigger, onCreateOrg }: OrgSwitcherProps) {
  const {
    activeOrganization,
    organizations,
    isLoadingOrgs,
    switchOrganization,
  } = useOrganization();
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [isSwitching, setIsSwitching] = React.useState(false);

  const handleSwitch = React.useCallback(
    async (orgId: string) => {
      setIsSwitching(true);
      try {
        await switchOrganization(orgId);
        setPopoverOpen(false);
      } finally {
        setIsSwitching(false);
      }
    },
    [switchOrganization]
  );

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        className="w-64 rounded-lg border border-border-subtle bg-surface-2 p-2 shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
        align="start"
        sideOffset={8}
      >
        {isLoadingOrgs ? (
          <div className="flex items-center gap-2 px-2 py-2">
            <Spinner className="h-4 w-4" size="sm" />
            <span className="text-sm text-text-secondary">
              Loading workspaces...
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="px-2 py-1">
              <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
                Workspaces
              </span>
            </div>

            {(!organizations || organizations.length === 0) ? (
              <div className="px-2 py-3 text-center">
                <span className="text-sm text-text-muted">
                  No workspaces yet
                </span>
              </div>
            ) : (
              organizations.map((org) => {
                const isActive = activeOrganization?.id === org.id;

                return (
                  <button
                    key={org.id}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSwitching || isActive}
                    onClick={() => !isActive && handleSwitch(org.id)}
                    type="button"
                    aria-label={`Switch to ${org.name}`}
                  >
                    <Avatar className="h-7 w-7 shrink-0 rounded-md">
                      {org.logo && (
                        <AvatarImage alt={org.name} src={org.logo} />
                      )}
                      <AvatarFacehash
                        name={org.slug || org.id}
                        size={28}
                      />
                    </Avatar>
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium leading-[150%] text-foreground truncate">
                        {org.name}
                      </span>
                      {org.slug && (
                        <span className="text-xs leading-[150%] text-text-muted truncate">
                          {org.slug}
                        </span>
                      )}
                    </div>
                    {isActive && (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    )}
                  </button>
                );
              })
            )}

            {/* Create new workspace */}
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-surface-3"
              onClick={() => {
                setPopoverOpen(false);
                onCreateOrg?.();
              }}
              type="button"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-border-strong">
                <Plus className="h-3.5 w-3.5 text-text-secondary" />
              </div>
              <span className="text-sm font-medium leading-[150%] text-text-secondary">
                Create workspace
              </span>
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
