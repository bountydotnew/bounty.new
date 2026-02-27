import { db } from '@bounty/db';
import type { Metadata } from 'next';
import { baseUrl } from '@bounty/ui/lib/constants';
import { createServerCaller } from '@bounty/api/src/server-caller';
import ProfilePageClient from './page.client';
import type { ProfileData } from './hooks/use-profile-data';

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
    title: `@${profileUser.handle || displayName} — bounty`,
    description: `View ${displayName}'s profile on bounty.new`,
    openGraph: {
      title: `@${profileUser.handle || displayName} — bounty`,
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
  let initialData: ProfileData | null = null;
  try {
    const caller = await createServerCaller();
    const apiResponse = await caller.profiles.getProfile({ handle: userId });
    
    // Transform API response to ProfileData format
    if (apiResponse) {
      initialData = {
        user: {
          id: apiResponse.data.user.id,
          name: apiResponse.data.user.name,
          handle: apiResponse.data.user.handle ?? null,
          email: apiResponse.data.user.email ?? null,
          image: apiResponse.data.user.image,
          createdAt: String(apiResponse.data.user.createdAt),
          isProfilePrivate: apiResponse.data.user.isProfilePrivate ?? false,
        },
        profile: apiResponse.data.profile as ProfileData['profile'],
        reputation: apiResponse.data.reputation as ProfileData['reputation'],
        isPrivate: apiResponse.isPrivate ?? false,
      };
    }
  } catch {
    // If prefetch fails, client will fetch - no big deal
  }

  return <ProfilePageClient initialData={initialData} />;
}
