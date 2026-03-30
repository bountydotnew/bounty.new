import type { XGetMeParams, XSingleUserResponse } from './types'

export const xGetMeTool = {
  id: 'x.get_me',
  description: 'Get information about the authenticated user',
  request: {
    url: 'https://api.x.com/2/users/me',
    method: 'GET' as const,
    headers: (params: XGetMeParams) => ({
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    }),
  },
  parse: async (response: Response): Promise<XSingleUserResponse> => {
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
        user: json.data,
      },
    }
  },
}

export type { XGetMeParams, XSingleUserResponse }
