import type { XDeleteTweetParams } from './types'

export const xDeleteTweetTool = {
  id: 'x.delete_tweet',
  description: 'Delete a tweet by ID',
  request: {
    url: (params: XDeleteTweetParams) =>
      `https://api.x.com/2/tweets/${params.tweetId}`,
    method: 'DELETE' as const,
    headers: (params: XDeleteTweetParams) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },
  parse: async (response: Response) => {
    if (!response.ok) {
      const error = await response.text()
      return {
        data: { deleted: false },
        error: `X API error: ${response.status} - ${error}`,
      }
    }

    return {
      data: { deleted: true },
    }
  },
}

export type { XDeleteTweetParams }
