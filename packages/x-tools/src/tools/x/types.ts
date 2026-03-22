/**
 * Context annotation domain from X API
 */
export interface XContextAnnotationDomain {
  id: string
  name: string
  description?: string
}

/**
 * Context annotation entity from X API
 */
export interface XContextAnnotationEntity {
  id: string
  name: string
  description?: string
}

/**
 * Context annotation from X API - provides semantic context about tweet content
 */
export interface XContextAnnotation {
  domain: XContextAnnotationDomain
  entity: XContextAnnotationEntity
}

/**
 * Tweet object from X API
 */
export interface XTweet {
  id: string
  text: string
  createdAt: string
  authorId: string
  conversationId?: string
  inReplyToUserId?: string
  inReplyToTweetId?: string
  referencedTweets?: Array<{
    type: string
    id: string
  }>
  attachments?: {
    mediaKeys?: string[]
    pollId?: string
  }
  contextAnnotations?: XContextAnnotation[]
  publicMetrics?: {
    retweetCount: number
    replyCount: number
    likeCount: number
    quoteCount: number
  } | undefined
}

export interface XUser {
  id: string
  username: string
  name: string
  description?: string
  profileImageUrl?: string
  verified: boolean
  metrics: {
    followersCount: number
    followingCount: number
    tweetCount: number
  }
}

// Common parameters for all X endpoints
export interface XBaseParams {
  accessToken: string
}

// Write Operation
export interface XWriteParams extends XBaseParams {
  text: string
  replyTo?: string
  mediaIds?: string[]
  poll?: {
    options: string[]
    durationMinutes: number
  }
}

export interface XWriteResponse {
  data: {
    tweet: XTweet
  }
  error?: string
}

// Read Operation
export interface XReadParams extends XBaseParams {
  tweetId: string
  includeReplies?: boolean
}

export interface XReadResponse {
  data: {
    tweet: XTweet
    replies?: XTweet[]
    context?: {
      parentTweet?: XTweet
      rootTweet?: XTweet
    }
  }
  error?: string
}

// Search Operation
export interface XSearchParams extends XBaseParams {
  query: string
  maxResults?: number
  startTime?: string
  endTime?: string
  sortOrder?: 'relevancy' | 'recency'
}

export interface XSearchResponse {
  data: {
    tweets: XTweet[]
    includes?: {
      users: XUser[]
      media: any[]
      polls: any[]
    }
    meta: {
      resultCount: number
      newestId: string
      oldestId: string
      nextToken?: string
    }
  }
  error?: string
}

// User Operation
export interface XUserParams extends XBaseParams {
  username: string
  includeRecentTweets?: boolean
}

export interface XUserResponse {
  data: {
    user: XUser
    recentTweets?: XTweet[]
  }
  error?: string
}

// --- Individual Tool Parameters ---

export interface XSearchTweetsParams extends XBaseParams {
  query: string
  maxResults?: number
  startTime?: string
  endTime?: string
  sinceId?: string
  untilId?: string
  sortOrder?: string
  nextToken?: string
}

export interface XGetUserTweetsParams extends XBaseParams {
  userId: string
  maxResults?: number
  startTime?: string
  endTime?: string
  sinceId?: string
  untilId?: string
  exclude?: string
  paginationToken?: string
}

export interface XGetUserMentionsParams extends XBaseParams {
  userId: string
  maxResults?: number
  startTime?: string
  endTime?: string
  sinceId?: string
  untilId?: string
  paginationToken?: string
}

export interface XGetUserTimelineParams extends XBaseParams {
  userId: string
  maxResults?: number
  startTime?: string
  endTime?: string
  sinceId?: string
  untilId?: string
  exclude?: string
  paginationToken?: string
}

export interface XGetTweetsByIdsParams extends XBaseParams {
  ids: string
}

export interface XGetBookmarksParams extends XBaseParams {
  userId: string
  maxResults?: number
  paginationToken?: string
}

export interface XCreateBookmarkParams extends XBaseParams {
  userId: string
  tweetId: string
}

export interface XDeleteBookmarkParams extends XBaseParams {
  userId: string
  tweetId: string
}

export interface XCreateTweetParams extends XBaseParams {
  text: string
  replyToTweetId?: string
  quoteTweetId?: string
  mediaIds?: string
  replySettings?: string
}

export interface XDeleteTweetParams extends XBaseParams {
  tweetId: string
}

export interface XGetMeParams extends XBaseParams {}

export interface XSearchUsersParams extends XBaseParams {
  query: string
  maxResults?: number
  nextToken?: string
}

export interface XGetFollowersParams extends XBaseParams {
  userId: string
  maxResults?: number
  paginationToken?: string
}

export interface XGetFollowingParams extends XBaseParams {
  userId: string
  maxResults?: number
  paginationToken?: string
}

export interface XManageFollowParams extends XBaseParams {
  userId: string
  targetUserId: string
  action: string
}

export interface XGetBlockingParams extends XBaseParams {
  userId: string
  maxResults?: number
  paginationToken?: string
}

export interface XManageBlockParams extends XBaseParams {
  userId: string
  targetUserId: string
  action: string
}

export interface XGetLikedTweetsParams extends XBaseParams {
  userId: string
  maxResults?: number
  paginationToken?: string
}

export interface XGetLikingUsersParams extends XBaseParams {
  tweetId: string
  maxResults?: number
  paginationToken?: string
}

export interface XManageLikeParams extends XBaseParams {
  userId: string
  tweetId: string
  action: string
}

export interface XManageRetweetParams extends XBaseParams {
  userId: string
  tweetId: string
  action: string
}

export interface XGetRetweetedByParams extends XBaseParams {
  tweetId: string
  maxResults?: number
  paginationToken?: string
}

export interface XGetQuoteTweetsParams extends XBaseParams {
  tweetId: string
  maxResults?: number
  paginationToken?: string
}

export interface XGetTrendsByWoeidParams extends XBaseParams {
  woeid: string
  maxTrends?: number
}

export interface XGetPersonalizedTrendsParams extends XBaseParams {}

export interface XGetUsageParams extends XBaseParams {
  days?: number
}

export interface XHideReplyParams extends XBaseParams {
  tweetId: string
  hidden: boolean
}

export interface XManageMuteParams extends XBaseParams {
  userId: string
  targetUserId: string
  action: string
}

// Common response types
export interface XTweetListResponse {
  data: {
    tweets: XTweet[]
    includes?: {
      users: XUser[]
      media?: any[] | undefined
      polls?: any[] | undefined
    } | undefined
    meta: {
      resultCount: number
      newestId: string | null
      oldestId: string | null
      nextToken: string | null
      previousToken: string | null
    }
  }
  error?: string
}

export interface XUserListResponse {
  data: {
    users: XUser[]
    meta: {
      resultCount: number
      nextToken: string | null
    }
  }
  error?: string
}

export interface XSingleTweetResponse {
  data: {
    tweet: XTweet
    includes?: {
      users: XUser[]
      tweets: XTweet[]
      media?: any[]
    }
  }
  error?: string
}

export interface XSingleUserResponse {
  data: {
    user: XUser
  }
  error?: string
}

/**
 * Transforms raw X API tweet data (snake_case) into the XTweet format (camelCase)
 */
export const transformTweet = (tweet: any): XTweet => ({
  id: tweet.id,
  text: tweet.text,
  createdAt: tweet.created_at,
  authorId: tweet.author_id,
  conversationId: tweet.conversation_id,
  inReplyToUserId: tweet.in_reply_to_user_id,
  inReplyToTweetId: tweet.in_reply_to_tweet_id,
  referencedTweets: tweet.referenced_tweets?.map((rt: any) => ({
    type: rt.type,
    id: rt.id,
  })),
  attachments: {
    mediaKeys: tweet.attachments?.media_keys,
    pollId: tweet.attachments?.poll_ids?.[0],
  },
  contextAnnotations: tweet.context_annotations,
  publicMetrics: tweet.public_metrics
    ? {
        retweetCount: tweet.public_metrics.retweet_count,
        replyCount: tweet.public_metrics.reply_count,
        likeCount: tweet.public_metrics.like_count,
        quoteCount: tweet.public_metrics.quote_count,
      }
    : undefined,
})

/**
 * Transforms raw X API user data (snake_case) into the XUser format (camelCase)
 */
export const transformUser = (user: any): XUser => ({
  id: user.id,
  username: user.username,
  name: user.name || '',
  description: user.description || '',
  profileImageUrl: user.profile_image_url || '',
  verified: !!user.verified,
  metrics: {
    followersCount: user.public_metrics?.followers_count || 0,
    followingCount: user.public_metrics?.following_count || 0,
    tweetCount: user.public_metrics?.tweet_count || 0,
  },
})
