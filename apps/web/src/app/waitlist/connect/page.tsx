'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryState, parseAsString } from 'nuqs';
import { Onboarding } from '@/components/waitlist/onboarding';

function ConnectContent() {
  const router = useRouter();
  const [entryId] = useQueryState('entryId', parseAsString);
  const [email] = useQueryState('email', parseAsString);

  if (!entryId) {
    router.push('/');
    return null;
  }

  const handleComplete = () => {
    router.push(`/waitlist/dashboard?entryId=${entryId}${email ? `&email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <div className="relative min-h-screen text-white" style={{
      background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
    }}>
      <div className="flex min-h-screen items-center justify-center px-6 py-20">
        <Onboarding entryId={entryId} onComplete={handleComplete} />
      </div>
    </div>
  );
}

export default function ConnectPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen text-white flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
      }}>
        <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
      </div>
    }>
      <ConnectContent />
    </Suspense>
  );
}
