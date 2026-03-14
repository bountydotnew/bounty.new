import { useQuery, useAction } from 'convex/react';
import { api } from '@/utils/convex';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';

interface InstallationRepos {
  installationId: number;
  accountLogin: string | null;
  accountType: string | null;
  repositories: string[];
  loading: boolean;
  isDefault?: boolean;
}

export function useGitHubInstallationRepositories() {
  // Get all installations for the user (reactive query)
  const installationsData = useQuery(
    api.functions.githubInstallation.getInstallations,
    {}
  );
  const installationsLoading = installationsData === undefined;

  const installations = installationsData?.installations ?? [];

  // Action to fetch repos from GitHub API
  const getRepositories = useAction(
    api.functions.githubInstallation.getRepositories
  );

  // Local state to hold fetched repos
  const [reposByInstallation, setReposByInstallation] = useState<
    Record<number, string[]>
  >({});
  const [reposLoading, setReposLoading] = useState(false);

  // Track which installation IDs we've fetched for to avoid re-fetching
  const fetchedForRef = useRef<string>('');

  // Fetch repos for each installation when installations change
  useEffect(() => {
    if (installations.length === 0) return;

    const installationIdsKey = installations
      .map((i: any) => i.id)
      .sort()
      .join(',');

    // Skip if we already fetched for these installations
    if (fetchedForRef.current === installationIdsKey) return;
    fetchedForRef.current = installationIdsKey;

    setReposLoading(true);

    Promise.allSettled(
      installations.map((installation: any) =>
        getRepositories({ installationId: installation.id })
      )
    ).then((results) => {
      const newReposByInstallation: Record<number, string[]> = {};
      results.forEach((result, index) => {
        const installation = installations[index] as any;
        if (result.status === 'fulfilled' && result.value.success) {
          newReposByInstallation[installation.id] =
            result.value.repositories.map(
              (r: { fullName: string }) => r.fullName
            );
        } else {
          newReposByInstallation[installation.id] = [];
        }
      });
      setReposByInstallation(newReposByInstallation);
      setReposLoading(false);
    });
  }, [installations, getRepositories]);

  const hasReposData = Object.keys(reposByInstallation).length > 0;

  // Build InstallationRepos array, with default installation first
  const installationRepos: InstallationRepos[] = useMemo(() => {
    const installationsWithRepos = installations.map((installation: any) => ({
      installationId: installation.id,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      repositories: reposByInstallation[installation.id] ?? [],
      loading: reposLoading || !hasReposData,
      isDefault: installation.isDefault ?? false,
    }));

    // Sort: default installation first, then by account login
    return installationsWithRepos.sort(
      (a: InstallationRepos, b: InstallationRepos) => {
        if (a.isDefault && !b.isDefault) return -1;
        if (!a.isDefault && b.isDefault) return 1;
        return (a.accountLogin ?? '').localeCompare(b.accountLogin ?? '');
      }
    );
  }, [installations, reposByInstallation, reposLoading, hasReposData]);

  // Flatten all repositories for backward compatibility
  // Repositories from default installation come first
  const allRepositories = useMemo(() => {
    if (!hasReposData) return [];
    // Return repos in installation order (default first)
    return installationRepos.flatMap((install) => install.repositories);
  }, [hasReposData, installationRepos]);

  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<string>('');

  // Filter repositories based on search query
  const filteredRepositories = useMemo(() => {
    if (!repoSearchQuery) {
      return allRepositories;
    }
    const query = repoSearchQuery.toLowerCase();
    return allRepositories.filter((repo: string) =>
      repo.toLowerCase().includes(query)
    );
  }, [allRepositories, repoSearchQuery]);

  // Filter installation repos based on search query
  const filteredInstallationRepos: InstallationRepos[] = useMemo(() => {
    if (!repoSearchQuery) {
      return installationRepos;
    }
    const query = repoSearchQuery.toLowerCase();
    return installationRepos.map((install) => ({
      ...install,
      repositories: install.repositories.filter((repo: string) =>
        repo.toLowerCase().includes(query)
      ),
    }));
  }, [installationRepos, repoSearchQuery]);

  // Filter installations list based on account search
  const [accountSearchQuery, setAccountSearchQuery] = useState('');
  const filteredInstallations = useMemo(() => {
    if (!accountSearchQuery) {
      return installations;
    }
    const query = accountSearchQuery.toLowerCase();
    return installations.filter((inst: any) =>
      inst.accountLogin?.toLowerCase().includes(query)
    );
  }, [installations, accountSearchQuery]);

  // Set default repository when repos are loaded
  useEffect(() => {
    if (allRepositories.length > 0 && !selectedRepository && !reposLoading) {
      setSelectedRepository(allRepositories[0]);
    }
  }, [allRepositories, selectedRepository, reposLoading]);

  // Reset selected repository when repositories change
  const prevRepositoriesRef = useRef<string[]>([]);
  useEffect(() => {
    const reposChanged =
      prevRepositoriesRef.current.length !== allRepositories.length ||
      prevRepositoriesRef.current.some(
        (repo, i) => repo !== allRepositories[i]
      );

    if (
      reposChanged &&
      selectedRepository &&
      !allRepositories.includes(selectedRepository)
    ) {
      setSelectedRepository('');
    }

    prevRepositoriesRef.current = allRepositories;
  }, [allRepositories, selectedRepository]);

  return {
    allRepositories,
    filteredRepositories,
    installationRepos,
    filteredInstallationRepos,
    installations,
    filteredInstallations,
    installationsLoading,
    reposLoading: reposLoading || installationsLoading,
    accountSearchQuery,
    setAccountSearchQuery,
    repoSearchQuery,
    setRepoSearchQuery,
    selectedRepository,
    setSelectedRepository,
  };
}
