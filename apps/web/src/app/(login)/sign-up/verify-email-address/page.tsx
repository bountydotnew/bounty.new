'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { toast } from 'sonner';
import { queryClient } from '@/utils/trpc';
import { EmailVerification } from '@/components/auth/email-verification';
import { authClient } from '@bounty/auth/client';

function VerifyEmailAddressContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email');
  const code = searchParams.get('code');

  const handleSuccess = async () => {
    toast.success('Email verified successfully!');

    // Force Better Auth to refetch the session
    await authClient.$fetch('/session');

    // Invalidate all related queries
    queryClient.invalidateQueries({ queryKey: ['session'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'getMe'] });
    queryClient.invalidateQueries({ queryKey: ['user', 'getAccessProfile'] });

    // Small delay to ensure session is fully refreshed before redirect
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const handleBack = () => {
    router.push('/login');
  };

  if (!email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111110]">
        <div className="w-full max-w-md space-y-6 p-8 text-center">
          <h1 className="text-2xl font-bold text-white">Email Required</h1>
          <p className="text-gray-400">
            Please provide an email address to verify.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111110]">
      <div className="w-full max-w-md p-8">
        <EmailVerification
          email={email}
          onSuccess={handleSuccess}
          onBack={handleBack}
          initialCode={code || undefined}
        />
      </div>
    </div>
  );
}

export default function VerifyEmailAddressPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#111110]">
          <div className="w-full max-w-md space-y-6 p-8 text-center">
            <h1 className="text-2xl font-bold text-white">Loading...</h1>
            <p className="text-gray-400">
              Please wait while we load the verification page.
            </p>
          </div>
        </div>
      }
    >
      <VerifyEmailAddressContent />
    </Suspense>
  );
}
