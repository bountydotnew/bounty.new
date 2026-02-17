import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { GithubIcon, Spinner } from '@bounty/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from '@bounty/ui/components/dropdown-menu';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

interface Issue {
  number: number;
  title: string;
}

interface IssueSelectorProps {
  selectedIssue: { number: number; title: string; url: string } | null;
  filteredIssues: Issue[];
  issuesList: { isLoading: boolean; isFetching: boolean; data?: Issue[] };
  issueQuery: string;
  setIssueQuery: (query: string) => void;
  onSelect: (issue: Issue) => void;
}

export function IssueSelector({
  selectedIssue,
  filteredIssues,
  issuesList,
  issueQuery,
  setIssueQuery,
  onSelect,
}: IssueSelectorProps) {
  const [showIssueDropdown, setShowIssueDropdown] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Derive content key for animated transitions
  const isLoading = issuesList.isLoading || issuesList.isFetching;
  const contentKey = isLoading
    ? 'loading'
    : filteredIssues.length > 0
      ? 'results'
      : issueQuery.length > 0
        ? 'no-results'
        : 'empty';

  return (
    <DropdownMenu open={showIssueDropdown} onOpenChange={setShowIssueDropdown}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex flex-row items-center gap-1.5 text-text-tertiary hover:text-text-muted transition-colors"
        >
          <GithubIcon className="w-3.5 h-3.5" />
          <span className="text-[14px] text-text-muted">
            {selectedIssue ? `#${selectedIssue.number}` : 'Issue'}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showIssueDropdown ? 'rotate-180' : ''}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-60 p-0 border-border-subtle bg-surface-1 text-text-secondary rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
        align="start"
        side="bottom"
      >
        <div className="p-1">
          <div className="flex items-center border-b border-border-subtle px-2 font-medium">
            <input
              className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-text-tertiary text-text-secondary"
              placeholder="Search issues"
              value={issueQuery}
              onChange={(e) => setIssueQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <DropdownMenuSeparator className="h-px bg-surface-3 my-1 -mx-1" />
          <div className="max-h-[240px] overflow-hidden relative">
            <AnimatePresence initial={false}>
              <motion.div
                key={contentKey}
                initial={
                  prefersReducedMotion
                    ? false
                    : { transform: 'translateY(8px)' }
                }
                animate={{ transform: 'translateY(0px)' }}
                transition={{ duration: 0.1, ease: [0.23, 1, 0.32, 1] }}
                className="overflow-y-auto px-1 pb-1 max-h-[240px]"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Spinner size="sm" className="w-4 h-4" />
                  </div>
                ) : filteredIssues.length > 0 ? (
                  filteredIssues.map((issue: Issue) => (
                    <DropdownMenuItem
                      key={issue.number}
                      className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-text-secondary data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-surface-2 text-sm font-medium hover:bg-surface-2 focus:bg-surface-2 bg-transparent"
                      onClick={() => {
                        onSelect(issue);
                        setShowIssueDropdown(false);
                      }}
                      data-selected={selectedIssue?.number === issue.number}
                    >
                      <GithubIcon className="size-4 text-text-tertiary" />
                      <span className="text-text-secondary truncate block overflow-hidden">
                        #{issue.number}: {issue.title}
                      </span>
                      {selectedIssue?.number === issue.number && (
                        <Check className="w-3 h-3 text-green-500 ml-auto shrink-0" />
                      )}
                    </DropdownMenuItem>
                  ))
                ) : issueQuery.length > 0 ? (
                  <div className="px-2 py-1.5 text-sm text-text-tertiary">
                    No issues found
                  </div>
                ) : (
                  <div className="px-2 py-1.5 text-sm text-text-tertiary">
                    No open issues
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
