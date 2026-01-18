'use client';

import { usePathname } from 'next/navigation';
import { useQueryStates, parseAsString } from 'nuqs';
import { useMemo } from 'react';

export type NavigationContext = {
  from: 'dashboard' | 'bounties' | 'gh-issue' | 'direct';
  backPath: string;
  backLabel: string;
  breadcrumbs: Array<{
    label: string;
    href: string;
  }>;
  referrerInfo?: {
    owner?: string;
    repo?: string;
    issueNumber?: string;
  };
};

export function useNavigationContext(): NavigationContext {
  const pathname = usePathname();
  const [{ from, ref }] = useQueryStates({
    from: parseAsString,
    ref: parseAsString,
  });

  return useMemo(() => {
    // Dashboard context
    if (from === 'dashboard' || pathname === '/dashboard') {
      return {
        from: 'dashboard',
        backPath: '/dashboard',
        backLabel: 'Dashboard',
        breadcrumbs: [{ label: 'Dashboard', href: '/dashboard' }],
      };
    }

    // GitHub issue context
    if (from === 'gh-issue' || ref?.includes('github')) {
      let referrerInfo: {
        owner?: string;
        repo?: string;
        issueNumber?: string;
      } = {};

      if (ref?.includes('/issues/')) {
        const parts = ref.split('/');
        const githubIndex = parts.findIndex((part) =>
          part.includes('github.com')
        );
        if (githubIndex !== -1) {
          const owner = parts[githubIndex + 1];
          const repo = parts[githubIndex + 2];
          const issueNumber = parts[parts.indexOf('issues') + 1];
          
          referrerInfo = {
            ...(owner !== undefined && { owner }),
            ...(repo !== undefined && { repo }),
            ...(issueNumber !== undefined && { issueNumber }),
          };
        }
      }

      if (referrerInfo.owner && referrerInfo.repo && referrerInfo.issueNumber) {
        return {
          from: 'gh-issue',
          backPath: `/${referrerInfo.owner}/${referrerInfo.repo}/issues/${referrerInfo.issueNumber}`,
          backLabel: `Issue #${referrerInfo.issueNumber}`,
          breadcrumbs: [
            { label: 'GitHub', href: 'https://github.com' },
            {
              label: `${referrerInfo.owner}/${referrerInfo.repo}`,
              href: `https://github.com/${referrerInfo.owner}/${referrerInfo.repo}`,
            },
            {
              label: `Issue #${referrerInfo.issueNumber}`,
              href: `/${referrerInfo.owner}/${referrerInfo.repo}/issues/${referrerInfo.issueNumber}`,
            },
          ],
          referrerInfo,
        };
      }

      return {
        from: 'gh-issue',
        backPath: '/bounties',
        backLabel: 'Bounties',
        breadcrumbs: [
          { label: 'Bounties', href: '/bounties' },
          { label: 'GitHub Import', href: '/bounties' },
        ],
      };
    }

    // Bounties context
    if (from === 'bounties' || pathname === '/bounties') {
      return {
        from: 'bounties',
        backPath: '/bounties',
        backLabel: 'Bounties',
        breadcrumbs: [{ label: 'Bounties', href: '/bounties' }],
      };
    }

    // Default/direct navigation
    return {
      from: 'direct',
      backPath: '/bounties',
      backLabel: 'Bounties',
      breadcrumbs: [{ label: 'Bounties', href: '/bounties' }],
    };
  }, [pathname, from, ref]);
}

// Helper function for components to add navigation context when navigating
export function addNavigationContext(
  targetUrl: string,
  currentPath: string
): string {
  const params = new URLSearchParams();

  if (currentPath.includes('/dashboard')) {
    params.set('from', 'dashboard');
  } else if (currentPath.includes('/bounties')) {
    params.set('from', 'bounties');
  } else if (currentPath.includes('/issues/')) {
    params.set('from', 'gh-issue');
    if (typeof window !== 'undefined') {
      params.set('ref', window.location.href);
    }
  }

  return params.toString() ? `${targetUrl}?${params.toString()}` : targetUrl;
}
