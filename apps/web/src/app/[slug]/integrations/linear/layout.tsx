'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useIntegrations } from '@/hooks/use-integrations';
import type React from 'react';
import { LinearSidebar } from '@/components/integrations/linear';
import { Header } from '@/components/dual-sidebar/sidebar-header';
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
    <LinearSidebar>
      <Header />
      <div className="flex min-h-[calc(100vh-72px)] flex-col bg-background min-w-0 overflow-x-hidden">
        {/* Horizontal border line at top */}
        <div className="h-px w-full shrink-0 bg-surface-3" />

        {/* Main content with vertical borders */}
        <div className="flex flex-1 shrink-0 flex-col w-full overflow-hidden lg:max-w-[805px] xl:px-0 xl:border-x border-border-subtle mx-auto py-4 min-w-0">
          <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
            <div className="relative flex flex-col pb-10 px-4 w-full min-w-0">
              <Suspense fallback={<LinearSkeleton />}>{children}</Suspense>
            </div>
          </div>
        </div>
      </div>
    </LinearSidebar>
  );
}
