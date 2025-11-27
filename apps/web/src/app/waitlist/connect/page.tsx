'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Onboarding } from '@/components/waitlist/onboarding';

export default function ConnectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get('entryId');
  const email = searchParams.get('email');

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
