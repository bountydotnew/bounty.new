'use client';

import { Spinner } from '@bounty/ui/components/spinner';
import { parseAsString, useQueryState } from 'nuqs';
import { Suspense } from 'react';
import { DeviceCodeEntry } from '@/components/device/device-code-entry';

function DevicePageContent() {
  const [userCode] = useQueryState('user_code', parseAsString);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#050505] px-4 py-16 text-white">
      <DeviceCodeEntry initialCode={userCode ?? ''} />
    </main>
  );
}

export default function DevicePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#050505]">
          <Spinner />
        </main>
      }
    >
      <DevicePageContent />
    </Suspense>
  );
}
