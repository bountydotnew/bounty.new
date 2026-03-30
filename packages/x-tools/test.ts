/**
 * Test file for X-tools package
 * Usage: bun run test.ts
 */

// Load .env file
import { config } from 'dotenv'
config({ path: new URL('.env', import.meta.url) })

import {
  xCreateTweetTool,
  xSearchTweetsTool,
  parseTweet,
  looksLikeBounty,
  isBountyNomination,
  getParentTweetId,
  generateBountyReply,
  generateNotABountyReply,
  generateBountyExistsReply,
  executeXTool,
  type XCreateTweetParams,
  type XTweet,
} from './src/index'
import { xApiRequestOAuth } from './src/tools/x/oauth1'

// Your X API Access Token
// Get one from: https://developer.x.com/en/portal/dashboard
// Set via: X_ACCESS_TOKEN=xxx bun run test.ts
const X_BEARER_TOKEN = process.env.X_BEARER_TOKEN
const X_ACCESS_TOKEN = process.env.X_ACCESS_TOKEN
const X_ACCESS_TOKEN_SECRET = process.env.X_ACCESS_TOKEN_SECRET
const X_API_KEY = process.env.X_API_KEY
const X_API_KEY_SECRET = process.env.X_API_KEY_SECRET

async function testCreateTweet() {
  console.log('\nTesting create tweet with OAuth 1.0a...')

  // Validate OAuth 1.0a credentials are present
  if (!X_API_KEY || !X_API_KEY_SECRET || !X_ACCESS_TOKEN || !X_ACCESS_TOKEN_SECRET) {
    console.error('❌ Missing OAuth 1.0a credentials:')
    console.log(`   X_API_KEY: ${X_API_KEY ? '✅' : '❌'}`)
    console.log(`   X_API_KEY_SECRET: ${X_API_KEY_SECRET ? '✅' : '❌'}`)
    console.log(`   X_ACCESS_TOKEN: ${X_ACCESS_TOKEN ? '✅' : '❌'}`)
    console.log(`   X_ACCESS_TOKEN_SECRET: ${X_ACCESS_TOKEN_SECRET ? '✅' : '❌'}`)
    console.log('\n   Get these from: https://developer.x.com/en/portal/dashboard')
    console.log('   Go to your app → Settings → Authentication tokens')
    return
  }

  try {
    const result = await xApiRequestOAuth<{ data: { id: string; text: string } }>(
      'POST',
      '/2/tweets',
      {
        consumerKey: X_API_KEY,
        consumerSecret: X_API_KEY_SECRET,
        accessToken: X_ACCESS_TOKEN,
        accessSecret: X_ACCESS_TOKEN_SECRET,
      },
      {},
      {
        text: 'Testing bounty.new x-tools OAuth 1.0a! 🎯',
      }
    )

    console.log('✅ Tweet created!')
    console.log(`   ID: ${result.data.id}`)
    console.log(`   Text: ${result.data.text}`)
    console.log(`   URL: https://x.com/i/status/${result.data.id}`)
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  }
}

async function testSearchTweets() {
  console.log('\nTesting search tweets...')

  if (!X_BEARER_TOKEN) {
    console.error('❌ Missing X_BEARER_TOKEN')
    return
  }

  const params = {
    accessToken: X_BEARER_TOKEN,
    query: 'bounty $100',
    maxResults: 10,
  }

  const result = await executeXTool(xSearchTweetsTool, params)

  if (result.error) {
    console.error('❌ Error:', result.error)
  } else {
    console.log(`✅ Found ${result.data.tweets.length} tweets`)
    result.data.tweets.forEach((tweet) => {
      console.log(`  - @${tweet.authorId}: ${tweet.text.slice(0, 50)}...`)
    })
  }

  return result
}

async function testBountyParsing() {
  console.log('\nTesting bounty parsing...')

  const testTweets = [
    '$1000 bounty: fix my landing page',
    'build a dark mode toggle $500',
    '$1.5k for a complete website redesign',
    'just a random tweet',
    'need help with something',
  ]

  testTweets.forEach((tweet) => {
    console.log(`\nTweet: "${tweet}"`)

    const isBounty = looksLikeBounty(tweet)
    console.log(`  Looks like bounty: ${isBounty}`)

    if (isBounty) {
      const parsed = parseTweet(tweet)
      if (parsed) {
        console.log(`  Title: ${parsed.title}`)
        console.log(`  Amount: $${parsed.amount} ${parsed.currency}`)
        console.log(`  Description: ${parsed.description.slice(0, 50)}...`)
      }
    }
  })
}

async function testNominationFlow() {
  console.log('\nTesting nomination flow...')

  // Test 1: Check if a tweet looks like a bounty
  const bountyTweets = [
    { text: '$1000 bounty: fix my landing page', expected: true },
    { text: 'build a dark mode toggle $500', expected: true },
    { text: 'just a random tweet', expected: false },
    { text: 'create a logo $2.5k', expected: true },
    { text: 'need help with something', expected: false },
  ]

  console.log('Testing looksLikeBounty:')
  bountyTweets.forEach(({ text, expected }) => {
    const result = looksLikeBounty(text)
    const status = result === expected ? '✅' : '❌'
    console.log(`  ${status} "${text}" -> ${result} (expected: ${expected})`)
  })

  // Test 2: Check nomination detection
  console.log('\nTesting nomination detection:')

  const nominationTweet: XTweet = {
    id: '123',
    text: '@bountydotnew',
    createdAt: new Date().toISOString(),
    authorId: 'user2',
    conversationId: '456',
    inReplyToTweetId: '789', // This is a reply
  }

  const isNomination = isBountyNomination(nominationTweet, 'bountydotnew')
  console.log(`  ${isNomination ? '✅' : '❌'} Reply with bot mention is nomination: ${isNomination}`)

  // Test 3: Get parent tweet ID
  console.log('\nTesting parent tweet ID extraction:')
  const parentId = getParentTweetId(nominationTweet)
  console.log(`  ${parentId === '789' ? '✅' : '❌'} Parent ID extracted: ${parentId}`)

  // Test 4: Generate bounty reply (author linked)
  console.log('\nTesting bounty reply generation (author linked):')
  const linkedReply = generateBountyReply(
    'https://bounty.new/bounty/abc123',
    'theo',
    true,
    'nominator'
  )
  console.log('  ' + linkedReply.split('\n').join('\n  '))

  // Test 5: Generate bounty reply (author NOT linked)
  console.log('\nTesting bounty reply generation (author NOT linked):')
  const notLinkedReply = generateBountyReply(
    'https://bounty.new/bounty/xyz',
    'theo',
    false
  )
  console.log('  ' + notLinkedReply.split('\n').join('\n  '))

  // Test 6: Not a bounty reply
  console.log('\nTesting not-a-bounty reply:')
  const notABountyReply = generateNotABountyReply()
  console.log('  ' + notABountyReply.split('\n').join('\n  '))

  // Test 7: Bounty exists reply
  console.log('\nTesting bounty-exists reply:')
  const existsReply = generateBountyExistsReply('https://bounty.new/bounty/existing')
  console.log('  ' + existsReply.split('\n').join('\n  '))
}

// Run all tests
async function main() {
  console.log('=== X-Tools Package Tests ===\n')

  // Test parsing functions (don't need API access)
  await testBountyParsing()
  await testNominationFlow()

  // Tests that require API access
  if (X_BEARER_TOKEN) {
    // Search tweets (read operation - works with Bearer Token)
    await testSearchTweets()

    // Validate OAuth 1.0a credentials
    await testCreateTweet()
  } else {
    console.log('\n⚠️  Skipping API tests (no X_BEARER_TOKEN provided)')
    console.log('   Set X_BEARER_TOKEN environment variable to test API calls')
  }

  console.log('\n=== Tests Complete ===')
}

main().catch(console.error)
