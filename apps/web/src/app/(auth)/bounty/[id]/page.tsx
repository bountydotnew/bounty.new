import { cache } from 'react';
import type { Metadata } from 'next';
import { baseUrl } from '../../../../../../../packages/ui/src/lib/constants';
import { createServerCaller } from '@bounty/api/src/server-caller';
import BountyPage from './page.client';

const getBountyData = cache(async (id: string) => {
  try {
    const caller = await createServerCaller();
    return await caller.bounties.getBountyDetail({ id });
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const bountyData = await getBountyData(id);

  if (!bountyData) {
    return {
      title: 'Bounty Not Found',
      description: 'The requested bounty could not be found.',
    };
  }

  const thisBounty = bountyData.bounty;
  const ogImageUrl = `${baseUrl}/api/og-image/${id}`;

  return {
    title: `"${thisBounty.title}" - bounty`,
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
  const initialData = await getBountyData(id);
  return <BountyPage initialData={initialData} />;
}
