import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { parseRepo } from '@bounty/ui/lib/utils';

export function useIssues(
    selectedRepository: string,
    options?: {
        listIssues?: (params: { owner: string; repo: string }) => Promise<unknown[]>;
    }
) {
    const repoInfo = parseRepo(selectedRepository);
    
    const issuesList = useQuery({
        queryKey: ['repository.listIssues', repoInfo?.owner, repoInfo?.repo],
        queryFn: () => {
            if (!repoInfo || !options?.listIssues) {
                return Promise.resolve([]);
            }
            return options.listIssues({
                owner: repoInfo.owner,
                repo: repoInfo.repo,
            });
        },
        enabled: !!repoInfo && !!options?.listIssues,
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
                String((issue as { number: number }).number).includes(query) ||
                (issue as { title: string }).title.toLowerCase().includes(query)
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

