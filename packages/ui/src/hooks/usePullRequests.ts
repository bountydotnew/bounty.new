import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

export type PullRequestItem = {
  number: number;
  title: string;
  state: string;
  user: string;
  html_url: string;
  head_sha: string;
  updated_at: string;
};

export function usePullRequests(
  owner: string,
  repo: string,
  options?: {
    listPullRequests?: (params: {
      owner: string;
      repo: string;
    }) => Promise<PullRequestItem[]>;
  }
) {
  const pullRequestsList = useQuery({
    queryKey: ['repository.listPullRequests', owner, repo],
    queryFn: () => {
      if (!owner || !repo || !options?.listPullRequests) {
        return Promise.resolve([]);
      }
      return options.listPullRequests({ owner, repo });
    },
    enabled: !!owner && !!repo && !!options?.listPullRequests,
    staleTime: 60_000,
  });

  const [prQuery, setPrQuery] = useState('');

  const filteredPullRequests = useMemo(() => {
    if (!pullRequestsList.data) {
      return [];
    }
    if (!prQuery.trim()) {
      return pullRequestsList.data;
    }
    const query = prQuery.toLowerCase();
    return pullRequestsList.data.filter((pr) => {
      return (
        String(pr.number).includes(query) ||
        pr.title.toLowerCase().includes(query) ||
        pr.user.toLowerCase().includes(query)
      );
    });
  }, [pullRequestsList.data, prQuery]);

  return {
    pullRequestsList,
    filteredPullRequests,
    prQuery,
    setPrQuery,
  };
}
