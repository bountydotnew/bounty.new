import type {
  XGetTweetsByIdsParams,
  XTweetListResponse,
} from './types'

export const xGetTweetsByIdsTool = {
  id: 'x.get_tweets_by_ids',
  description: 'Get tweets by their IDs (comma-separated)',
  request: {
    url: (params: XGetTweetsByIdsParams) => {
      const queryParams = new URLSearchParams({
        ids: params.ids.trim(),
        expansions:
          'author_id,referenced_tweets.id,attachments.media_keys,attachments.poll_ids',
        'tweet.fields':
          'created_at,conversation_id,in_reply_to_user_id,attachments,context_annotations,public_metrics,referenced_tweets',
        'user.fields':
          'name,username,description,profile_image_url,verified,public_metrics',
      })

      return `https://api.x.com/2/tweets?${queryParams.toString()}`
    },
    method: 'GET' as const,
    headers: (params: XGetTweetsByIdsParams) => ({
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

export type { XGetTweetsByIdsParams, XTweetListResponse }
