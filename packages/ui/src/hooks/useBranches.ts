import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useRef } from 'react';

export function useBranches(
  selectedRepository: string,
  options: {
    defaultBranchQueryOptions: Parameters<typeof useQuery>[0];
    branchesQueryOptions: Parameters<typeof useQuery>[0];
  }
) {
  const { data: defaultBranchData } = useQuery({
    ...options.defaultBranchQueryOptions,
    enabled: !!selectedRepository,
    staleTime: 60_000, // 1 minute
  });

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    ...options.branchesQueryOptions,
    enabled: !!selectedRepository,
    staleTime: 60_000, // 1 minute
  });

  const defaultBranch = (defaultBranchData as string) || '';
  const branches: string[] = (branchesData as string[]) || [];
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');

  // Sort branches: default branch first, then common branches, then alphabetical
  const sortedBranches = useMemo(() => {
    const priority = [
      'main',
      'master',
      'develop',
      'dev',
      'staging',
      'production',
    ];
    return [...branches].sort((a, b) => {
      // Default branch always first
      if (a === defaultBranch) {
        return -1;
      }
      if (b === defaultBranch) {
        return 1;
      }
      // Then by priority list
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) {
        return aIdx - bIdx;
      }
      if (aIdx !== -1) {
        return -1;
      }
      if (bIdx !== -1) {
        return 1;
      }
      // Then alphabetical
      return a.localeCompare(b);
    });
  }, [branches, defaultBranch]);

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!branchSearchQuery) {
      return sortedBranches;
    }
    const query = branchSearchQuery.toLowerCase();
    return sortedBranches.filter((branch: string) =>
      branch.toLowerCase().includes(query)
    );
  }, [sortedBranches, branchSearchQuery]);

  // Set default branch when repository changes or default branch is fetched
  // Render-time pattern: track previous inputs in a ref, update state synchronously
  const prevRef = useRef({ selectedRepository, defaultBranch, branches });
  if (
    prevRef.current.selectedRepository !== selectedRepository ||
    prevRef.current.defaultBranch !== defaultBranch ||
    prevRef.current.branches !== branches
  ) {
    prevRef.current = { selectedRepository, defaultBranch, branches };
    if (selectedRepository && defaultBranch) {
      setSelectedBranch(defaultBranch);
    } else if (selectedRepository && branches.length > 0 && !defaultBranch) {
      const fallbackBranch =
        branches.find((b: string) => b === 'main' || b === 'master') ||
        branches[0];
      if (fallbackBranch) {
        setSelectedBranch(fallbackBranch);
      }
    }
  }

  return {
    branches,
    filteredBranches,
    branchesLoading,
    branchSearchQuery,
    setBranchSearchQuery,
    selectedBranch,
    setSelectedBranch,
  };
}
