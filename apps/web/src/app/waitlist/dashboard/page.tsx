'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardPreview } from '@/components/waitlist/dashboard-preview';

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get('entryId');
  const email = searchParams.get('email');

  if (!entryId) {
    router.push('/');
    return null;
  }

  return (
    <div className="relative min-h-screen text-white" style={{
      background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
    }}>
      <div className="flex min-h-screen items-center justify-center px-6 py-20">
        <DashboardPreview
          entryId={entryId}
          email={email ? decodeURIComponent(email) : ''}
        />
      </div>
    </div>
  );
}
