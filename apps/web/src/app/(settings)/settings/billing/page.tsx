'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveOrg } from '@/hooks/use-active-org';
import { useSession } from '@/context/session-context';

/**
 * Redirect from legacy /settings/billing to /{slug}/settings/billing.
 * Billing is now org-scoped.
 */
export default function BillingSettingsRedirect() {
  const router = useRouter();
  const { activeOrgSlug, isLoading } = useActiveOrg();
  const { isPending: isSessionLoading } = useSession();

  useEffect(() => {
    // Wait for both session and org data to load before redirecting
    if (isLoading || isSessionLoading) return;
    if (activeOrgSlug) {
      router.replace(`/${activeOrgSlug}/settings/billing`);
    } else {
      router.replace('/dashboard');
    }
  }, [activeOrgSlug, isLoading, isSessionLoading, router]);

  return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" />
    </div>
  );
}
