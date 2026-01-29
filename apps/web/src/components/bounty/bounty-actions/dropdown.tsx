'use client';

import { useContext } from 'react';
import {
  Bookmark,
  Edit,
  MoreHorizontal,
  RefreshCw,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@bounty/ui/components/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@bounty/ui/components/tooltip';
import { Button } from '@bounty/ui/components/button';
import { GithubIcon } from '@bounty/ui';
import { BountyActionsContext } from './context';
import type { ActionItem } from '@/types/bounty-actions';

/**
 * BountyActions Dropdown
 *
 * Compound component that displays the actions dropdown menu.
 * Must be used within BountyActionsProvider.
 *
 * @example
 * ```tsx
 * <BountyActionsProvider {...props}>
 *   <BountyActions.Dropdown />
 * </BountyActionsProvider>
 * ```
 */
export function Dropdown() {
  const context = useContext(BountyActionsContext);
  if (!context) {
    throw new Error('Dropdown must be used within BountyActionsProvider');
  }

  const { state, actions, meta } = context;
  const {
    bookmarked,
    canEdit,
    canDelete,
    isCreateGithubIssuePending,
    isCheckGithubSyncPending,
    isSyncToGithubPending,
    repositoryUrl,
    issueUrl,
  } = state;
  const {
    share,
    toggleBookmark,
    edit,
    createGithubIssue,
    checkGithubSync,
    syncToGithub,
  } = actions;
  const { additionalActions, onDelete, onShare } = meta;

  // Build base actions from permissions - properly typed as ActionItem
  const baseActions: ActionItem[] = [
    ...(canEdit
      ? [
          {
            key: 'edit',
            label: 'Edit',
            onSelect: edit,
            icon: <Edit className="h-3.5 w-3.5" />,
          },
        ]
      : []),
    ...(canDelete && onDelete
      ? [
          {
            key: 'delete',
            label: 'Delete',
            onSelect: onDelete,
            icon: <Trash2 className="h-3.5 w-3.5" />,
          },
        ]
      : []),
  ];

  // Merge with additional actions
  const allActions = [...baseActions, ...(additionalActions || [])];

  const handleShare = () => {
    if (onShare) {
      return onShare();
    }
    share();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open actions"
          className="rounded-md border border-neutral-700 bg-neutral-800/40 p-1 text-neutral-300 hover:bg-neutral-700/40"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          size="icon"
          type="button"
          variant="outline"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-10 w-48 rounded-md border border-neutral-800 bg-neutral-900 p-1 shadow">
        {/* Additional actions (like cancellation options) */}
        {allActions.map((action) => {
          const menuItem = (
            <DropdownMenuItem
              className={action.className || 'text-neutral-200 hover:bg-neutral-800'}
              disabled={action.disabled}
              key={action.key}
              onClick={action.disabled ? undefined : action.onSelect}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          );

          if (action.tooltip && action.disabled) {
            return (
              <TooltipProvider key={action.key}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>{menuItem}</div>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="max-w-[200px] text-center">
                    <p>{action.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          }

          return menuItem;
        })}

        {/* Share action */}
        <DropdownMenuItem
          className="text-neutral-200 hover:bg-neutral-800"
          onClick={handleShare}
        >
          <Share2 className="h-3.5 w-3.5" />
          Share
        </DropdownMenuItem>

        {/* Bookmark action */}
        <DropdownMenuItem
          className="text-neutral-200 hover:bg-neutral-800"
          onClick={toggleBookmark}
        >
          <Bookmark
            className={`h-3.5 w-3.5 ${bookmarked ? 'fill-white' : ''}`}
          />
          {bookmarked ? 'Remove bookmark' : 'Bookmark'}
        </DropdownMenuItem>

        {/* GitHub sync actions */}
        <DropdownMenuItem
          className="text-neutral-200 hover:bg-neutral-800"
          onClick={checkGithubSync}
          disabled={isCheckGithubSyncPending}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${
              isCheckGithubSyncPending ? 'animate-spin' : ''
            }`}
          />
          Check GitHub sync
        </DropdownMenuItem>

        {/* Create issue or sync to GitHub */}
        {repositoryUrl && !issueUrl ? (
          <DropdownMenuItem
            className="text-neutral-200 hover:bg-neutral-800"
            onClick={createGithubIssue}
            disabled={isCreateGithubIssuePending}
          >
            <GithubIcon
              className={`h-3.5 w-3.5 ${
                isCreateGithubIssuePending ? 'animate-pulse' : ''
              }`}
            />
            Create GitHub issue
          </DropdownMenuItem>
        ) : issueUrl ? (
          <DropdownMenuItem
            className="text-neutral-200 hover:bg-neutral-800"
            onClick={syncToGithub}
            disabled={isSyncToGithubPending}
          >
            <GithubIcon
              className={`h-3.5 w-3.5 ${
                isSyncToGithubPending ? 'animate-pulse' : ''
              }`}
            />
            Sync to GitHub
          </DropdownMenuItem>
        ) : null}

        {/* Delete action (if available) */}
        {canDelete && onDelete && (
          <>
            <DropdownMenuSeparator className="bg-neutral-800" />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive focus:bg-destructive/10"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete bounty
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
