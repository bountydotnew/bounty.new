import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef } from 'react';
import { trpc, trpcClient } from '@/utils/trpc';

export function useGitHubInstallationRepositories() {
  // First, get all installations for the user
  const { data: installationsData, isLoading: installationsLoading } = useQuery(
    trpc.githubInstallation.getInstallations.queryOptions()
  );

  // Get the first installation's repositories
  const firstInstallationId = installationsData?.installations?.[0]?.id;
  const { data: reposData, isLoading: reposLoading } = useQuery({
    enabled: !!firstInstallationId,
    staleTime: 120_000,
    queryKey: ['github-installation-repos', firstInstallationId],
    queryFn: async () => {
      if (!firstInstallationId) {
        return { success: true, repositories: [] };
      }
      return trpcClient.githubInstallation.getRepositories.query({ installationId: firstInstallationId });
    },
  });

  // Extract repository full names from the response
  const repositories = useMemo(() => {
    if (!reposData || !reposData.success) {
      return [];
    }
    return reposData.repositories.map((r: { fullName: string }) => r.fullName);
  }, [reposData]);

  const [repoSearchQuery, setRepoSearchQuery] = useState('');
  const [selectedRepository, setSelectedRepository] = useState<string>('');

  // Filter repositories based on search query
  const filteredRepositories = useMemo(() => {
    if (!repoSearchQuery) {
      return repositories;
    }
    const query = repoSearchQuery.toLowerCase();
    return repositories.filter((repo: string) => repo.toLowerCase().includes(query));
  }, [repositories, repoSearchQuery]);

  // Set default repository when repos are loaded
  useEffect(() => {
    if (
      repositories.length > 0 &&
      !selectedRepository &&
      !reposLoading
    ) {
      setSelectedRepository(repositories[0]);
    }
  }, [repositories, selectedRepository, reposLoading]);

  // Reset selected repository when repositories change
  const prevRepositoriesRef = useRef<string[]>([]);
  useEffect(() => {
    const reposChanged =
      prevRepositoriesRef.current.length !== repositories.length ||
      prevRepositoriesRef.current.some((repo, i) => repo !== repositories[i]);

    if (reposChanged && selectedRepository && !repositories.includes(selectedRepository)) {
      setSelectedRepository('');
    }

    prevRepositoriesRef.current = repositories;
  }, [repositories, selectedRepository]);

  return {
    repositories,
    filteredRepositories,
    installations: installationsData?.installations ?? [],
    installationsLoading,
    reposLoading,
    repoSearchQuery,
    setRepoSearchQuery,
    selectedRepository,
    setSelectedRepository,
  };
}
