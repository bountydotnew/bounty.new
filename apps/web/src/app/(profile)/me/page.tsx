'use client';

import { useSession } from '@/context/session-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Spinner } from '@bounty/ui';
import { useUser } from '@/context/user-context';

export default function MyProfilePage() {
  const router = useRouter();
  const { session, isPending } = useSession();
  const { user: userData } = useUser();

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (!session?.user) {
      router.push('/');
      return;
    }

    if (userData?.handle) {
      // Redirect to handle-based profile URL
      router.replace(`/u/${userData.handle}`);
    } else if (userData?.id) {
      // Fallback to userId if no handle (shouldn't happen after onboarding, but just in case)
      router.replace(`/u/${userData.id}`);
    }
  }, [session, isPending, userData, router]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <Spinner />
    </div>
  );
}
