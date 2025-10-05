'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { parseAsString, useQueryState } from 'nuqs';
import { Suspense } from 'react';
import { DeviceApprovalPanel } from '@/components/device/device-approval-panel';

function DeviceApproveContent() {
  const [userCode] = useQueryState('user_code', parseAsString);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <DeviceApprovalPanel userCode={userCode ?? ''} />
      </div>
    </div>
  );
}

export default function DeviceApprovePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-1 items-center justify-center">
          <Spinner />
        </div>
      }
    >
      <DeviceApproveContent />
    </Suspense>
  );
}
