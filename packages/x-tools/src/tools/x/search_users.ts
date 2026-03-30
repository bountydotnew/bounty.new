import type {
  XSearchUsersParams,
  XUserListResponse,
} from './types'

export const xSearchUsersTool = {
  id: 'x.search_users',
  description: 'Search for users on X',
  request: {
    url: (params: XSearchUsersParams) => {
      const queryParams = new URLSearchParams({
        query: params.query.trim(),
        'user.fields': 'name,username,description,profile_image_url,verified,public_metrics,created_at',
        max_results: (params.maxResults || 10).toString(),
      })

      if (params.nextToken) {
        queryParams.append('next_token', params.nextToken)
      }

      return `https://api.x.com/2/users/by/search?${queryParams.toString()}`
    },
    method: 'GET' as const,
    headers: (params: XSearchUsersParams) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },
  parse: async (response: Response): Promise<XUserListResponse> => {
    if (!response.ok) {
      const error = await response.text()
      return {
        data: {} as any,
        error: `X API error: ${response.status} - ${error}`,
      }
    }

    const json = await response.json()

    return {
      data: {
        users: json.data || [],
        meta: {
          resultCount: json.meta?.result_count || 0,
          nextToken: json.meta?.next_token || null,
        },
      },
    }
  },
}

export type { XSearchUsersParams, XUserListResponse }
