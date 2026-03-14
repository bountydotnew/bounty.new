'use client';

import { useQuery } from 'convex/react';
import { api } from '@/utils/convex';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RawProfileResponse = any;

interface UseProfileDataProps {
  handle: string;
  enabled: boolean;
  initialData?: ProfileData;
  serverData?: RawProfileResponse;
}

interface UseProfileDataReturn {
  data: ProfileData | null;
  isLoading: boolean;
  isError: boolean;
}

export function useProfileData({
  handle,
  enabled,
  initialData,
  serverData,
}: UseProfileDataProps): UseProfileDataReturn {
  const queryResult = useQuery(
    api.functions.profiles.getProfile,
    enabled ? { handle } : 'skip'
  );

  // Transform API response to ProfileData format
  // API returns { success, data: { user, profile, reputation }, isPrivate }
  const transformedData: ProfileData | null = queryResult
    ? {
        user: {
          id: queryResult.data.user.id,
          name: queryResult.data.user.name,
          handle:
            (queryResult.data.user as { handle?: string | null }).handle ??
            null,
          email: queryResult.data.user.email ?? null,
          image: queryResult.data.user.image,
          createdAt: String(queryResult.data.user.createdAt),
          isProfilePrivate:
            (queryResult.data.user as { isProfilePrivate?: boolean })
              .isProfilePrivate ?? false,
        },
        profile: queryResult.data.profile as ProfileData['profile'],
        reputation: queryResult.data.reputation as ProfileData['reputation'],
        isPrivate: queryResult.isPrivate ?? false,
      }
    : (initialData ?? null);

  return {
    data: transformedData,
    isLoading: queryResult === undefined,
    isError: false, // Convex queries don't have an isError state in the same way; errors throw
  };
}
