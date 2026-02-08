'use client';

import { useParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Returns a function that generates org-scoped paths using the current
 * [slug] from the URL params.
 *
 * Usage inside any /[slug]/* route:
 *   const orgPath = useOrgPath();
 *   orgPath('/integrations')          => '/my-team/integrations'
 *   orgPath('/integrations/discord')  => '/my-team/integrations/discord'
 *   orgPath('/settings/billing')      => '/my-team/settings/billing'
 */
export function useOrgPath() {
  const params = useParams();
  const slug = params.slug as string;

  return useCallback(
    (path: string) => {
      if (!slug) return path;
      return `/${slug}${path.startsWith('/') ? path : `/${path}`}`;
    },
    [slug]
  );
}
