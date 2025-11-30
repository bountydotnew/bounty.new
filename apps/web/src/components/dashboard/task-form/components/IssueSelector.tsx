import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { GithubIcon } from '@bounty/ui';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuContent,
} from '@bounty/ui/components/dropdown-menu';

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

    return (
        <DropdownMenu open={showIssueDropdown} onOpenChange={setShowIssueDropdown}>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    className="flex flex-row items-center gap-1.5 text-[#5A5A5A] hover:text-[#888] transition-colors"
                >
                    <GithubIcon className="w-3.5 h-3.5" />
                    <span className="text-[14px] text-[#888]">
                        {selectedIssue ? `#${selectedIssue.number}` : 'Issue'}
                    </span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showIssueDropdown ? 'rotate-180' : ''}`} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-60 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
                align="start"
                side="bottom"
            >
                <div className="p-1">
                    <div className="flex items-center border-b border-[#232323] px-2 font-medium">
                        <input
                            className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] text-[#CFCFCF]"
                            placeholder="Search issues"
                            value={issueQuery}
                            onChange={(e) => setIssueQuery(e.target.value)}
                            autoComplete="off"
                            autoCorrect="off"
                            spellCheck={false}
                        />
                    </div>
                    <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
                    <div className="max-h-[240px] overflow-y-auto px-1 pb-1">
                        {issuesList.isLoading || issuesList.isFetching ? (
                            <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                Loading issues...
                            </div>
                        ) : filteredIssues.length > 0 ? (
                            filteredIssues.map((issue: Issue) => (
                                <DropdownMenuItem
                                    key={issue.number}
                                    className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                                    onClick={() => {
                                        onSelect(issue);
                                        setShowIssueDropdown(false);
                                    }}
                                    data-selected={selectedIssue?.number === issue.number}
                                >
                                    <GithubIcon className="size-4 text-[#5A5A5A]" />
                                    <span className="text-[#CFCFCF] truncate block overflow-hidden">
                                        #{issue.number}: {issue.title}
                                    </span>
                                    {selectedIssue?.number === issue.number && <Check className="w-3 h-3 text-green-500 ml-auto shrink-0" />}
                                </DropdownMenuItem>
                            ))
                        ) : issueQuery.length > 0 ? (
                            <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                No issues found
                            </div>
                        ) : (
                            <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                                No open issues
                            </div>
                        )}
                    </div>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

