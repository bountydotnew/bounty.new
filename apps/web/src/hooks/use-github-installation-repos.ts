import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';

export interface InstallationRepos {
  installationId: number;
  accountLogin: string | null;
  accountType: string | null;
  repositories: string[];
  loading: boolean;
}

export function useGitHubInstallationRepositories() {
  // Get all installations for the user
  const { data: installationsData, isLoading: installationsLoading } = useQuery(
    trpc.githubInstallation.getInstallations.queryOptions()
  );

  const installations = installationsData?.installations ?? [];

  // Fetch repos for each installation in parallel
  const reposQueries = useQuery({
    enabled: installations.length > 0,
    staleTime: 120_000,
    queryKey: ['github-installation-all-repos', installations.map((i) => i.id).sort()],
    queryFn: async () => {
      if (installations.length === 0) {
        return {};
      }

      // Fetch repos for all installations in parallel
      const results = await Promise.allSettled(
        installations.map((installation) =>
          trpcClient.githubInstallation.getRepositories.query({ installationId: installation.id })
        )
      );

      // Group results by installation
      const reposByInstallation: Record<number, string[]> = {};
      results.forEach((result, index) => {
        const installation = installations[index];
        if (result.status === 'fulfilled' && result.value.success) {
          reposByInstallation[installation.id] = result.value.repositories.map(
            (r: { fullName: string }) => r.fullName
          );
        } else {
          reposByInstallation[installation.id] = [];
        }
      });

      return reposByInstallation;
    },
  });

  // Build InstallationRepos array
  const installationRepos: InstallationRepos[] = useMemo(() => {
    const reposData = reposQueries.data ?? {};

    return installations.map((installation) => ({
      installationId: installation.id,
      accountLogin: installation.accountLogin,
      accountType: installation.accountType,
      repositories: reposData[installation.id] ?? [],
      loading: reposQueries.isLoading || !reposQueries.data,
    }));
  }, [installations, reposQueries.data, reposQueries.isLoading]);

  // Flatten all repositories for backward compatibility
  const allRepositories = useMemo(() => {
    if (!reposQueries.data) return [];
    return Object.values(reposQueries.data).flat();
  }, [reposQueries.data]);

  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<string>('');

  // Filter repositories based on search query
  const filteredRepositories = useMemo(() => {
    if (!repoSearchQuery) {
      return allRepositories;
    }
    const query = repoSearchQuery.toLowerCase();
    return allRepositories.filter((repo: string) => repo.toLowerCase().includes(query));
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
    return installations.filter((inst) =>
      inst.accountLogin?.toLowerCase().includes(query)
    );
  }, [installations, accountSearchQuery]);

  // Set default repository when repos are loaded
  useEffect(() => {
    if (
      allRepositories.length > 0 &&
      !selectedRepository &&
      !reposQueries.isLoading
    ) {
      setSelectedRepository(allRepositories[0]);
    }
  }, [allRepositories, selectedRepository, reposQueries.isLoading]);

  // Reset selected repository when repositories change
  const prevRepositoriesRef = useRef<string[]>([]);
  useEffect(() => {
    const reposChanged =
      prevRepositoriesRef.current.length !== allRepositories.length ||
      prevRepositoriesRef.current.some((repo, i) => repo !== allRepositories[i]);

    if (reposChanged && selectedRepository && !allRepositories.includes(selectedRepository)) {
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
    reposLoading: reposQueries.isLoading || installationsLoading,
    accountSearchQuery,
    setAccountSearchQuery,
    repoSearchQuery,
    setRepoSearchQuery,
    selectedRepository,
    setSelectedRepository,
  };
}
