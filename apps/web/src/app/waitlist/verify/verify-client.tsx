'use client';

import { useRouter } from 'next/navigation';
import { VerifyEmail } from '@/components/waitlist/verify-email';

interface VerifyEmailClientProps {
  entryId: string;
  email: string;
}

export function VerifyEmailClient({
  entryId,
  email,
}: VerifyEmailClientProps) {
  const router = useRouter();

  const handleVerified = (verifiedId: string) => {
    router.push(`/waitlist/connect?entryId=${verifiedId}`);
  };

  const handleBack = () => {
    router.push('/');
  };

  return (
    <div
      className="relative min-h-screen text-white"
      style={{
        background:
          'linear-gradient(180deg, rgba(22, 22, 22, 1) 0%, rgba(12, 12, 12, 1) 100%)',
      }}
    >
      <div className="flex min-h-screen items-center justify-center px-6 py-20">
        <VerifyEmail
          entryId={entryId}
          email={email}
          onVerified={handleVerified}
          onBack={handleBack}
        />
      </div>
    </div>
  );
}
