/**
 * Bounty webhook handler for X mentions
 *
 * THE FLOW:
 * 1. Original tweet: "$1000 bounty: fix my landing page" (no bot tag needed)
 * 2. Someone replies: "@bountydotnew"
 * 3. Bot creates bounty from parent tweet and replies with URL + funding instructions
 *
 * The X integration is primarily for identifying users - linking their X account
 * to Bounty so the bot knows who they are for bounty creation.
 */

import type { XTweet, XUser } from './types'

export interface BountyWebhookEvent {
  tweet: XTweet
  user: XUser
}

export interface ParsedBounty {
  title: string
  description: string
  amount: string
  currency: string
  originalText: string
}

export interface CreateBountyOptions {
  parentTweetId: string
  parentTweetText: string
  parentTweetAuthorUsername: string
  parentTweetAuthorId: string
  nominatedByUserId?: string
  nominatedByUsername?: string
  parsedBounty: ParsedBounty
}

export interface CreateBountyResult {
  success: boolean
  bountyId?: string
  bountyUrl?: string
  error?: string
}

// Pattern to match amounts like $1000, $1.5k, $100, etc.
// Order matters - check for "k" suffix patterns first
const AMOUNT_PATTERN = /\$(?:\d+(?:\.\d+)?[kK]|[kK]?\d{1,3}(?:,\d{3})*(?:\.\d+)?)/gi
// Pattern to match "bounty:" prefix
const BOUNTY_PREFIX = /bounty:\s*/i
// Pattern to match @mentions
const MENTION_PATTERN = /@\w+/g

/**
 * Parse amount string to numeric value
 * Examples: "$1000" -> "1000", "$1.5k" -> "1500", "$100" -> "100"
 */
function parseAmountString(amountStr: string): number {
  const cleaned = amountStr.replace(/\$/g, '').toLowerCase().trim()

  // Handle "k" suffix (thousands)
  if (cleaned.endsWith('k')) {
    const num = parseFloat(cleaned.slice(0, -1))
    return num * 1000
  }

  return parseFloat(cleaned.replace(/,/g, '')) || 0
}

/**
 * Extract amount from tweet text
 * Looks for patterns like "$1000", "$1.5k", etc.
 */
function extractAmount(text: string): { amount: string; currency: string } | null {
  const matches = text.match(AMOUNT_PATTERN)

  if (matches && matches.length > 0) {
    const amountStr = matches[0]
    const amount = parseAmountString(amountStr)

    if (amount > 0) {
      return {
        amount: amount.toString(),
        currency: 'USD',
      }
    }
  }

  return null
}

/**
 * Extract title from tweet text
 * Takes the first sentence or first ~100 characters
 */
function extractTitle(text: string): string {
  // Remove "bounty:" prefix
  let cleaned = text.replace(BOUNTY_PREFIX, '')

  // Remove @mentions for cleaner title
  cleaned = cleaned.replace(MENTION_PATTERN, '').trim()

  // Split into words and take first 10-15 words as title
  const words = cleaned.split(/\s+/).slice(0, 15)
  let title = words.join(' ')

  // Try to end at a natural sentence boundary
  const lastPunctuation = Math.max(
    title.lastIndexOf('.'),
    title.lastIndexOf('!'),
    title.lastIndexOf('?')
  )
  if (lastPunctuation > 20 && lastPunctuation < title.length - 5) {
    // Only truncate if punctuation is not at the very end
    title = title.slice(0, lastPunctuation + 1)
  }

  // Limit to 200 characters
  if (title.length > 200) {
    title = title.slice(0, 197) + '...'
  }

  return title.trim()
}

/**
 * Main function to parse a tweet into bounty details
 */
export function parseTweet(tweetText: string): ParsedBounty | null {
  const text = tweetText.trim()

  if (!text) {
    return null
  }

  // Check if this looks like a bounty tweet (has amount indicator)
  const amountInfo = extractAmount(text)
  if (!amountInfo) {
    return null
  }

  const title = extractTitle(text)
  const description = text.replace(BOUNTY_PREFIX, '').trim()

  return {
    title,
    description: description.slice(0, 5000),
    amount: amountInfo.amount,
    currency: amountInfo.currency,
    originalText: text,
  }
}

/**
 * Check if a tweet contains bounty information (amount pattern)
 * This is used to check if the parent tweet is a bounty
 * Does NOT require bot mention or "bounty:" prefix - just looks for amount
 */
export function looksLikeBounty(tweetText: string): boolean {
  const text = tweetText.trim()
  if (!text) {
    return false
  }
  const amountInfo = extractAmount(text)
  return amountInfo !== null
}

/**
 * Parse X webhook payload into BountyWebhookEvent[]
 * Handles various X webhook payload formats
 */
export function parseXWebhookPayload(payload: any): BountyWebhookEvent[] {
  const events: BountyWebhookEvent[] = []

  // Try different payload formats from X API
  const mentionEvents =
    payload.tweet_create_events ||
    payload.mention_events ||
    payload.events ||
    payload.for_user_tweet_events?.[0]?.tweet_create_events

  if (!mentionEvents || mentionEvents.length === 0) {
    return events
  }

  for (const event of mentionEvents) {
    const tweet = event.tweet || event
    const user = event.user || event.includes?.users?.[0]

    if (!tweet || !tweet.id || !user) {
      continue
    }

    events.push({
      tweet: {
        id: tweet.id,
        text: tweet.text,
        createdAt: tweet.created_at || new Date().toISOString(),
        authorId: tweet.author_id || user.id,
        conversationId: tweet.conversation_id,
        inReplyToTweetId: tweet.in_reply_to_tweet_id,
        referencedTweets: tweet.referenced_tweets,
      },
      user: {
        id: user.id,
        username: user.username || user.screen_name,
        name: user.name,
        verified: user.verified || false,
        metrics: {
          followersCount: user.public_metrics?.followers_count || 0,
          followingCount: user.public_metrics?.following_count || 0,
          tweetCount: user.public_metrics?.tweet_count || 0,
        },
      },
    })
  }

  return events
}

/**
 * Store tweet ID in repositoryUrl format
 */
export function tweetIdToRepositoryUrl(tweetId: string): string {
  return `x://${tweetId}`
}

/**
 * Extract tweet ID from repositoryUrl format
 */
export function repositoryUrlToTweetId(repositoryUrl: string): string | null {
  if (repositoryUrl?.startsWith('x://')) {
    return repositoryUrl.slice(3)
  }
  return null
}

/**
 * Check if a tweet is a bounty nomination request
 * This is when someone replies to ANY tweet and ONLY tags the bot
 *
 * Example:
 * Original tweet: "$1000 bounty: fix my landing page"
 * Reply (tags bot): "@bountydotnew"
 *
 * The reply text should ONLY contain the bot mention (or minimal text around it)
 */
export function isBountyNomination(tweet: XTweet, botUsername: string): boolean {
  // Must be a reply
  if (!tweet.inReplyToTweetId && (!tweet.referencedTweets || tweet.referencedTweets.length === 0)) {
    return false
  }

  // Bot must be mentioned in the reply
  const lowerText = tweet.text.toLowerCase()
  if (!lowerText.includes(`@${botUsername.toLowerCase()}`)) {
    return false
  }

  return true
}

/**
 * Get the parent tweet ID from a reply tweet
 */
export function getParentTweetId(tweet: XTweet): string | null {
  // First check in_reply_to_tweet_id
  if (tweet.inReplyToTweetId) {
    return tweet.inReplyToTweetId
  }

  // Then check referenced_tweets for replied_to type
  const referencedTweets = tweet.referencedTweets
  if (referencedTweets && referencedTweets.length > 0) {
    const repliedTo = referencedTweets.find((rt) => rt.type === 'replied_to')
    if (repliedTo) {
      return repliedTo.id
    }
    // Fallback to first referenced tweet
    const first = referencedTweets[0]
    return first?.id || null
  }

  return null
}

/**
 * Generate reply text for a created bounty from nomination
 *
 * Flow:
 * - Original tweet author (theo) posts bounty-like tweet
 * - Someone replies with @bountydotnew
 * - Bot creates bounty and replies with this message
 */
export function generateBountyReply(
  bountyUrl: string,
  originalAuthorUsername: string,
  isAuthorLinked: boolean,
  nominatedByUsername?: string
): string {
  let reply = `🎯 Bounty created!

${bountyUrl}

`

  if (!isAuthorLinked) {
    reply += `⚠️ @${originalAuthorUsername} - link your X account on bounty.new to fund and manage this bounty.

`
  } else {
    reply += `💰 @${originalAuthorUsername} - fund this bounty to get started!

`
  }

  if (nominatedByUsername && nominatedByUsername !== originalAuthorUsername) {
    reply += `Nominated by @${nominatedByUsername}.`
  }

  return reply.trim()
}

/**
 * Generate reply when parent tweet doesn't look like a bounty
 */
export function generateNotABountyReply(): string {
  return `❌ That tweet doesn't look like a bounty.

Make sure the original tweet includes an amount like $100, $1.5k, etc.`
}

/**
 * Generate reply when bounty already exists for this tweet
 */
export function generateBountyExistsReply(bountyUrl: string): string {
  return `ℹ️ A bounty already exists for this tweet!

${bountyUrl}`
}
