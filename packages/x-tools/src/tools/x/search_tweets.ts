import type {
  XSearchTweetsParams,
  XTweetListResponse,
} from './types'

export const xSearchTweetsTool = {
  id: 'x.search_tweets',
  description: 'Search for tweets on X matching a query',
  request: {
    url: (params: XSearchTweetsParams) => {
      const queryParams = new URLSearchParams({
        query: params.query.trim(),
        'tweet.fields':
          'created_at,conversation_id,in_reply_to_user_id,attachments,context_annotations,public_metrics,referenced_tweets',
        expansions: 'author_id,referenced_tweets.id,attachments.media_keys',
        'user.fields': 'name,username,description,profile_image_url,verified,public_metrics',
        max_results: (params.maxResults || 10).toString(),
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

      if (params.sortOrder) {
        queryParams.append('sort_order', params.sortOrder)
      }

      if (params.nextToken) {
        queryParams.append('next_token', params.nextToken)
      }

      return `https://api.x.com/2/tweets/search/recent?${queryParams.toString()}`
    },
    method: 'GET' as const,
    headers: (params: XSearchTweetsParams) => ({
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

export type { XSearchTweetsParams, XTweetListResponse }
