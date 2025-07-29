'use client';

import {
  Github, GitGraph,
  ArrowUpRight,
  Target,
  Zap,
  GitCommit
} from 'lucide-react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import NumberFlow from '@number-flow/react';
import { LINKS } from '@/constants/links';
import { toast } from 'sonner';
import { grim } from "@bounty/dev-logger";
import { MarbleIcon } from '@/components/icons/marble';
import { DataBuddyIcon } from '@/components/icons/databuddy';
import { ComponentType } from 'react';
import Link from 'next/link';

const { log } = grim();

interface ExternalTool {
  id: number;
  name: string;
  description: string;
  icon: string | ComponentType<{ size?: number; className?: string }>;
  url: string;
  category: string;
  color: string;
}

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
  biggestCommit?: {
    sha: string;
    message: string;
    additions: number;
    deletions: number;
    coAuthors: string[];
    url: string;
  };
}

interface CommitData {
  sha: string;
  commit: {
    author: {
      name: string;
      date: string;
    };
    message: string;
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
  html_url: string;
}

const REPOSITORY = 'ripgrim/bounty.new';
const POLL_INTERVAL = 30000; // 30 seconds

const excludedUsernames = ['dependabot', 'github-actions', 'autofix-ci[bot]'];
const coreTeamMembers = ['ripgrim'];
const specialRoles: Record<string, { role: string; color: string; position: number }> = {
  ripgrim: { role: 'Founder', color: 'from-blue-500 to-purple-600', position: 1 },
};

const externalTools: ExternalTool[] = [
  {
    id: 1,
    name: "Databuddy",
    description: "GDPR compliant analysis",
    icon: DataBuddyIcon,
    url: "https://databuddy.cc",
    category: "Analytics",
    color: "from-gray-500 to-gray-600"
  },
  {
    id: 2,
    name: "Marble",
    description: "Headless CMS",
    icon: MarbleIcon,
    url: "https://marblecms.com",
    category: "Blog CMS",
    color: "from-black to-gray-800"
  },
];

const getGitHubHeaders = () => {
  const headers: Record<string, string> = {
    'Accept': 'application/vnd.github.v3+json',
  };
  
  if (process.env.NEXT_PUBLIC_GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`;
  }
  
  return headers;
};

const parseCoAuthors = (message: string): string[] => {
  const coAuthorRegex = /Co-authored-by:\s*(.+?)\s*<[^>]+>/g;
  const coAuthors: string[] = [];
  let match;
  
  while ((match = coAuthorRegex.exec(message)) !== null) {
    coAuthors.push(match[1].trim());
  }
  
  return coAuthors;
};

const fetchBiggestCommit = async (username: string) => {
  try {
    const commitsResponse = await fetch(
      `https://api.github.com/repos/${REPOSITORY}/commits?author=${username}&per_page=20`,
      { headers: getGitHubHeaders() }
    );
    
    if (!commitsResponse.ok) return undefined;
    
    const commits = await commitsResponse.json();
    
    if (!Array.isArray(commits) || commits.length === 0) return undefined;
    
    let biggestCommit = undefined;
    let maxChanges = 0;
    
    for (const commit of commits.slice(0, 10)) {
      try {
        const detailResponse = await fetch(commit.url, { headers: getGitHubHeaders() });
        const detail = await detailResponse.json();
        
        const additions = detail.stats?.additions || 0;
        const deletions = detail.stats?.deletions || 0;
        const totalChanges = additions + deletions;
        
        if (totalChanges > maxChanges) {
          maxChanges = totalChanges;
          const coAuthors = parseCoAuthors(commit.commit.message);
          
          biggestCommit = {
            sha: commit.sha.substring(0, 7),
            message: commit.commit.message.split('\n')[0].substring(0, 50),
            additions,
            deletions,
            coAuthors,
            url: commit.html_url,
          };
        }
      } catch (error) {
        log(`Error fetching commit details for ${commit.sha}:`, error);
      }
    }
    
    return biggestCommit;
  } catch (error) {
    log(`Error fetching commits for ${username}:`, error);
    return undefined;
  }
};

const StatCard = ({ value, label }: { value: number; label: string }) => (
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4 text-center">
    <div className="text-2xl font-bold">
      <NumberFlow value={value} />
    </div>
    <div className="text-white/60 text-sm">{label}</div>
  </div>
);

const CommitToast = ({ commit }: { commit: CommitData }) => {
  const extractBranch = (message: string) => {
    const branchMatch = message.match(/\[([^\]]+)\]/);
    return branchMatch ? branchMatch[1] : 'main';
  };

  const branch = extractBranch(commit.commit.message);
  const isMainBranch = ['main', 'master'].includes(branch.toLowerCase());
  
  return (
    <div className="flex items-center gap-3 p-2">
      <Avatar className="w-8 h-8">
        <AvatarImage src={commit.author?.avatar_url} />
        <AvatarFallback className="text-xs">
          {commit.author?.login?.slice(0, 2).toUpperCase() || 'UN'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          <span className="text-blue-400">{commit.author?.login || commit.commit.author.name}</span>
          {isMainBranch ? ' just pushed to prod!' : ` just pushed to ${branch}`}
        </p>
        <p className="text-xs text-white/60 truncate">
          {commit.commit.message.split('\n')[0]}
        </p>
      </div>
      <GitCommit className="w-4 h-4 text-green-400" />
    </div>
  );
};
  
export default function ContributorsPage() {
  const [repoStats, setRepoStats] = useState({
    stars: 0,
    forks: 0,
    watchers: 0,
    openIssues: 0,
    openPRs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const [activityData, setActivityData] = useState<Array<{ date: string; commits: number; issues: number; pullRequests: number }>>([]);
  const [, setLastCommitSha] = useState<string>('');
  const lastCommitRef = useRef<string>('');

  const { data: contributors } = useQuery({
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${REPOSITORY}/contributors?per_page=100`, { headers: getGitHubHeaders() });
      if (!res.ok) throw new Error('Failed to fetch contributors');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    queryKey: ['contributors', REPOSITORY],
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: repoData } = useQuery({
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${REPOSITORY}`, { headers: getGitHubHeaders() });
      if (!res.ok) throw new Error('Failed to fetch repo data');
      return res.json();
    },
    queryKey: ['repo-data', REPOSITORY],
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: prsData } = useQuery({
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${REPOSITORY}/pulls?state=open`, { headers: getGitHubHeaders() });
      if (!res.ok) throw new Error('Failed to fetch PRs');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    queryKey: ['prs-data', REPOSITORY],
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const { data: commitsData } = useQuery({
    queryFn: async () => {
      const res = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits?per_page=100`, { headers: getGitHubHeaders() });
      if (!res.ok) throw new Error('Failed to fetch commits');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    queryKey: ['commits-data', REPOSITORY],
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Real-time commit polling
  useEffect(() => {
    const pollCommits = async () => {
      try {
        const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/commits?per_page=5`, { headers: getGitHubHeaders() });
        const commits: CommitData[] = await response.json();
        
        if (commits && Array.isArray(commits) && commits.length > 0) {
          const latestCommit = commits[0];
          
          if (lastCommitRef.current && lastCommitRef.current !== latestCommit.sha) {
            // New commit detected
            toast.custom(() => (
              <div className="bg-gray-900/95 backdrop-blur-sm border border-white/20 rounded-lg p-3 shadow-lg">
                <CommitToast commit={latestCommit} />
              </div>
            ), {
              duration: 5000,
              position: 'top-right',
            });
          }
          
          lastCommitRef.current = latestCommit.sha;
          setLastCommitSha(latestCommit.sha);
        }
      } catch (error) {
        console.log('Error polling commits:', error);
      }
    };

    // Initial call
    pollCommits();
    
    // Set up polling
    const interval = setInterval(pollCommits, POLL_INTERVAL);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const loadContributorsWithCommits = async () => {
      if (contributors && Array.isArray(contributors)) {
        const filtered = contributors.filter((c: Contributor) => !excludedUsernames.includes(c.login));
        
        const enhancedContributors = await Promise.all(
          filtered.map(async (contributor) => {
            const biggestCommit = await fetchBiggestCommit(contributor.login);
            return {
              ...contributor,
              biggestCommit,
            };
          })
        );
        
        setAllContributors(enhancedContributors);
      }
    };
    
    loadContributorsWithCommits();
  }, [contributors]);

  useEffect(() => {
    // Set default values if API calls fail
    const safeCommitsData = commitsData && Array.isArray(commitsData) ? commitsData : [];
    const safePrsData = prsData && Array.isArray(prsData) ? prsData : [];
    
    if (!repoData) {
      setIsLoading(true);
      return;
    }

    setIsLoading(false);

    setRepoStats({
      stars: repoData.stargazers_count ?? 0,
      forks: repoData.forks_count ?? 0,
      watchers: repoData.subscribers_count ?? 0,
      openIssues: (repoData.open_issues_count ?? 0) - safePrsData.length,
      openPRs: safePrsData.length ?? 0,
    });

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      const today = date.getDay();
      const daysToSubtract = today + (6 - i);
      date.setDate(date.getDate() - daysToSubtract);

      const dateStr = date.toISOString().split('T')[0];

      const dayCommits = safeCommitsData.filter((commit: { commit: { author: { date: string } } }) =>
        commit.commit.author.date.startsWith(dateStr ?? ''),
      ).length;

      const commits = dayCommits;

      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        commits,
        issues: Math.max(1, Math.floor(commits * 0.3)),
        pullRequests: Math.max(1, Math.floor(commits * 0.2)),
      };
    });

    setActivityData(last7Days);
  }, [repoData, commitsData, prsData]);

  const filteredCoreTeam = useMemo(() => {
    const safeContributors = allContributors || [];
    return safeContributors
      .filter(
        (contributor) =>
          !excludedUsernames.includes(contributor.login) &&
          coreTeamMembers.some(
            (member) => member.toLowerCase() === contributor.login.toLowerCase(),
          ),
      )
      .sort((a, b) => {
        const positionA = specialRoles[a.login.toLowerCase()]?.position || 999;
        const positionB = specialRoles[b.login.toLowerCase()]?.position || 999;
        return positionA - positionB;
      });
  }, [allContributors]);

  const filteredContributors = useMemo(() => {
    const safeContributors = allContributors || [];
    return safeContributors
      .filter(
        (contributor) =>
          !excludedUsernames.includes(contributor.login) &&
          !coreTeamMembers.some(
            (member) => member.toLowerCase() === contributor.login.toLowerCase(),
          ),
      )
      .sort((a, b) => b.contributions - a.contributions)
      .slice(0, 12);
  }, [allContributors]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-white/60">Loading contributors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="relative py-20">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-black" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 container mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Target className="w-4 h-4" />
              <span className="text-sm">bounty.new</span>
            </div>
            
            <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Contributors
            </h1>
            
            <p className="text-lg text-white/60 max-w-2xl mx-auto mb-12">
              The developers building the future of bounties
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
              <StatCard value={repoStats.stars} label="Stars" />
              <StatCard value={repoStats.forks} label="Forks" />
              <StatCard value={allContributors.length} label="Contributors" />
              <StatCard value={repoStats.openPRs} label="Active PRs" />
              <StatCard value={repoStats.openIssues} label="Open Issues" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-12 bg-black">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            
            {filteredCoreTeam && filteredCoreTeam.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold mb-8 text-center">Core Team</h2>
                <div className="space-y-6">
                  {filteredCoreTeam.map((member: Contributor) => (
                    <div
                      key={member.login}
                      className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-16 h-16 ring-2 ring-white/20">
                          <AvatarImage src={member.avatar_url} />
                          <AvatarFallback>{member.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold">{member.login}</h3>
                          <p className="text-white/60 text-sm">{specialRoles[member.login]?.role}</p>
                          <div className="flex items-center gap-2 text-white/60 text-sm mt-2">
                            <GitGraph className="w-4 h-4" />
                            <span><NumberFlow value={member.contributions} /> commits</span>
                          </div>
                          
                          {member.biggestCommit && (
                            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex-1">
                                  <Link
                                    href={member.biggestCommit.url}
                                    target="_blank"
                                    className="text-sm font-mono text-white/80 hover:text-white transition-colors"
                                  >
                                    Largest PR
                                  </Link>
                                  <p className="text-sm text-white/60 mt-1">
                                    {member.biggestCommit.message}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-green-400">+{member.biggestCommit.additions}</span>
                                  <span className="text-red-400">-{member.biggestCommit.deletions}</span>
                                </div>
                              </div>
                              
                              {member.biggestCommit.coAuthors.length > 0 && (
                                <div className="flex items-center gap-2 text-xs text-white/50">
                                  <span>Co-authored with:</span>
                                  <div className="flex gap-1">
                                    {member.biggestCommit.coAuthors.map((coAuthor, i) => (
                                      <span key={i} className="bg-white/10 px-2 py-1 rounded">
                                        {coAuthor}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          <Link
                            href={member.html_url}
                            target="_blank"
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <Github className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`https://x.com/${member.login}`}
                            target="_blank"
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">Weekly Activity</h2>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#ffffff60', fontSize: 11 }}
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#ffffff60', fontSize: 11 }}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: 'white'
                      }}
                      labelStyle={{ color: '#ffffff60' }}
                      formatter={(value) => [
                        `${value} commits`,
                        'Activity'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="commits" 
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      fill="url(#colorGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative py-16 bg-black">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold mb-4 text-center bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Top Contributors
          </h2>
          <p className="text-center text-white/60 mb-12 text-lg">Our amazing community builders</p>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8 max-w-7xl mx-auto">
            {filteredContributors?.length > 0 ? (
              filteredContributors.map((contributor: Contributor) => (
                <Link
                  key={contributor.login}
                  href={contributor.html_url}
                  target="_blank"
                  className="group block text-center"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/15 hover:border-white/30 hover:scale-110 hover:-translate-y-2 transition-all duration-300">
                    <div className="relative inline-block mb-4">
                      <Avatar className="w-20 h-20 mx-auto ring-2 ring-white/20 group-hover:ring-white/50 transition-all duration-300 group-hover:scale-110">
                        <AvatarImage src={contributor.avatar_url} className="object-cover" />
                        <AvatarFallback className="text-sm font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {contributor.login.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors" title={contributor.login}>
                        {contributor.login}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-sm text-white/60">
                        <GitGraph className="w-4 h-4" />
                        <span className="font-mono">
                          <NumberFlow value={contributor.contributions} />
                        </span>
                        <span className="text-xs">commits</span>
                      </div>
                      
                      <div className="mt-3">
                        {contributor.contributions > 50 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-purple-500/30 to-pink-500/30 text-purple-300 px-3 py-1.5 rounded-full border border-purple-500/40">
                            <Zap className="w-3 h-3" />
                            Pro Contributor
                          </span>
                        ) : contributor.contributions > 20 ? (
                          <span className="inline-flex items-center gap-1 text-xs bg-gradient-to-r from-blue-500/30 to-cyan-500/30 text-blue-300 px-3 py-1.5 rounded-full border border-blue-500/40">
                            <Target className="w-3 h-3" />
                            Active
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-white/40 text-lg">Nobody&apos;s contributed yet 😔</div>
                <p className="text-white/60 text-sm mt-2">Be the first to make a difference!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="relative py-12 bg-black">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-8 text-center">External Tools</h2>
          <p className="text-center text-white/60 mb-8 max-w-2xl mx-auto">
            The tools and platforms that power our development workflow
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {externalTools.map((tool: ExternalTool) => (
              <Link
                key={tool.id}
                href={tool.url}
                target="_blank"
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:scale-105 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 flex items-center justify-center">
                    {typeof tool.icon === 'string' ? (
                      <span className="text-3xl">{tool.icon}</span>
                    ) : (
                      <tool.icon size={48} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold group-hover:text-white transition-colors">
                        {tool.name}
                      </h3>
                      <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-white/60">
                        {tool.category}
                      </span>
                    </div>
                    <p className="text-white/60 text-sm group-hover:text-white/80 transition-colors">
                      {tool.description}
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-white/40 group-hover:text-white/60 transition-colors">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="text-xs">Visit tool</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="relative py-16">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-30% to-blue-500/15" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm">Join the Revolution</span>
            </div>
            
            <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
              Ready to Contribute?
            </h2>
            
            <p className="text-white/60 mb-8">
              Help us build the future of developer compensation
            </p>
            
            <Button 
              asChild 
              size="lg"
              className="bg-white text-black hover:bg-white/90 rounded-full px-8"
            >
              <Link href={LINKS.SOCIALS.GITHUB} target="_blank">
                <Github className="w-5 h-5 mr-2" />
                Start Contributing
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
  