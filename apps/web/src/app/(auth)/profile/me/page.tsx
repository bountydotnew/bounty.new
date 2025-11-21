'use client';

import { authClient } from '@bounty/auth/client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@bounty/ui';

export default function MyProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (!isPending) {
      if (session?.user?.id) {
        router.replace(`/profile/${session.user.id}`);
      } else {
        router.push('/');
      }
    }
  }, [session, isPending, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner />
    </div>
  );
}

