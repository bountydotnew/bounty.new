import { GITHUB_URL_REGEX } from './utils';

export interface ParsedLink {
  url: string;
  domain: string;
  favicon: string;
  displayText: string;
  isGitHub: boolean;
  githubOwner?: string;
  githubRepo?: string;
}

// Whitelist of subdomains that should be preserved
const PRESERVED_SUBDOMAINS = [
  'app',
  'api',
  'admin',
  'dashboard',
  'console',
  'portal',
  'local',
  'dev',
  'development',
  'staging',
  'test',
  'beta',
  'demo',
  'docs',
  'doc',
  'blog',
  'wiki',
  'help',
  'support',
  'community',
  'go',
  'id',
  'login',
  'auth',
  'cdn',
  'static',
  'assets',
  'media',
  'img',
  'image',
  'video',
  'api',
  'db',
  'database',
  'mail',
  'email',
  'ftp',
  'sftp',
  'vpn',
  'ssh',
  'git',
  'svn',
  'hg',
  'cvs',
  'ns',
  'dns',
  'mx',
  'txt',
  'smtp',
  'pop',
  'imap',
  'webmail',
  'webdisk',
  'cpanel',
  'whm',
  'plesk',
  'direct',
  'client',
  'customers',
  'partners',
  'store',
  'shop',
  'cart',
  'checkout',
  'pay',
  'payment',
  'secure',
  'account',
  'accounts',
  'profile',
  'user',
  'users',
  'member',
  'members',
  'my',
  'm',
];

/**
 * Strip www and other common subdomains from hostname
 * Keeps whitelisted subdomains
 */
function stripSubdomain(hostname: string): string {
  const parts = hostname.split('.');
  if (parts.length <= 2) {
    return hostname; // Already just domain + TLD
  }

  const subdomain = parts[0];
  if (subdomain && PRESERVED_SUBDOMAINS.includes(subdomain)) {
    return hostname; // Keep preserved subdomains
  }

  // Remove first part (www or other non-preserved subdomain)
  return parts.slice(1).join('.');
}

/**
 * Extract URLs from markdown text
 * Handles both markdown links [text](url) and bare URLs
 */
export function extractUrlsFromMarkdown(markdown: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();

  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownLinkRegex.exec(markdown)) !== null) {
    const url = match[2];
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  // Match bare URLs (http/https)
  const bareUrlRegex = /https?:\/\/[^\s\])\}]+/g;
  while ((match = bareUrlRegex.exec(markdown)) !== null) {
    const url = match[0];
    if (url && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  }

  return urls;
}

/**
 * Parse links from markdown text into structured format
 * for storage and display
 */
export function parseLinksFromMarkdown(markdown: string): ParsedLink[] {
  const urls = extractUrlsFromMarkdown(markdown);
  const links: ParsedLink[] = [];

  for (const url of urls) {
    try {
      const urlObj = new URL(url);
      const rawDomain = urlObj.hostname;
      const domain = stripSubdomain(rawDomain);
      const isGitHub = GITHUB_URL_REGEX.test(url);

      let displayText = domain;
      let githubOwner: string | undefined;
      let githubRepo: string | undefined;

      if (isGitHub) {
        const githubMatch = url.match(GITHUB_URL_REGEX);
        if (githubMatch) {
          githubOwner = githubMatch[1];
          githubRepo = githubMatch[2];
          // For GitHub repos, show "owner/repo" format
          displayText = `${githubOwner ?? ''}/${githubRepo ?? ''}`;
        }
      }

      links.push({
        url,
        domain,
        favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`,
        displayText,
        isGitHub,
        githubOwner,
        githubRepo,
      });
    } catch {
      // Skip invalid URLs
      continue;
    }
  }

  return links;
}

/**
 * Get favicon URL for a domain
 */
export function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
}
