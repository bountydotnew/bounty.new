'use client';

import { use, useMemo } from 'react';
import { BountyDetailContext, type BountyLink } from './context';
import { GITHUB_URL_REGEX } from '@bounty/ui/lib/utils';

interface RelevantLinksProps {
  className?: string;
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
 * Parse links from markdown text (client-side fallback)
 * Extracts URLs from markdown [text](url) and bare URLs
 */
function parseLinksFromMarkdown(markdown: string): BountyLink[] {
  const links: BountyLink[] = [];
  const seen = new Set<string>();

  // Match markdown links: [text](url)
  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;
  while ((match = markdownLinkRegex.exec(markdown)) !== null) {
    const url = match[2];
    if (url && !seen.has(url)) {
      seen.add(url);
      const link = parseUrl(url);
      if (link) links.push(link);
    }
  }

  // Match bare URLs (http/https)
  const bareUrlRegex = /https?:\/\/[^\s\])\}]+/g;
  while ((match = bareUrlRegex.exec(markdown)) !== null) {
    const url = match[0];
    if (url && !seen.has(url)) {
      seen.add(url);
      const link = parseUrl(url);
      if (link) links.push(link);
    }
  }

  return links;
}

function parseUrl(url: string): BountyLink | null {
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
        displayText = `${githubOwner ?? ''}/${githubRepo ?? ''}`;
      }
    }

    return {
      url,
      domain,
      displayText,
      isGitHub,
      githubOwner,
      githubRepo,
    };
  } catch {
    return null;
  }
}

/**
 * RelevantLinks component
 *
 * Displays relevant links extracted from the bounty description.
 * Shows links as chips with favicons and external link icons.
 * Falls back to client-side parsing if server-side links aren't available.
 */
export function RelevantLinks({ className = '' }: RelevantLinksProps) {
  const context = use(BountyDetailContext);
  if (!context) {
    throw new Error(
      'RelevantLinks must be used within BountyDetailProvider'
    );
  }

  const { bounty } = context.state;

  // Use server-side links, or fall back to client-side parsing
  const links = useMemo(() => {
    if (bounty.links && bounty.links.length > 0) {
      return bounty.links;
    }
    // Client-side fallback for bounties created before link parsing was added
    if (bounty.description) {
      return parseLinksFromMarkdown(bounty.description);
    }
    return [];
  }, [bounty.links, bounty.description]);

  if (links.length === 0) {
    return null;
  }

  // Limit to 5 links max
  const displayLinks = links.slice(0, 5);

  return (
    <div className={`flex flex-col items-start gap-3 mb-4 mt-5 ${className}`}>
      <h3 className="text-[15px] font-medium text-white">Relevant Links</h3>
      <div className="flex items-start gap-3 flex-wrap">
        {displayLinks.map((link) => (
          <LinkChip key={link.url} link={link} />
        ))}
      </div>
    </div>
  );
}

interface LinkChipProps {
  link: BountyLink;
}

function LinkChip({ link }: LinkChipProps) {
  const isGitHub = link.isGitHub;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-2 py-1 rounded-[10px] bg-[oklab(28.5%_0_0/32%)] border border-solid border-[#232323] shadow-[oklch(0%_0_0/5%)_0px_1px_2px] shrink-0"
      title={link.url}
    >
      {/* Favicon or GitHub logo */}
      {isGitHub ? (
        <GitHubLogo />
      ) : (
        <img
          src={`https://www.google.com/s2/favicons?domain=${link.domain}&sz=32`}
          alt=""
          className="w-[15px] h-[15px] flex-shrink-0"
          loading="lazy"
        />
      )}

      {/* Display text */}
      <span className="text-[16px] leading-[162.5%] text-neutral-300 font-medium">
        {link.displayText}
      </span>

      {/* External link icon - always visible */}
      <ExternalLinkIcon />
    </a>
  );
}

function GitHubLogo() {
  return (
    <svg
      className="w-[18px] h-[15px] flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 2048 1802"
      aria-hidden="true"
    >
      <path transform="translate(0,0)" fill="#000000" d="M 666.129 7.838 L 1302.86 7.896 L 1303.06 135.057 C 1344.82 135.23 1388.55 135.753 1430.21 135.084 L 1430.3 390.032 L 1873.23 389.942 L 1873.31 566.523 L 1873.33 615.634 C 1873.34 622.753 1873.73 636.223 1872.71 642.781 C 1869.68 644.264 1867.26 644.04 1863.87 644.177 C 1868.06 644.464 1870.06 643.846 1872.86 646.108 C 1873.58 652.255 1873.22 666.315 1873.22 673.128 L 1873.21 724.492 L 1873.17 894.346 L 1873.16 1233.47 C 1873.16 1291.14 1873.95 1350.97 1873.07 1408.43 L 1598.06 1408.27 C 1542.76 1408.27 1484.43 1407.3 1429.35 1408.34 L 981.862 1408.45 L 981.759 645.045 L 980.861 644.371 C 837.321 643.144 692.742 645.8 549.282 644.184 C 532.409 643.097 508.629 643.765 491.172 643.774 L 389.24 643.79 L 90.844 643.839 C 89.89 623.755 89.916 602.562 90.232 582.425 C 91.234 518.531 88.681 453.703 90.56 389.91 L 538.523 390.006 C 539.07 305.153 537.843 219.703 538.791 135.016 L 665.865 135.151 C 666.184 93.154 665.216 49.504 666.129 7.838 z" />
      <path transform="translate(0,0)" fill="#EBB23F" d="M 980.861 644.371 C 1053.78 643.286 1128.4 644.163 1201.5 644.173 L 1615.89 644.247 L 1780.99 644.258 C 1806.09 644.259 1839.44 645.227 1863.87 644.177 C 1868.06 644.464 1870.06 643.846 1872.86 646.108 C 1873.58 652.255 1873.22 666.315 1873.22 673.128 L 1873.21 724.492 L 1873.17 894.346 L 1873.16 1233.47 C 1873.16 1291.14 1873.95 1350.97 1873.07 1408.43 L 1598.06 1408.27 C 1542.76 1408.27 1484.43 1407.3 1429.35 1408.34 L 981.862 1408.45 L 981.759 645.045 L 980.861 644.371 z" />
      <path transform="translate(0,0)" fill="#92B83E" d="M 980.861 644.371 C 1053.78 643.286 1128.4 644.163 1201.5 644.173 L 1615.89 644.247 L 1780.99 644.258 C 1806.09 644.259 1839.44 645.227 1863.87 644.177 C 1868.06 644.464 1870.06 643.846 1872.86 646.108 C 1873.58 652.255 1873.22 666.315 1873.22 673.128 L 1873.21 724.492 L 1873.17 894.346 L 1873.16 1233.47 C 1873.16 1291.14 1873.95 1350.97 1873.07 1408.43 L 1598.06 1408.27 C 1542.76 1408.27 1484.43 1407.3 1429.35 1408.34 C 1428.12 1322.51 1429.15 1234.19 1429.15 1148.2 L 1429.1 644.927 C 1380.11 645.911 1327.86 645.004 1278.66 645.005 L 981.759 645.045 L 980.861 644.371 z" />
      <path transform="translate(0,0)" fill="#292929" d="M 793.768 135.244 L 1175.37 135.273 L 1175.34 262.592 L 1302.82 262.602 L 1302.76 389.992 L 1174.5 389.99 L 666.236 390.012 L 666.167 262.531 C 708.694 262.729 751.221 262.688 793.747 262.411 C 793.478 220.023 793.485 177.633 793.768 135.244 z" />
      <path transform="translate(0,0)" fill="#D44442" d="M 549.282 644.184 C 692.742 645.8 837.321 643.144 980.861 644.371 L 981.759 645.045 L 981.862 1408.45 C 933.202 1407.13 878.625 1408.35 829.578 1408.35 L 538.904 1408.45 C 492.498 1407.67 444.084 1408.37 397.55 1408.37 L 90.737 1408.28 C 89.313 1378.53 90.363 1340.72 90.362 1310.49 L 90.352 1126.63 L 90.529 644.768 C 134.62 643.505 184.54 644.665 229.002 644.665 L 538.987 644.563 C 542.237 644.615 546 644.341 549.282 644.184 z" />
      <path transform="translate(0,0)" fill="#2963CA" d="M 549.282 644.184 C 692.742 645.8 837.321 643.144 980.861 644.371 L 981.759 645.045 L 981.862 1408.45 C 933.202 1407.13 878.625 1408.35 829.578 1408.35 L 538.904 1408.45 C 540.567 1324.72 538.985 1235.39 538.986 1151.29 L 538.987 644.563 C 542.237 644.615 546 644.341 549.282 644.184 z" />
      <path transform="translate(0,0)" fill="#000000" d="M 90.521 1409.21 L 1873.16 1409.31 C 1873.9 1443.17 1873.29 1479.22 1873.28 1513.31 L 1873.4 1729.02 L 90.701 1729.07 C 88.763 1681.98 90.234 1625.37 90.233 1577.31 C 90.232 1523.43 88.74 1462.59 90.521 1409.21 z" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      className="w-[15px] h-[15px] flex-shrink-0"
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12.584 5.501C13.527 5.494 14.531 5.517 15.376 5.61C15.797 5.656 16.207 5.723 16.563 5.822C16.842 5.9 17.204 6.027 17.5 6.267L17.622 6.378L17.732 6.5C17.973 6.796 18.1 7.158 18.178 7.437C18.276 7.793 18.343 8.203 18.39 8.624C18.482 9.469 18.506 10.473 18.499 11.416C18.492 12.365 18.454 13.279 18.418 13.954C18.4 14.292 18.382 14.572 18.369 14.768C18.363 14.865 18.356 14.942 18.352 14.995C18.351 15.021 18.35 15.042 18.349 15.056C18.348 15.062 18.347 15.068 18.347 15.071V15.078C18.303 15.629 17.822 16.04 17.271 15.997C16.721 15.954 16.309 15.472 16.352 14.922V14.918C16.353 14.915 16.354 14.91 16.355 14.904C16.355 14.892 16.357 14.873 16.358 14.848C16.362 14.799 16.367 14.726 16.373 14.633C16.386 14.445 16.403 14.175 16.421 13.848C16.456 13.191 16.492 12.309 16.499 11.401C16.505 10.551 16.482 9.702 16.414 8.999L7.207 18.207C6.816 18.598 6.183 18.598 5.793 18.207C5.402 17.816 5.402 17.183 5.793 16.793L15 7.585C14.297 7.518 13.448 7.495 12.599 7.501C11.691 7.508 10.809 7.544 10.152 7.579C9.825 7.597 9.555 7.614 9.367 7.627C9.274 7.633 9.201 7.638 9.151 7.641C9.127 7.643 9.108 7.644 9.096 7.645C9.09 7.646 9.085 7.647 9.082 7.647H9.078C8.528 7.69 8.046 7.279 8.003 6.728C7.96 6.178 8.371 5.696 8.922 5.653H8.929C8.932 5.653 8.938 5.652 8.944 5.651C8.958 5.65 8.979 5.649 9.005 5.647C9.058 5.644 9.135 5.637 9.232 5.631C9.428 5.618 9.708 5.6 10.046 5.582C10.721 5.546 11.635 5.508 12.584 5.501Z"
        fill="#3F3E3D"
      />
    </svg>
  );
}
