'use node';

/**
 * Linear integration actions — these call the Linear API and require Node.js.
 *
 * Separated from linear.ts because queries/mutations cannot use "use node".
 */
import { action } from '../_generated/server';
import { v, ConvexError } from 'convex/values';

/**
 * Helper: create a Linear SDK client with a user's access token.
 */
async function createLinearClient(accessToken: string) {
  const { LinearClient } = await import('@linear/sdk');
  return new LinearClient({ accessToken });
}

/**
 * Helper: refresh the access token if expired.
 * Returns the current or refreshed token.
 */
async function getAccessToken(
  ctx: any,
  accountId: string
): Promise<string | null> {
  // The access token is stored in Better Auth's account table.
  // We would need to query it via the component adapter.
  // For now, this is a placeholder that returns null.
  // In production, this would:
  // 1. Get the account from Better Auth
  // 2. Check if token is expired
  // 3. Refresh via OAuth if needed
  // 4. Return the valid token
  return null;
}

/**
 * Get Linear workspaces.
 * Replaces: linear.getWorkspaces (orgProcedure query → action)
 */
export const getWorkspaces = action({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // TODO: Get access token from Better Auth account
    // const token = await getAccessToken(ctx, accountId);
    // if (!token) throw new ConvexError('NO_LINEAR_TOKEN');
    // const client = await createLinearClient(token);
    // const org = await client.organization;
    return { workspaces: [] };
  },
});

/**
 * Get Linear issues.
 * Replaces: linear.getIssues (rateLimitedOrgProcedure query → action)
 */
export const getIssues = action({
  args: {
    organizationId: v.optional(v.string()),
    filters: v.optional(v.any()),
    pagination: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with Linear SDK
    return { issues: [], pageInfo: null };
  },
});

/**
 * Get a single Linear issue.
 * Replaces: linear.getIssue (rateLimitedOrgProcedure query → action)
 */
export const getIssue = action({
  args: {
    organizationId: v.optional(v.string()),
    issueId: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with Linear SDK
    return null;
  },
});

/**
 * Get Linear projects.
 * Replaces: linear.getProjects (rateLimitedOrgProcedure query → action)
 */
export const getProjects = action({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return { projects: [] };
  },
});

/**
 * Get Linear workflow states.
 * Replaces: linear.getWorkflowStates (rateLimitedOrgProcedure query → action)
 */
export const getWorkflowStates = action({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return { states: [] };
  },
});

/**
 * Get Linear teams.
 * Replaces: linear.getTeams (rateLimitedOrgProcedure query → action)
 */
export const getTeams = action({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return { teams: [] };
  },
});

/**
 * Get bounty data from a Linear issue.
 * Replaces: linear.getBountyDataFromIssue (rateLimitedOrgProcedure query → action)
 */
export const getBountyDataFromIssue = action({
  args: {
    organizationId: v.optional(v.string()),
    linearIssueId: v.string(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with Linear SDK
    return null;
  },
});

/**
 * Post a comment on a Linear issue.
 * Replaces: linear.postComment (rateLimitedOrgProcedure mutation → action)
 */
export const postComment = action({
  args: {
    organizationId: v.optional(v.string()),
    commentType: v.string(),
    bountyData: v.any(),
  },
  handler: async (ctx, args) => {
    // TODO: Implement with Linear SDK
    // Different comment types: bountyCreated, bountyFunded, submissionReceived, bountyCompleted
    return { success: false, message: 'Not yet implemented' };
  },
});

/**
 * Sync a Linear workspace to the current org.
 * Replaces: linear.syncWorkspace (orgProcedure mutation → action)
 */
export const syncWorkspace = action({
  args: { organizationId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    // TODO: Implement
    // 1. Get access token from Better Auth
    // 2. Fetch workspace info from Linear
    // 3. Upsert linearAccount record via mutation
    return { success: false, message: 'Not yet implemented' };
  },
});
