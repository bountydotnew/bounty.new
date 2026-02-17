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
