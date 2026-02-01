import { db } from '@bounty/db';
import type { Metadata } from 'next';
import { baseUrl } from '@bounty/ui/lib/constants';
import { createServerCaller } from '@bounty/api/src/server-caller';
import ProfilePageClient from './page.client';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  // Try to fetch user by handle first, then by userId
  const userData = await db.query.user.findFirst({
    where: (fields, { eq }) => eq(fields.handle, userId.toLowerCase()),
    columns: {
      id: true,
      name: true,
      handle: true,
    },
  });

  // If not found by handle, try by userId
  const userById = userData
    ? null
    : await db.query.user.findFirst({
        where: (fields, { eq }) => eq(fields.id, userId),
        columns: {
          id: true,
          name: true,
          handle: true,
        },
      });

  const profileUser = userData || userById;

  if (!profileUser) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.',
    };
  }

  const displayName = profileUser.name || profileUser.handle || 'User';
  const ogImageUrl = profileUser.handle
    ? `${baseUrl}/api/og-image/profile/${profileUser.handle}`
    : `${baseUrl}/api/og-image/profile/${profileUser.id}`;

  return {
    title: `@${profileUser.handle || profileUser.id} - ${displayName}`,
    description: `View ${displayName}'s profile on bounty.new`,
    openGraph: {
      title: `@${profileUser.handle || profileUser.id} - ${displayName}`,
      description: `View ${displayName}'s profile on bounty.new`,
      images: ogImageUrl
        ? [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: `${displayName}'s profile`,
            },
          ]
        : [],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${profileUser.handle || profileUser.id} - ${displayName}`,
      description: `View ${displayName}'s profile on bounty.new`,
      images: ogImageUrl ? [ogImageUrl] : [],
    },
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  // Prefetch profile data on server to avoid client-side waterfall
  let initialData: Awaited<ReturnType<Awaited<ReturnType<typeof createServerCaller>>['profiles']['getProfile']>> | null = null;
  try {
    const caller = await createServerCaller();
    initialData = await caller.profiles.getProfile({ handle: userId });
  } catch {
    // If prefetch fails, client will fetch - no big deal
  }

  return <ProfilePageClient initialData={initialData} />;
}
