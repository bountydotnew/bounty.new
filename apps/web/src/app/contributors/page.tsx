'use client';

import { Github, GitGraph, Star, GitFork, Eye, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Bounty from '@/components/icons/bounty';
import { trpc } from '@/utils/trpc';
import { DataBuddyIcon, MarbleIcon } from '@/components/icons';
import React from 'react';
import { LINKS } from '@/constants/links';

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

const REPOSITORY = 'bountydotnew/bounty.new';
const POLL_INTERVAL = 30000;
const EXCLUDE = ['dependabot', 'github-actions', 'autofix-ci[bot]'];
const CORE = ['ripgrim'];

// tRPC backend handles GitHub auth

type IconType = React.ComponentType<{ className?: string }>;
function StatPill({ icon: Icon, value, label }: { icon: IconType; value: number | string; label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/80">
      <Icon className="w-4 h-4" />
      <span className="tabular-nums">{value}</span>
      <span className="text-white/50">{label}</span>
    </div>
  );
}

function Header({ stars, forks, watchers, contributors }: { stars: number; forks: number; watchers: number; contributors: number }) {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_0%_0%,rgba(255,255,255,0.06),transparent_60%),radial-gradient(60%_60%_at_100%_0%,rgba(255,255,255,0.05),transparent_60%)]" />
      <div className="container mx-auto px-4 pt-10">
        <div className="relative isolate overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] backdrop-blur-md">
          <div className="px-6 py-7 md:px-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid place-items-center rounded-xl bg-white/5 ring-1 ring-inset ring-white/10 p-2">
                  <Bounty className="w-9 h-9 text-white/90" />
                </div>
                <div>
                  <div className="text-2xl md:text-3xl font-semibold tracking-tight">bounty.new</div>
                  <div className="text-sm text-white/60">Open-source bounties, built in public</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <StatPill icon={Star} value={stars.toLocaleString()} label="stars" />
                <StatPill icon={GitFork} value={forks.toLocaleString()} label="forks" />
                <StatPill icon={Eye} value={watchers.toLocaleString()} label="watchers" />
                <StatPill icon={GitGraph} value={contributors} label="contributors" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CoreCard({ c, role }: { c: Contributor; role?: string }) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-br from-white/[0.06] to-transparent" />
      <div className="relative flex items-center gap-3">
        <Avatar className="w-12 h-12 ring-1 ring-white/15">
          <AvatarImage src={c.avatar_url} />
          <AvatarFallback>{c.login.slice(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold truncate">{c.login}</h3>
            {role ? (
              <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/70">{role}</span>
            ) : null}
          </div>
        </div>
        <Link href={c.html_url} target="_blank" className="grid place-items-center rounded-md border border-white/10 bg-white/5 p-2 text-sm hover:bg-white/10 transition-colors">
          <Github className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function PersonCard({ c }: { c: Contributor }) {
  return (
    <Link href={c.html_url} target="_blank" className="group block text-center">
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/[0.06] hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200">
        <div className="relative inline-block mb-4">
          <Avatar className="w-20 h-20 mx-auto ring-1 ring-white/15 group-hover:ring-white/30 transition-all duration-200 group-hover:scale-105">
            <AvatarImage src={c.avatar_url} className="object-cover" />
            <AvatarFallback className="text-sm font-bold">{c.login.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className="space-y-2">
          <div className="text-sm font-semibold truncate group-hover:text-white transition-colors" title={c.login}>
            {c.login}
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <GitGraph className="w-4 h-4" />
            <span className="tabular-nums">{c.contributions.toLocaleString()}</span>
            <span className="text-xs">commits</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ContributorsPage() {
  const [, setRepoStats] = useState({ stars: 0, forks: 0, watchers: 0 });
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const [activityData, setActivityData] = useState<Array<{ date: string; commits: number }>>([]);
  const lastCommitRef = useRef<string>('');

  const { data: contributors } = useQuery(trpc.repository.contributors.queryOptions({ repo: REPOSITORY }));
  const { data: repoStatsServer } = useQuery(trpc.repository.stats.queryOptions({ repo: REPOSITORY }));
  const { data: commitsData } = useQuery(trpc.repository.recentCommits.queryOptions({ repo: REPOSITORY, limit: 50 }));

  useEffect(() => {
    const poll = async () => {
      try {
        if (Array.isArray(commitsData) && commitsData.length) lastCommitRef.current = (commitsData as { sha?: string }[])[0]?.sha ?? '';
      } catch {}
    };
    poll();
    const i = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(i);
  }, [commitsData]);

  useEffect(() => {
    const safeCommits = Array.isArray(commitsData) ? commitsData : [];
    if (repoStatsServer) {
      setRepoStats({
        stars: repoStatsServer.repo.stargazersCount ?? 0,
        forks: repoStatsServer.repo.forksCount ?? 0,
        watchers: repoStatsServer.repo.subscribersCount ?? 0,
      });
    }
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const commits = safeCommits.filter((c: { commit?: { author?: { date?: string } } }) => c?.commit?.author?.date?.startsWith(dateStr)).length;
      return { date: d.toLocaleDateString('en-US', { weekday: 'short' }), commits };
    });
    setActivityData(last7);
  }, [repoStatsServer, commitsData]);

  useEffect(() => {
    if (contributors && Array.isArray(contributors)) {
      setAllContributors(contributors.filter((c: Contributor) => !EXCLUDE.includes(c.login)));
    }
  }, [contributors]);

  const core = useMemo(() => allContributors.filter(c => CORE.includes(c.login)), [allContributors]);
  const community = useMemo(() => allContributors.filter(c => !CORE.includes(c.login)).sort((a,b)=>b.contributions-a.contributions).slice(0, 18), [allContributors]);

  interface ExternalTool {
    id: number;
    name: string;
    description: string;
    icon: string | React.ComponentType<{ size?: number; className?: string }>;
    url: string;
    category: string;
    color: string;
  }

  const externalTools: ExternalTool[] = [
    {
      id: 1,
      name: 'Databuddy',
      description: 'GDPR compliant analysis',
      icon: DataBuddyIcon,
      url: 'https://databuddy.cc',
      category: 'Analytics',
      color: 'from-gray-500 to-gray-600',
    },
    {
      id: 2,
      name: 'Marble',
      description: 'Headless CMS',
      icon: MarbleIcon,
      url: 'https://marblecms.com',
      category: 'Blog CMS',
      color: 'from-black to-gray-800',
    },
  ];

  return (
    <div className="min-h-screen bg-[#252525] text-[#f3f3f3]">
      <Header stars={repoStatsServer?.repo.stargazersCount ?? 0} forks={repoStatsServer?.repo.forksCount ?? 0} watchers={repoStatsServer?.repo.subscribersCount ?? 0} contributors={allContributors.length} />

      <div className="relative py-10">
        <div className="container mx-auto px-6">
          {core.length > 0 && (
            <div className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">Core Team</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {core.map((c) => (
                  <CoreCard key={c.login} c={c} role={c.login === 'ripgrim' ? 'Founder' : undefined} />
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-10 items-start">
            <div>
              <h2 className="text-3xl font-bold mb-6">Weekly Activity</h2>
              <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={activityData} margin={{ top: 6, right: 6, left: 6, bottom: 6 }}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#b3b3b3', fontSize: 11 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#b3b3b3', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1d1d1d', border: '1px solid #383838', borderRadius: '8px', color: '#f3f3f3' }} labelStyle={{ color: '#b3b3b3' }} formatter={(v) => [`${v} commits`, 'Activity']} />
                    <defs>
                      <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#C9C9C9" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#8D8D8D" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="commits" stroke="#8d8d8d" strokeWidth={1.5} fill="url(#areaFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold mb-6">Top Contributors</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {community.map((c) => (
                  <PersonCard key={c.login} c={c} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex items-center justify-center">
            <Link href={LINKS.SOCIALS.GITHUB} target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm hover:bg-white/10 transition-colors">
              <Github className="w-4 h-4" />
              <span>Open GitHub</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="relative py-12 bg-background mt-12 rounded-2xl">
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
        </div>
      </div>
    </div>
  );
}
