/**
 * Execute an X API tool request
 * This is a generic helper that follows the sim repo pattern
 */
export async function executeXTool<TParams, TResult>(
  tool: {
    request: {
      url: string | ((params: TParams) => string)
      method: string
      headers: (params: TParams) => Record<string, string>
      body?: (params: TParams) => any
    }
    parse: (response: Response) => Promise<TResult>
  },
  params: TParams
): Promise<TResult> {
  const url =
    typeof tool.request.url === 'function'
      ? tool.request.url(params)
      : tool.request.url

  const headers = tool.request.headers(params)

  const fetchOptions: RequestInit = {
    method: tool.request.method,
    headers,
  }

  if (tool.request.body) {
    fetchOptions.body = JSON.stringify(tool.request.body(params))
  }

  const response = await fetch(url, fetchOptions)
  return tool.parse(response)
}
