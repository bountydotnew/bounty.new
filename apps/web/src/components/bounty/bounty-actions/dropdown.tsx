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

  const handleShare = () => {
    if (onShare) {
      return onShare();
    }
    share();
  };

  // Separate additional actions into non-destructive and destructive
  const nonDestructiveActions =
    additionalActions?.filter(
      (a) =>
        !(a.className?.includes('destructive') || a.className?.includes('red'))
    ) || [];
  const destructiveActions =
    additionalActions?.filter(
      (a) =>
        a.className?.includes('destructive') || a.className?.includes('red')
    ) || [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Open actions"
          className="rounded-lg border border-border-subtle bg-surface-1 p-1.5 text-text-tertiary hover:bg-surface-hover hover:text-foreground"
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          size="icon"
          type="button"
          variant="outline"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="z-10 w-52 rounded-lg border border-border-subtle bg-surface-1 p-1.5 shadow-lg">
        {/* Primary actions group */}
        <div className="flex flex-col gap-0.5">
          {/* Edit action */}
          {canEdit && (
            <DropdownMenuItem
              className="text-foreground hover:bg-surface-hover rounded-md"
              onClick={edit}
            >
              <Edit className="h-3.5 w-3.5" />
              Edit bounty
            </DropdownMenuItem>
          )}

          {/* Share action */}
          <DropdownMenuItem
            className="text-foreground hover:bg-surface-hover rounded-md"
            onClick={handleShare}
          >
            <Share2 className="h-3.5 w-3.5" />
            Share
          </DropdownMenuItem>

          {/* Bookmark action */}
          <DropdownMenuItem
            className="text-foreground hover:bg-surface-hover rounded-md"
            onClick={toggleBookmark}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${bookmarked ? 'fill-foreground' : ''}`}
            />
            {bookmarked ? 'Remove bookmark' : 'Bookmark'}
          </DropdownMenuItem>
        </div>

        {/* GitHub actions group */}
        <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-border-subtle">
          <DropdownMenuItem
            className="text-foreground hover:bg-surface-hover rounded-md"
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

          {repositoryUrl && !issueUrl && (
            <DropdownMenuItem
              className="text-foreground hover:bg-surface-hover rounded-md"
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
          )}

          {issueUrl && (
            <DropdownMenuItem
              className="text-foreground hover:bg-surface-hover rounded-md"
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
          )}
        </div>

        {/* Additional non-destructive actions (like cancellation request) */}
        {nonDestructiveActions.length > 0 && (
          <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-border-subtle">
            {nonDestructiveActions.map((action) => {
              const menuItem = (
                <DropdownMenuItem
                  className={
                    action.className ||
                    'text-foreground hover:bg-surface-hover rounded-md'
                  }
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
                      <TooltipContent
                        side="left"
                        className="max-w-[200px] text-center"
                      >
                        <p>{action.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return menuItem;
            })}
          </div>
        )}

        {/* Destructive actions at the bottom */}
        {(destructiveActions.length > 0 || (canDelete && onDelete)) && (
          <div className="flex flex-col gap-0.5 mt-2 pt-2 border-t border-border-subtle">
            {destructiveActions.map((action) => {
              const menuItem = (
                <DropdownMenuItem
                  className={
                    action.className ||
                    'text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 rounded-md'
                  }
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
                      <TooltipContent
                        side="left"
                        className="max-w-[200px] text-center"
                      >
                        <p>{action.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return menuItem;
            })}
            {canDelete && onDelete && (
              <DropdownMenuItem
                className="text-destructive hover:bg-destructive/10 focus:text-destructive focus:bg-destructive/10 rounded-md"
                onClick={onDelete}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete bounty
              </DropdownMenuItem>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
