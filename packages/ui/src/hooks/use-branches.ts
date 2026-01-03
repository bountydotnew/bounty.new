import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect } from 'react';
import { trpc } from '@/utils/trpc';

export function useBranches(selectedRepository: string) {
  const { data: defaultBranchData } = useQuery({
    ...trpc.repository.defaultBranch.queryOptions({
      repo: selectedRepository,
    }),
    enabled: !!selectedRepository,
    staleTime: 60_000, // 1 minute
  });

  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    ...trpc.repository.branches.queryOptions({
      repo: selectedRepository,
    }),
    enabled: !!selectedRepository,
    staleTime: 60_000, // 1 minute
  });

  const branches = branchesData || [];
  const [branchSearchQuery, setBranchSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('main');

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!branchSearchQuery) {
      return branches;
    }
    const query = branchSearchQuery.toLowerCase();
    return branches.filter((branch: string) =>
      branch.toLowerCase().includes(query)
    );
  }, [branches, branchSearchQuery]);

  // Set default branch when repository changes or default branch is fetched
  useEffect(() => {
    if (selectedRepository && defaultBranchData) {
      setSelectedBranch(defaultBranchData);
    } else if (
      selectedRepository &&
      branches.length > 0 &&
      !defaultBranchData
    ) {
      const fallbackBranch =
        branches.find((b) => b === 'main' || b === 'master') || branches[0];
      setSelectedBranch(fallbackBranch);
    }
  }, [selectedRepository, defaultBranchData, branches]);

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
