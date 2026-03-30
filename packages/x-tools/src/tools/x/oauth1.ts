/**
 * OAuth 1.0a signature generation for X API
 * Used for posting tweets and other write operations
 */

export interface OAuth1Credentials {
  consumerKey: string
  consumerSecret: string
  accessToken: string
  accessSecret: string
}

/**
 * Generate OAuth 1.0a signature
 */
export function generateOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  credentials: OAuth1Credentials
): string {
  const crypto = require('crypto')

  // Encode parameters
  const encodedParams = Object.keys(params)
    .sort()
    .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')

  // Create signature base string
  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(encodedParams)}`

  // Create signing key
  const signingKey = `${encodeURIComponent(credentials.consumerSecret)}&${encodeURIComponent(credentials.accessSecret)}`

  // Generate signature
  const hmac = crypto.createHmac('sha1', signingKey)
  hmac.update(signatureBaseString)
  return hmac.digest('base64')
}

/**
 * Generate OAuth 1.0a Authorization header
 */
export function generateOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string> = {},
  credentials: OAuth1Credentials
): string {
  const crypto = require('crypto')
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = crypto.randomBytes(16).toString('hex')

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: credentials.consumerKey,
    oauth_token: credentials.accessToken,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_nonce: nonce,
    oauth_version: '1.0',
  }

  const signature = generateOAuthSignature(method, url, { ...params, ...oauthParams }, credentials)

  const oauthHeader = Object.entries({
    ...oauthParams,
    oauth_signature: signature,
  })
    .map(([key, value]) => `${key}="${encodeURIComponent(value)}"`)
    .join(', ')

  return `OAuth ${oauthHeader}`
}

/**
 * Make an authenticated request to X API using OAuth 1.0a
 */
export async function xApiRequestOAuth<T>(
  method: string,
  endpoint: string,
  credentials: OAuth1Credentials,
  params: Record<string, string> = {},
  body?: any
): Promise<T> {
  const baseUrl = 'https://api.x.com'
  const url = new URL(endpoint, baseUrl)

  // Add query parameters for GET requests
  if (method === 'GET' && Object.keys(params).length > 0) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value || '')
    })
  }

  const headers: Record<string, string> = {
    Authorization: generateOAuthHeader(method, url.toString(), {}, credentials),
  }

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`X API error: ${response.status} ${errorText}`)
  }

  return response.json()
}
