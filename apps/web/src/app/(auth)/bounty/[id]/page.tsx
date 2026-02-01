import { db } from '@bounty/db';
import type { Metadata } from 'next';
import { baseUrl } from '../../../../../../../packages/ui/src/lib/constants';
import { createServerCaller } from '@bounty/api/src/server-caller';
import BountyPage from './page.client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const thisBounty = await db.query.bounty.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
  });

  if (!thisBounty) {
    return {
      title: 'Bounty Not Found',
      description: 'The requested bounty could not be found.',
    };
  }

  const ogImageUrl = `${baseUrl}/api/og-image/${id}`;

  return {
    title: thisBounty.title,
    description: thisBounty.description,
    openGraph: {
      title: thisBounty.title,
      description: thisBounty.description,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: thisBounty.title,
            },
          ]
        : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: thisBounty.title,
      description: thisBounty.description,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Prefetch bounty data on server to avoid client-side waterfall
  let initialData: Awaited<ReturnType<Awaited<ReturnType<typeof createServerCaller>>['bounties']['getBountyDetail']>> | null = null;
  try {
    const caller = await createServerCaller();
    initialData = await caller.bounties.getBountyDetail({ id });
  } catch {
    // If prefetch fails, client will fetch - no big deal
  }

  return <BountyPage initialData={initialData} />;
}
