'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useIntegrations } from '@/hooks/use-integrations';
import type React from 'react';
import { LinearTabBar } from '@/components/integrations/linear';
import { LinearSkeleton } from '@/app/[slug]/components/linear-skeleton';
import { useOrgPath } from '@/hooks/use-org-path';

export default function LinearLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const slug = params.slug as string;
  const orgPath = useOrgPath();
  const { linearWorkspace, hasLinear } = useIntegrations();

  useEffect(() => {
    // If we're at the root /{slug}/integrations/linear and have a workspace, redirect to workspace-specific route
    if (
      pathname === `/${slug}/integrations/linear` &&
      hasLinear &&
      linearWorkspace
    ) {
      router.replace(orgPath(`/integrations/linear/${linearWorkspace.id}`));
    }
  }, [pathname, slug, hasLinear, linearWorkspace, router, orgPath]);

  return (
    <>
      {/* Tab bar navigation */}
      <LinearTabBar />

      {/* Content */}
      <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
          <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
            <Suspense fallback={<LinearSkeleton />}>{children}</Suspense>
          </div>
        </div>
      </div>
    </>
  );
}
