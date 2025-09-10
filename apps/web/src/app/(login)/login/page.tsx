'use client';

import { Suspense } from 'react';
import { useEffect } from 'react';
import { trpc } from '@/utils/trpc';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import Login from '@/components/bounty/login';
import { Spinner } from '@bounty/ui/components/spinner';

function LoginContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('invite');
  const applyInvite = useMutation({
    ...trpc.user.applyInvite.mutationOptions(),
  });
  useEffect(() => {
    if (token) {
      applyInvite.mutate({ token });
    }
  }, [token, applyInvite]);
  // const handleGitHubSignIn = async () => {
  //   try {
  //     const callbackURL = redirectUrl ? `${redirectUrl}` : `${baseUrl}/dashboard`;

  //     await authClient.signIn.social(
  //       {
  //         provider: "github",
  //         callbackURL
  //       },
  //       {
  //         onSuccess: () => {
  //           toast.success("Sign in successful");
  //         },
  //         onError: (error) => {
  //           toast.error(error.error.message || "Sign in failed");
  //         },
  //       }
  //     );
  //   } catch (error) {
  //     toast.error(error instanceof Error ? error.message : "Sign in failed");
  //   }
  // };

  return <Login />;
}

export default function LoginPage() {
  return (
    <div className="mx-auto w-full bg-landing-background">
      {/* <Header /> */}
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Spinner />
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </div>
  );
}
