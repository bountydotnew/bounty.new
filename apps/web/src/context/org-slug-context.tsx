'use client';

import { createContext, useContext, useMemo } from 'react';

interface OrgSlugContextValue {
  /** The org slug from the URL parameter */
  slug: string;
}

const OrgSlugContext = createContext<OrgSlugContextValue | null>(null);

export function OrgSlugProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const value = useMemo(() => ({ slug }), [slug]);
  return (
    <OrgSlugContext.Provider value={value}>
      {children}
    </OrgSlugContext.Provider>
  );
}

/**
 * Get the org slug from the URL.
 * Only available inside /[slug]/* routes.
 * Returns null if not inside an org-scoped route.
 */
export function useOrgSlug(): string | null {
  const ctx = useContext(OrgSlugContext);
  return ctx?.slug ?? null;
}
