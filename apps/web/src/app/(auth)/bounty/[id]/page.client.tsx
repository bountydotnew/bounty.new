'use client';

import { useParams } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { useBountyDetail } from './hooks/use-bounty-detail';
import { usePaymentVerification } from './hooks/use-payment-verification';
import {
  InvalidIdState,
  NotFoundState,
  ErrorState,
} from './components/bounty-error-states';
import { BountyContent } from './components/bounty-content';
import { BountyDetailSkeleton } from '@/components/dashboard/skeletons/bounty-detail-skeleton';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function BountyPage() {
  const { id } = useParams<{ id: string }>();
  const [payment] = useQueryState('payment', parseAsString);
  const [sessionId] = useQueryState('session_id', parseAsString);

  const isValidUuid = (v: string | undefined | null) =>
    typeof v === 'string' && UUID_REGEX.test(v);
  const validId = isValidUuid(id);

  // Handle payment verification
  usePaymentVerification({
    payment,
    sessionId,
    bountyId: id ?? null,
  });

  // Fetch bounty data
  const { data, isLoading, isError, isNotFound } = useBountyDetail({
    id: id ?? '',
    enabled: validId,
  });

  // Invalid UUID
  if (!validId) {
    return <InvalidIdState />;
  }

  // Loading state - show skeleton for better UX
  if (isLoading) {
    return <BountyDetailSkeleton />;
  }

  // Not found state (deleted or never existed)
  if (isNotFound || !data) {
    return <NotFoundState />;
  }

  // Other error state (network issues, server errors)
  if (isError) {
    return <ErrorState />;
  }

  // Render bounty content
  return <BountyContent id={id ?? ''} bountyData={data} />;
}
