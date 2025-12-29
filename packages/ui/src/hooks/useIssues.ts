import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { trpcClient } from '@/utils/trpc';
import { parseRepo } from '@/utils/utils';

export function useIssues(selectedRepository: string) {
    const repoInfo = parseRepo(selectedRepository);
    
    const issuesList = useQuery({
        queryKey: ['repository.listIssues', repoInfo?.owner, repoInfo?.repo],
        queryFn: () => {
            if (!repoInfo) {
                return Promise.resolve([]);
            }
            return trpcClient.repository.listIssues.query({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
            });
        },
        enabled: !!repoInfo,
        staleTime: 60_000,
    });

    const [issueQuery, setIssueQuery] = useState('');

    // Filter issues by search query if provided
    const filteredIssues = useMemo(() => {
        if (!issuesList.data) {
            return [];
        }
        if (!issueQuery.trim()) {
            return issuesList.data;
        }
        const query = issueQuery.toLowerCase();
        return issuesList.data.filter((issue) => {
            return (
                String(issue.number).includes(query) ||
                issue.title.toLowerCase().includes(query)
            );
        });
    }, [issuesList.data, issueQuery]);

    return {
        issuesList,
        filteredIssues,
        issueQuery,
        setIssueQuery,
        repoInfo,
    };
}

