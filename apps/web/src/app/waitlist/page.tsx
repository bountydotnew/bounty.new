'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function WaitlistPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?waitlist=true');
  }, [router]);

  return null;
}
