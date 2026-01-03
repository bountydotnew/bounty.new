/**
 * GitHub helper utilities
 * These are helper functions for GitHub-related operations.
 * For GitHub API functions, see @bounty/api/driver/github
 */

// Regex for extracting owner/repo from GitHub URLs
export const GITHUB_URL_REGEX = /github\.com\/([^/]+)\/([^/]+)/;

/**
 * Helper to extract owner/repo from repo string (format: "owner/repo")
 * @param repo - Repository string in format "owner/repo"
 * @returns Object with owner and repo, or null if invalid format
 */
export function parseRepo(
  repo: string
): { owner: string; repo: string } | null {
  const parts = repo.split('/');
  if (parts.length === 2) {
    return { owner: parts[0], repo: parts[1] };
  }
  return null;
}
