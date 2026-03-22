import type {
  XCreateTweetParams,
  XSingleTweetResponse,
} from './types'

export const xCreateTweetTool = {
  id: 'x.create_tweet',
  description: 'Create a new tweet on X',
  request: {
    url: 'https://api.x.com/2/tweets',
    method: 'POST' as const,
    headers: (params: XCreateTweetParams) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
    body: (params: XCreateTweetParams) => {
      const body: Record<string, any> = {
        text: params.text,
      }

      if (params.replyToTweetId) {
        body.reply = {
          in_reply_to_tweet_id: params.replyToTweetId.trim(),
        }
      }

      if (params.quoteTweetId) {
        body.quote_tweet_id = params.quoteTweetId.trim()
      }

      if (params.mediaIds) {
        body.media = {
          media_ids: params.mediaIds.split(',').map((id) => id.trim()),
        }
      }

      if (params.replySettings) {
        body.reply_settings = params.replySettings
      }

      return body
    },
  },
  parse: async (response: Response): Promise<XSingleTweetResponse> => {
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
        tweet: {
          id: json.data.id,
          text: json.data.text,
          createdAt: new Date().toISOString(),
          authorId: '',
        },
      },
    }
  },
}

export type { XCreateTweetParams, XSingleTweetResponse }
