'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { VerifyEmail } from '@/components/waitlist/verify-email';

function VerifyContent() {
  const router = useRouter();
  const [entryId] = useQueryState('entryId', parseAsString);
  const [email] = useQueryState('email', parseAsString);

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

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen text-white flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
      }}>
        <div className="h-8 w-8 animate-spin rounded-full border-foreground border-b-2" />
      </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}
