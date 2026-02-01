'use client';

import { useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';

export interface ProfileData {
  user: {
    id: string;
    name: string | null;
    handle: string | null;
    email: string | null;
    image: string | null;
    createdAt: string;
    isProfilePrivate: boolean;
  };
  profile: {
    bio: string | null;
    location: string | null;
    website: string | null;
    githubUsername: string | null;
    skills: string[] | null;
  } | null;
  reputation: {
    totalEarned: string | null;
    bountiesCompleted: number | null;
    bountiesCreated: number | null;
  } | null;
  isPrivate: boolean;
}

export interface UseProfileDataProps {
  handle: string;
  enabled: boolean;
  initialData?: ProfileData;
}

export interface UseProfileDataReturn {
  data: ProfileData | null;
  isLoading: boolean;
  isError: boolean;
}

export function useProfileData({
  handle,
  enabled,
  initialData,
}: UseProfileDataProps): UseProfileDataReturn {
  const queryOptions = trpc.profiles.getProfile.queryOptions({ handle });

  const query = useQuery({
    ...queryOptions,
    enabled,
  });

  // Transform API response to ProfileData format
  // API returns { success, data: { user, profile, reputation }, isPrivate }
  const transformedData: ProfileData | null = query.data
    ? {
        user: {
          id: query.data.data.user.id,
          name: query.data.data.user.name,
          handle: (query.data.data.user as { handle?: string | null }).handle ?? null,
          email: query.data.data.user.email ?? null,
          image: query.data.data.user.image,
          createdAt: String(query.data.data.user.createdAt),
          isProfilePrivate: (query.data.data.user as { isProfilePrivate?: boolean }).isProfilePrivate ?? false,
        },
        profile: query.data.data.profile as ProfileData['profile'],
        reputation: query.data.data.reputation as ProfileData['reputation'],
        isPrivate: query.data.isPrivate ?? false,
      }
    : initialData ?? null;

  return {
    data: transformedData,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
