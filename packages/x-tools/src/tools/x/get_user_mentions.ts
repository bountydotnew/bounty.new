import type {
  XGetUserMentionsParams,
  XTweetListResponse,
} from './types'

export const xGetUserMentionsTool = {
  id: 'x.get_user_mentions',
  description: 'Get tweets mentioning a specific user',
  request: {
    url: (params: XGetUserMentionsParams) => {
      const queryParams = new URLSearchParams({
        'tweet.fields':
          'created_at,conversation_id,in_reply_to_user_id,attachments,context_annotations,public_metrics,referenced_tweets',
        expansions: 'author_id,referenced_tweets.id,attachments.media_keys',
        'user.fields': 'name,username,description,profile_image_url,verified,public_metrics',
        max_results: (params.maxResults || 100).toString(),
      })

      if (params.startTime) {
        queryParams.append('start_time', params.startTime)
      }

      if (params.endTime) {
        queryParams.append('end_time', params.endTime)
      }

      if (params.sinceId) {
        queryParams.append('since_id', params.sinceId)
      }

      if (params.untilId) {
        queryParams.append('until_id', params.untilId)
      }

      if (params.paginationToken) {
        queryParams.append('pagination_token', params.paginationToken)
      }

      return `https://api.x.com/2/users/${params.userId}/mentions?${queryParams.toString()}`
    },
    method: 'GET' as const,
    headers: (params: XGetUserMentionsParams) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },
  parse: async (response: Response): Promise<XTweetListResponse> => {
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
        tweets: json.data || [],
        includes: json.includes
          ? {
              users: json.includes.users || [],
              media: json.includes.media || undefined,
              polls: json.includes.polls || undefined,
            }
          : undefined,
        meta: {
          resultCount: json.meta?.result_count || 0,
          newestId: json.meta?.newest_id || null,
          oldestId: json.meta?.oldest_id || null,
          nextToken: json.meta?.next_token || null,
          previousToken: json.meta?.previous_token || null,
        },
      },
    }
  },
}

export type { XGetUserMentionsParams, XTweetListResponse }
