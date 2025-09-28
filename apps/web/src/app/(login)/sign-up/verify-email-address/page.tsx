'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useMemo } from 'react';
import { EmailVerification } from '@/components/auth/email-verification';

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = useMemo(() => searchParams.get('email') ?? '', [searchParams]);
  const redirectUrl = useMemo(
    () => searchParams.get('redirect_url') ?? '/login',
    [searchParams],
  );

  const onBack = () => {
    router.push('/sign-up');
  };

  const onSuccess = () => {
    router.push(redirectUrl);
  };

  const onEditInfo = () => {
    router.push('/sign-up');
  };

  // If no email is provided, bounce back to sign-up to collect it.
  if (!email) {
    router.replace('/sign-up');
    return null;
  }

  return (
    <div className="mx-auto min-h-screen w-full bg-[#111110] text-[#f3f3f3]">
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md">
          <EmailVerification
            email={email}
            onBack={onBack}
            onSuccess={onSuccess}
            onEditInfo={onEditInfo}
          />
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailAddressPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-white">Loading…</div>}>
      <VerifyContent />
    </Suspense>
  );
}