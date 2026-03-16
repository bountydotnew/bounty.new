import { useMemo, useState, useEffect, useCallback } from 'react';

export function useBranches(
  selectedRepository: string,
  options: {
    defaultBranchFn: (params: { repo: string }) => Promise<any>;
    branchesFn: (params: { repo: string }) => Promise<any>;
  }
) {
  const [defaultBranchData, setDefaultBranchData] = useState<any>(null);
  const [branchesData, setBranchesData] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  useEffect(() => {
    if (!selectedRepository) {
      setDefaultBranchData(null);
      setBranchesData([]);
      return;
    }

    let cancelled = false;
    setBranchesLoading(true);

    Promise.all([
      options.defaultBranchFn({ repo: selectedRepository }).catch(() => null),
      options.branchesFn({ repo: selectedRepository }).catch(() => []),
    ]).then(([defaultResult, branchesResult]) => {
      if (cancelled) return;
      setDefaultBranchData(defaultResult);
      setBranchesData(branchesResult || []);
      setBranchesLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedRepository]);

  const defaultBranch =
    (typeof defaultBranchData === 'object' &&
      defaultBranchData?.defaultBranch) ||
    (typeof defaultBranchData === 'string' ? defaultBranchData : '') ||
    '';

  const branches: string[] = Array.isArray(branchesData)
    ? branchesData.map((b: any) => (typeof b === 'string' ? b : b?.name || ''))
    : [];

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
      if (a === defaultBranch) return -1;
      if (b === defaultBranch) return 1;
      const aIdx = priority.indexOf(a);
      const bIdx = priority.indexOf(b);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [branches, defaultBranch]);

  // Filter branches based on search query
  const filteredBranches = useMemo(() => {
    if (!branchSearchQuery) return sortedBranches;
    const query = branchSearchQuery.toLowerCase();
    return sortedBranches.filter((branch: string) =>
      branch.toLowerCase().includes(query)
    );
  }, [sortedBranches, branchSearchQuery]);

  // Set default branch when repository changes
  useEffect(() => {
    if (selectedRepository && defaultBranch) {
      setSelectedBranch(defaultBranch);
    } else if (selectedRepository && branches.length > 0 && !defaultBranch) {
      const fallbackBranch =
        branches.find((b: string) => b === 'main' || b === 'master') ||
        branches[0];
      if (fallbackBranch) setSelectedBranch(fallbackBranch);
    }
  }, [selectedRepository, defaultBranch, branches]);

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
