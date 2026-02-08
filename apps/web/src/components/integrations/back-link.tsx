'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useOrgSlug } from '@/context/org-slug-context';

interface BackLinkProps {
  href?: string;
  label?: string;
}

export function BackLink({ href, label = 'Integrations' }: BackLinkProps) {
  const orgSlug = useOrgSlug();
  const resolvedHref = href ?? (orgSlug ? `/${orgSlug}/integrations` : '/integrations');

  return (
    <Link
      href={resolvedHref}
      className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-foreground w-fit"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
