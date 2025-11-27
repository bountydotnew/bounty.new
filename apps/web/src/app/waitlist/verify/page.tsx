'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { VerifyEmail } from '@/components/waitlist/verify-email';

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const entryId = searchParams.get('entryId');
  const email = searchParams.get('email');

  const [verifiedEntryId, setVerifiedEntryId] = useState<string | null>(null);

  if (!entryId || !email) {
    router.push('/');
    return null;
  }

  const handleVerified = (verifiedId: string) => {
    setVerifiedEntryId(verifiedId);
    router.push(`/waitlist/connect?entryId=${verifiedId}&email=${encodeURIComponent(email)}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div className="relative min-h-screen text-white" style={{
      background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
    }}>
      <div className="flex min-h-screen items-center justify-center px-6 py-20">
        <VerifyEmail
          email={decodeURIComponent(email)}
          onVerified={handleVerified}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
