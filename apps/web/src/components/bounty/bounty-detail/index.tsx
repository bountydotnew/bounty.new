'use client';

import { memo } from 'react';
import { BountyDetailHeader as Header } from './header';
import { BountyDetailContent as Content } from './content';
import { BountyDetailSubmissions as Submissions } from './submissions';
import { BountyDetailPaymentAlert as PaymentAlert } from './payment-alert';
import { BountyDetailProvider } from './provider';
import type { BountyCommentCacheItem } from '@/types/comments';

/**
 * BountyDetail Compound Component
 *
 * Provides a flexible, composable API for the bounty detail page.
 * Following Vercel composition patterns with explicit components.
 *
 * @example
 * ```tsx
 * // New API with compound components
 * import { BountyDetail } from '@/components/bounty/bounty-detail';
 *
 * <BountyDetail.Provider {...props}>
 *   <BountyDetail.Header />
 *   <BountyDetail.PaymentAlert />
 *   <BountyDetail.Content />
 *   <BountyDetail.Submissions />
 * </BountyDetail.Provider>
 * ```
 */
export const BountyDetail = {
  /**
   * Provider component that wraps the detail page with state and actions
   */
  Provider: BountyDetailProvider,

  /**
   * Header component with title, amount, creator info, and actions
   */
  Header,

  /**
   * Content component with description and markdown rendering
   */
  Content,

  /**
   * Submissions component showing list of submissions
   */
  Submissions,

  /**
   * PaymentAlert component showing payment status alerts
   */
  PaymentAlert,
};

// Re-export types
export type {
  BountyDetailContextValue,
  BountyDetailState,
  BountyDetailActions,
  BountyDetailMeta,
  SubmissionData,
  SubmissionsData,
} from './context';

// Re-export provider for direct usage
export { BountyDetailProvider } from './provider';

/**
 * Props for the legacy BountyDetailPage component
 */
interface LegacyBountyDetailPageProps {
  id: string;
  title: string;
  amount: number;
  description: string;
  tags: string[];
  user: string;
  avatarSrc: string;
  hasBadge: boolean;
  canEditBounty: boolean;
  canDeleteBounty?: boolean;
  initialVotes?: { count: number; isVoted: boolean };
  initialComments?: BountyCommentCacheItem[];
  initialBookmarked?: boolean;
  paymentStatus?: string | null;
  createdById?: string;
  githubRepoOwner?: string | null;
  githubRepoName?: string | null;
  githubIssueNumber?: number | null;
  repositoryUrl?: string | null;
  issueUrl?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

/**
 * Legacy BountyDetailPage component
 *
 * Maintains the old API for gradual migration.
 * Use the new compound component API for new code.
 *
 * @deprecated Use BountyDetail.Provider with individual components instead
 *
 * @example
 * ```tsx
 * // Recommended new API
 * import { BountyDetail } from '@/components/bounty/bounty-detail';
 *
 * <BountyDetail.Provider {...props}>
 *   <BountyDetail.Header />
 *   <BountyDetail.PaymentAlert />
 *   <BountyDetail.Content />
 *   <BountyDetail.Submissions />
 * </BountyDetail.Provider>
 *
 * // Legacy API (still supported)
 * import { LegacyBountyDetailPage } from '@/components/bounty/bounty-detail';
 *
 * <LegacyBountyDetailPage {...props} />
 * ```
 */
export const LegacyBountyDetailPage = memo(function LegacyBountyDetailPage({
  id,
  title,
  amount,
  description,
  user,
  avatarSrc,
  canEditBounty,
  canDeleteBounty = false,
  initialVotes,
  initialComments,
  initialBookmarked,
  paymentStatus,
  createdById,
  githubRepoOwner,
  githubRepoName,
  githubIssueNumber,
  repositoryUrl,
  issueUrl,
  onEdit,
  onDelete,
}: LegacyBountyDetailPageProps) {
  return (
    <div className="min-h-screen bg-[#111110] text-white">
      <BountyDetailProvider
        bountyId={id}
        title={title}
        amount={amount}
        description={description}
        user={user}
        avatarSrc={avatarSrc}
        canEditBounty={canEditBounty}
        initialVotes={initialVotes}
        initialComments={initialComments}
        initialBookmarked={initialBookmarked}
        paymentStatus={paymentStatus}
        createdById={createdById}
        githubRepoOwner={githubRepoOwner}
        githubRepoName={githubRepoName}
        githubIssueNumber={githubIssueNumber}
        repositoryUrl={repositoryUrl}
        issueUrl={issueUrl}
        onEdit={onEdit}
        onDelete={onDelete}
      >
        <div className="mx-auto max-w-[90%]">
          <div className="mx-auto max-w-4xl">
            <div className="p-8">
              <Header />
              <PaymentAlert />
              <Content />
              <Submissions />
            </div>
          </div>
        </div>
      </BountyDetailProvider>
    </div>
  );
});
