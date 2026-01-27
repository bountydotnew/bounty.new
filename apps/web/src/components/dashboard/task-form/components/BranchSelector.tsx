import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { BranchIcon, Spinner } from '@bounty/ui';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuContent,
} from '@bounty/ui/components/dropdown-menu';

interface BranchSelectorProps {
  selectedBranch: string;
  filteredBranches: string[];
  branchesLoading: boolean;
  branchSearchQuery: string;
  setBranchSearchQuery: (query: string) => void;
  onSelect: (branch: string) => void;
}

export function BranchSelector({
  selectedBranch,
  filteredBranches,
  branchesLoading,
  branchSearchQuery,
  setBranchSearchQuery,
  onSelect,
}: BranchSelectorProps) {
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);

  if (branchesLoading) {
    return (
      <button
        type="button"
        disabled
        className="flex flex-row items-center gap-1.5 text-[#5A5A5A] opacity-50 cursor-not-allowed"
      >
        <Spinner size="sm" className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <DropdownMenu
      open={showBranchDropdown}
      onOpenChange={setShowBranchDropdown}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex flex-row items-center gap-1.5 text-[#5A5A5A] hover:text-[#888] transition-colors"
        >
          <BranchIcon className="w-3.5 h-3.5" />
          <span className="text-[14px] text-[#888]">{selectedBranch}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform ${showBranchDropdown ? 'rotate-180' : ''}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-52 p-0 border-[#232323] bg-[#191919] text-[#CFCFCF] rounded-xl shadow-[rgba(0,0,0,0.08)_0px_16px_40px_0px]"
        align="start"
        side="bottom"
      >
        <div className="p-1">
          <div className="flex items-center border-b border-[#232323] px-2 font-medium">
            <input
              className="flex h-7 w-full rounded-md bg-transparent py-3 text-sm outline-none focus:outline-none focus:ring-0 focus-visible:ring-0 placeholder:text-[#5A5A5A] text-[#CFCFCF]"
              placeholder="Search branches"
              value={branchSearchQuery}
              onChange={(e) => setBranchSearchQuery(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <DropdownMenuSeparator className="h-px bg-[#232323] my-1 -mx-1" />
          <div className="max-h-[240px] overflow-y-auto px-1 pb-1">
            {filteredBranches.length > 0 ? (
              filteredBranches.map((branch: string) => (
                <DropdownMenuItem
                  key={branch}
                  className="relative cursor-default select-none py-1.5 outline-none data-[disabled=true]:pointer-events-none data-[selected=true]:text-[#CFCFCF] data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 flex items-center gap-2 w-full h-8 px-2 rounded-lg data-[selected=true]:bg-[#141414] text-sm font-medium hover:bg-[#141414] focus:bg-[#141414] bg-transparent"
                  onClick={() => {
                    onSelect(branch);
                    setShowBranchDropdown(false);
                  }}
                  data-selected={selectedBranch === branch}
                >
                  <BranchIcon className="w-3.5 h-3.5 shrink-0 text-[#5A5A5A]" />
                  <span className="text-[#CFCFCF] truncate">{branch}</span>
                  {selectedBranch === branch && (
                    <Check className="w-3 h-3 text-green-500 ml-auto shrink-0" />
                  )}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="px-2 py-1.5 text-sm text-[#5A5A5A]">
                No branches found
              </div>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
