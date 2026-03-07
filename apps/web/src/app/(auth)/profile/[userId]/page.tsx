import { cache } from 'react';
import type { Metadata } from 'next';
import { baseUrl } from '@bounty/ui/lib/constants';
import { createServerCaller } from '@bounty/api/src/server-caller';
import ProfilePageClient from './page.client';
import type { ProfileData } from './hooks/use-profile-data';

const getProfileData = cache(async (handle: string) => {
  try {
    const caller = await createServerCaller();
    return await caller.profiles.getProfile({ handle });
  } catch {
    return null;
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  const profileResponse = await getProfileData(userId);

  if (!profileResponse) {
    return {
      title: 'User Not Found',
      description: 'The requested user profile could not be found.',
    };
  }

  const profileUser = profileResponse.data.user;
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

  const apiResponse = await getProfileData(userId);

  let initialData: ProfileData | null = null;
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

  return <ProfilePageClient initialData={initialData} serverData={apiResponse} />;
}
