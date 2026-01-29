'use client';

import { canEditBounty } from '@bounty/ui/lib/bounty-utils';
import { useSession } from '@/context/session-context';
import BountyDetailPage from '@/components/bounty/bounty-detail';
import type { BountyData } from '@/components/bounty/bounty-detail';

interface BountyContentProps {
  id: string;
  bountyData: BountyData;
}

export function BountyContent({ id, bountyData }: BountyContentProps) {
  const { session } = useSession();
  const canEdit = session?.user?.id
    ? canEditBounty(bountyData.bounty, session.user.id)
    : false;

  return (
    <div className="mx-auto w-full max-w-[800px] px-4 pt-16 pb-8 md:pt-24 md:pb-12">
      <BountyDetailPage
        bountyId={id}
        bountyData={bountyData}
        canEdit={canEdit}
      />
    </div>
  );
}
