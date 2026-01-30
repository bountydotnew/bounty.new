import { LinearClient } from '@linear/sdk';

/**
 * Linear API driver for bounty.new integration
 *
 * Wraps the Linear SDK to provide methods for:
 * - Fetching issues and projects
 * - Creating comments on issues
 * - Managing workspace connections
 */

export interface LinearIssue {
  id: string;
  identifier: string; // e.g., "ENG-123"
  title: string;
  description: string | null;
  status: {
    id: string;
    name: string;
    color: string;
    type: string;
  };
  priority: number;
  priorityLabel: 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority';
  assignee?: {
    id: string;
    name: string;
    displayName: string;
    avatarUrl?: string;
  } | null;
  project?: {
    id: string;
    name: string;
    url: string;
  } | null;
  url: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface LinearProject {
  id: string;
  name: string;
  url: string;
  description: string | null;
  status: string;
  icon: string | null;
}

export interface LinearWorkspace {
  id: string;
  name: string;
  key: string;
  url: string;
}

export interface LinearUser {
  id: string;
  name: string;
  displayName: string;
  avatarUrl?: string;
  email?: string;
}

/**
 * Bounty comment templates for Linear issues
 */
export const LINEAR_COMMENT_TEMPLATES = {
  bountyCreated: (
    bountyTitle: string,
    amount: string,
    currency: string,
    bountyUrl: string
  ) =>
    `🎯 **Bounty Created**

A bounty has been created for this issue on [bounty.new](${bountyUrl}).

**Title:** ${bountyTitle}
**Amount:** ${amount} ${currency}
**Status:** Awaiting payment

View details: ${bountyUrl}`,

  bountyFunded: (
    amount: string,
    currency: string,
    bountyUrl: string,
    deadline?: string
  ) =>
    `💰 **Bounty Funded**

This bounty is now live and accepting submissions!

**Amount:** ${amount} ${currency}${
      deadline
        ? `
**Deadline:** ${deadline}`
        : ''
    }

View and submit: ${bountyUrl}`,

  submissionReceived: (
    submitter: string,
    timestamp: string,
    bountyUrl: string
  ) =>
    `📥 **New Submission**

A new submission has been received for this bounty.

**Submitted by:** ${submitter}
**Submitted at:** ${timestamp}

View submission: ${bountyUrl}`,

  bountyCompleted: (winner: string, timestamp: string, bountyUrl: string) =>
    `✅ **Bounty Completed**

This bounty has been completed and paid out.

**Completed by:** ${winner}
**Completed at:** ${timestamp}

View details: ${bountyUrl}`,
};

/**
 * Linear API Client wrapper
 */
export class LinearDriver {
  private client: LinearClient;

  constructor(accessToken: string) {
    this.client = new LinearClient({
      accessToken,
    });
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<LinearUser | null> {
    try {
      const viewer = await this.client.viewer;
      if (!viewer) return null;

      return {
        id: viewer.id,
        name: viewer.name ?? '',
        displayName: viewer.displayName ?? '',
        avatarUrl: viewer.avatarUrl ?? undefined,
        email: viewer.email ?? undefined,
      };
    } catch (error) {
      console.error('Failed to fetch Linear user:', error);
      return null;
    }
  }

  /**
   * Get the current workspace (organization)
   */
  async getCurrentWorkspace(): Promise<LinearWorkspace | null> {
    try {
      const org = await this.client.organization;
      if (!org) return null;

      // Construct the workspace URL from the URL key
      const workspaceUrl = org.urlKey
        ? `https://linear.app/${org.urlKey}`
        : 'https://linear.app';

      return {
        id: org.id,
        name: org.name,
        key: org.urlKey ?? '',
        url: workspaceUrl,
      };
    } catch (error) {
      console.error('Failed to fetch Linear workspace:', error);
      return null;
    }
  }

  /**
   * Fetch issues from Linear with optional filters
   */
  async getIssues(filters?: {
    status?: string[];
    priority?: number[];
    assigneeId?: string;
    projectId?: string;
    first?: number;
    after?: string;
  }): Promise<{
    issues: LinearIssue[];
    hasNextPage: boolean;
    endCursor?: string;
  }> {
    try {
      // Build query params without undefined values
      const query: { first?: number; after?: string } = {
        first: filters?.first ?? 50,
      };
      if (filters?.after) query.after = filters.after;

      const connection = await this.client.issues(query);

      const issues: LinearIssue[] = [];
      const nodes = connection?.nodes ?? [];

      for (const issue of nodes) {
        if (!issue) continue;

        // Fetch related data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const issueAny = issue as any;
        const status = issueAny.status ? await issueAny.status : null;
        const assignee = issueAny.assignee ? await issueAny.assignee : null;
        const project = issueAny.project ? await issueAny.project : null;

        // Filter by status and priority after fetching
        if (filters?.status && status && !filters.status.includes(status.id)) {
          continue;
        }
        if (
          filters?.priority &&
          !filters.priority.includes(issue.priority ?? 0)
        ) {
          continue;
        }
        // Filter by assignee
        if (filters?.assigneeId && assignee?.id !== filters.assigneeId) {
          continue;
        }
        // Filter by project
        if (filters?.projectId && project?.id !== filters.projectId) {
          continue;
        }

        issues.push({
          id: issue.id,
          identifier: issue.identifier ?? '',
          title: issue.title,
          description: issue.description ?? null,
          status: {
            id: status?.id ?? '',
            name: status?.name ?? 'Unknown',
            color: status?.color ?? '',
            type: status?.type ?? 'backlog',
          },
          priority: issue.priority ?? 0,
          priorityLabel: this.getPriorityLabel(issue.priority ?? 0),
          assignee: assignee
            ? {
                id: assignee.id,
                name: assignee.name ?? '',
                displayName: assignee.displayName ?? '',
                avatarUrl: assignee.avatarUrl ?? undefined,
              }
            : null,
          project: project
            ? {
                id: project.id,
                name: project.name,
                url: project.url ?? '',
              }
            : null,
          url: issue.url ?? '',
          createdAt: issue.createdAt,
          updatedAt: issue.updatedAt,
        });
      }

      const hasNextPage = connection?.pageInfo?.hasNextPage ?? false;
      const endCursor = connection?.pageInfo?.endCursor ?? undefined;

      const result: {
        issues: LinearIssue[];
        hasNextPage: boolean;
        endCursor?: string;
      } = {
        issues,
        hasNextPage,
      };
      if (endCursor) {
        result.endCursor = endCursor;
      }
      return result;
    } catch (error) {
      console.error('Failed to fetch Linear issues:', error);
      return { issues: [], hasNextPage: false };
    }
  }

  /**
   * Get a single issue by ID
   */
  async getIssue(issueId: string): Promise<LinearIssue | null> {
    try {
      const issue = await this.client.issue(issueId);
      if (!issue) return null;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const issueAny = issue as any;
      const status = issueAny.status ? await issueAny.status : null;
      const assignee = issueAny.assignee ? await issueAny.assignee : null;
      const project = issueAny.project ? await issueAny.project : null;

      return {
        id: issue.id,
        identifier: issue.identifier ?? '',
        title: issue.title,
        description: issue.description ?? null,
        status: {
          id: status?.id ?? '',
          name: status?.name ?? 'Unknown',
          color: status?.color ?? '',
          type: status?.type ?? 'backlog',
        },
        priority: issue.priority ?? 0,
        priorityLabel: this.getPriorityLabel(issue.priority ?? 0),
        assignee: assignee
          ? {
              id: assignee.id,
              name: assignee.name ?? '',
              displayName: assignee.displayName ?? '',
              avatarUrl: assignee.avatarUrl ?? undefined,
            }
          : null,
        project: project
          ? {
              id: project.id,
              name: project.name,
              url: project.url ?? '',
            }
          : null,
        url: issue.url ?? '',
        createdAt: issue.createdAt,
        updatedAt: issue.updatedAt,
      };
    } catch (error) {
      console.error('Failed to fetch Linear issue:', error);
      return null;
    }
  }

  /**
   * Fetch projects from the workspace
   */
  async getProjects(): Promise<LinearProject[]> {
    try {
      const projects = await this.client.projects({ first: 100 });
      const nodes = projects?.nodes ?? [];

      const result: LinearProject[] = [];

      for (const project of nodes) {
        if (!project) continue;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const projectAny = project as any;
        result.push({
          id: project.id,
          name: project.name,
          url: project.url ?? '',
          description: project.description ?? null,
          status:
            (typeof projectAny.status === 'string'
              ? projectAny.status
              : projectAny.status?.name) ?? 'Unknown',
          icon: projectAny.icon ?? null,
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch Linear projects:', error);
      return [];
    }
  }

  /**
   * Create a comment on an issue
   */
  async createComment(
    issueId: string,
    body: string
  ): Promise<{ id: string; url: string } | null> {
    try {
      const commentPayload = await this.client.createComment({
        issueId,
        body,
      });

      if (!(commentPayload.success && commentPayload.comment)) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const comment = commentPayload.comment as any;
      return {
        id: comment.id,
        url: comment.url ?? '',
      };
    } catch (error) {
      console.error('Failed to create Linear comment:', error);
      return null;
    }
  }

  /**
   * Convert Linear priority number to label
   */
  private getPriorityLabel(
    priority: number
  ): 'Urgent' | 'High' | 'Medium' | 'Low' | 'No Priority' {
    switch (priority) {
      case 4:
        return 'Urgent';
      case 3:
        return 'High';
      case 2:
        return 'Medium';
      case 1:
        return 'Low';
      case 0:
      default:
        return 'No Priority';
    }
  }

  /**
   * Get workflow states (for filter dropdown)
   * Note: This may not be available in all Linear SDK versions
   */
  async getWorkflowStates(): Promise<
    Array<{ id: string; name: string; color: string; type: string }>
  > {
    try {
      const viewer = await this.client.viewer;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const viewerAny = viewer as any;
      if (!viewerAny?.organizationId) return [];

      // For now, return empty as workflowStates may not be directly accessible
      // This can be enhanced later based on SDK capabilities
      return [];
    } catch (error) {
      console.error('Failed to fetch Linear workflow states:', error);
      return [];
    }
  }

  /**
   * Get teams from the workspace
   */
  async getTeams(): Promise<
    Array<{ id: string; name: string; key: string; description: string }>
  > {
    try {
      const teams = await this.client.teams({ first: 100 });
      const nodes = teams?.nodes ?? [];

      const result: Array<{
        id: string;
        name: string;
        key: string;
        description: string;
      }> = [];

      for (const team of nodes) {
        if (!team) continue;
        result.push({
          id: team.id,
          name: team.name,
          key: team.key ?? '',
          description: team.description ?? '',
        });
      }

      return result;
    } catch (error) {
      console.error('Failed to fetch Linear teams:', error);
      return [];
    }
  }
}

/**
 * Create a Linear driver instance with an access token
 */
export function createLinearDriver(accessToken: string): LinearDriver {
  return new LinearDriver(accessToken);
}
