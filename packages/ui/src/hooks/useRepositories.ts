import { useQuery } from '@tanstack/react-query';
import { useMemo, useState, useEffect, useRef } from 'react';
import { trpc } from '@/utils/trpc';
import { GITHUB_URL_REGEX } from '@/utils/utils';

export function useRepositories(githubUsername?: string) {
    const { data: reposData, isLoading: reposLoading, error: reposError } = useQuery({
        ...trpc.repository.myRepos.queryOptions(),
        staleTime: 120_000, // 2 minutes
    });

    // Extract repository names from the response
    const repositories = useMemo(() => {
        if (!reposData) {
            return [];
        }
        if (!('success' in reposData)) {
            return [];
        }
        if (reposData.success === false) {
            return [];
        }
        const successData = reposData as { success: true; data: Array<{ name: string; url: string; full_name?: string }> };
        return successData.data.map((repo) => {
            if (repo.full_name) {
                return repo.full_name;
            }
            const urlMatch = repo.url.match(GITHUB_URL_REGEX);
            if (urlMatch) {
                return `${urlMatch[1]}/${urlMatch[2]}`;
            }
            return repo.name;
        });
    }, [reposData]);

    const [repoSearchQuery, setRepoSearchQuery] = useState('');
    const [selectedRepository, setSelectedRepository] = useState<string>('');

    // Filter repositories based on search query
    const filteredRepositories = useMemo(() => {
        if (!repoSearchQuery) {
            return repositories;
        }
        const query = repoSearchQuery.toLowerCase();
        return repositories.filter((repo: string) =>
            repo.toLowerCase().includes(query)
        );
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
        reposLoading,
        reposData,
        reposError,
        githubUsername,
        repoSearchQuery,
        setRepoSearchQuery,
        selectedRepository,
        setSelectedRepository,
    };
}

