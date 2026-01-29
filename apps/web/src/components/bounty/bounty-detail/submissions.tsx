'use client';

import { use } from 'react';
import SubmissionCard from '@/components/bounty/submission-card';
import { BountyDetailContext, type SubmissionData } from './context';

/**
 * BountyDetailSubmissions
 *
 * Displays the list of submissions for the bounty.
 * Uses the BountyDetailContext to access submissions data.
 */
export function BountyDetailSubmissions() {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error('BountyDetailSubmissions must be used within BountyDetailProvider');
  }

  const { state } = context;
  const { submissions, isSubmissionsLoading, bounty } = state;

  const submissionCount = submissions?.length ?? 0;

  return (
    <div className="mb-8 rounded-lg p-6">
      <h3 className="mb-4 font-medium text-lg text-white">
        Submissions
        {submissionCount > 0 && (
          <span className="ml-2 text-sm text-gray-400">({submissionCount})</span>
        )}
      </h3>

      <div className="space-y-4">
        {isSubmissionsLoading ? (
          <div className="text-center text-gray-400 text-sm">
            Loading submissions...
          </div>
        ) : submissions && submissions.length > 0 ? (
          submissions.map((sub: SubmissionData) => (
            <SubmissionCard
              key={sub.id}
              className="w-full"
              description={sub.description ?? undefined}
              status={sub.status as 'pending' | 'approved' | 'rejected' | 'revision_requested'}
              username={sub.githubUsername ?? undefined}
              contributorName={sub.contributorName ?? undefined}
              contributorImage={sub.contributorImage ?? undefined}
              githubPullRequestNumber={sub.githubPullRequestNumber ?? undefined}
              githubRepoOwner={bounty.githubRepoOwner ?? undefined}
              githubRepoName={bounty.githubRepoName ?? undefined}
              pullRequestUrl={sub.pullRequestUrl ?? undefined}
              deliverableUrl={sub.deliverableUrl ?? undefined}
            />
          ))
        ) : (
          <div className="rounded-lg p-6 text-center">
            <p className="text-gray-400 text-sm mb-3">No submissions yet</p>
            {bounty.githubRepoOwner && bounty.githubRepoName && bounty.githubIssueNumber && (
              <a
                href={`https://github.com/${bounty.githubRepoOwner}/${bounty.githubRepoName}/issues/${bounty.githubIssueNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#2A2A28] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#383838]"
              >
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.08-.73.08-.73 1.205.085 1.838 1.238 1.838 1.238 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.762-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Submit on GitHub
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
