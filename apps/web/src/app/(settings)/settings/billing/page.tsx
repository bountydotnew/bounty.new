'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useActiveOrg } from '@/hooks/use-active-org';

/**
 * Redirect from legacy /settings/billing to /{slug}/settings/billing.
 * Billing is now org-scoped.
 */
export default function BillingSettingsRedirect() {
  const router = useRouter();
  const { activeOrgSlug, isLoading } = useActiveOrg();

  useEffect(() => {
    if (isLoading) return;
    if (activeOrgSlug) {
      router.replace(`/${activeOrgSlug}/settings/billing`);
    } else {
      router.replace('/dashboard');
    }
  }, [activeOrgSlug, isLoading, router]);

  return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-border-subtle border-t-foreground" />
    </div>
  );
}
