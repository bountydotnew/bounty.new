'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@bounty/ui/components/avatar';
import Link from '@bounty/ui/components/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, GitFork, GitGraph, Github, Star } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataBuddyIcon, MarbleIcon } from '@/components/icons';
import { Header } from '@/components/landing/header';
import { Footer } from '@/components/landing/footer';
import { LINKS } from '@/constants';
import { trpc } from '@/utils/trpc';

interface Contributor {
  login: string;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

const REPOSITORY = 'bountydotnew/bounty.new';
const POLL_INTERVAL = 30_000;
const EXCLUDE = ['dependabot', 'github-actions', 'autofix-ci[bot]'];
const CORE = ['ripgrim'];

export default function ContributorsPage() {
  const [allContributors, setAllContributors] = useState<Contributor[]>([]);
  const lastCommitRef = useRef<string>('');

  const { data: contributors } = useQuery(
    trpc.repository.contributors.queryOptions({ repo: REPOSITORY })
  );
  const { data: repoStatsServer } = useQuery(
    trpc.repository.stats.queryOptions({ repo: REPOSITORY })
  );
  const { data: commitsData } = useQuery(
    trpc.repository.recentCommits.queryOptions({ repo: REPOSITORY, limit: 50 })
  );

  useEffect(() => {
    const poll = async () => {
      try {
        if (Array.isArray(commitsData) && commitsData.length) {
          lastCommitRef.current =
            (commitsData as { sha?: string }[])[0]?.sha ?? '';
        }
      } catch {}
    };
    poll();
    const i = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(i);
  }, [commitsData]);

  useEffect(() => {
    if (contributors && Array.isArray(contributors)) {
      setAllContributors(
        contributors.filter((c: Contributor) => !EXCLUDE.includes(c.login))
      );
    }
  }, [contributors]);

  const core = useMemo(
    () => allContributors.filter((c) => CORE.includes(c.login)),
    [allContributors]
  );
  const community = useMemo(
    () =>
      allContributors
        .filter((c) => !CORE.includes(c.login))
        .sort((a, b) => b.contributions - a.contributions)
        .slice(0, 12),
    [allContributors]
  );

  const externalTools = [
    {
      id: 1,
      name: 'Databuddy',
      description: 'GDPR compliant analysis',
      icon: DataBuddyIcon,
      url: 'https://databuddy.cc',
      category: 'Analytics',
    },
    {
      id: 2,
      name: 'Marble',
      description: 'Headless CMS',
      icon: MarbleIcon,
      url: 'https://marblecms.com',
      category: 'Blog CMS',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      <Header />

      <section className="flex-1 px-8 pt-32 pb-24">
        <div className="mx-auto max-w-6xl">
          {/* Hero Section */}
          <div className="mb-20 max-w-3xl">
            <h1 className="mb-8 font-display text-5xl tracking-tight text-[#efefef]">
              Contributors
            </h1>

            <p className="mb-10 max-w-2xl text-lg leading-relaxed text-[#888]">
              Meet the developers building bounty.new in public. Open-source
              contributions, transparent development, community-driven
              innovation.
            </p>

            {/* Repository Stats */}
            <div className="mb-8 flex flex-wrap gap-8">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[#666]" />
                <span className="font-display text-2xl font-medium text-[#efefef]">
                  {repoStatsServer?.repo.stargazersCount?.toLocaleString() ||
                    '0'}
                </span>
                <span className="text-[15px] text-[#666]">stars</span>
              </div>
              <div className="flex items-center gap-2">
                <GitFork className="h-4 w-4 text-[#666]" />
                <span className="font-display text-2xl font-medium text-[#efefef]">
                  {repoStatsServer?.repo.forksCount?.toLocaleString() || '0'}
                </span>
                <span className="text-[15px] text-[#666]">forks</span>
              </div>
              <div className="flex items-center gap-2">
                <GitGraph className="h-4 w-4 text-[#666]" />
                <span className="font-display text-2xl font-medium text-[#efefef]">
                  {allContributors.length}
                </span>
                <span className="text-[15px] text-[#666]">contributors</span>
              </div>
            </div>

            <Link
              className="inline-flex items-center gap-2 rounded-lg border border-transparent px-5 py-3 text-[15px] text-[#888] transition-all duration-200 hover:border-[#222] hover:bg-[#111] hover:text-[#efefef]"
              href={LINKS.SOCIALS.GITHUB}
              target="_blank"
            >
              <Github className="h-4 w-4" />
              View on GitHub
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Core Team Section */}
          {core.length > 0 && (
            <section className="mb-16">
              <h2 className="mb-8 font-display text-2xl tracking-tight text-[#efefef]">
                Core Team
              </h2>
              <div className="grid gap-4">
                {core.map((contributor) => (
                  <Link
                    className="group flex items-center gap-5 rounded-xl border border-transparent px-6 py-5 transition-all duration-200 hover:border-[#222] hover:bg-[#111]"
                    href={contributor.html_url}
                    key={contributor.login}
                    target="_blank"
                  >
                    <Avatar className="h-12 w-12 ring-1 ring-[#222]">
                      <AvatarImage src={contributor.avatar_url} />
                      <AvatarFallback className="bg-[#111] text-[#666]">
                        {contributor.login.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="mb-1 flex items-center gap-3">
                        <h3 className="font-medium text-[#efefef] transition-colors duration-200 group-hover:text-white">
                          {contributor.login}
                        </h3>
                        {contributor.login === 'ripgrim' && (
                          <span className="rounded-full border border-[#222] px-2.5 py-0.5 text-[13px] text-[#666]">
                            Founder
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[14px] text-[#666]">
                        <GitGraph className="h-3.5 w-3.5" />
                        <span>
                          {contributor.contributions.toLocaleString()}{' '}
                          contributions
                        </span>
                      </div>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-[#444] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Top Contributors Grid */}
          <section className="mb-16">
            <h2 className="mb-8 font-display text-2xl tracking-tight text-[#efefef]">
              Top Contributors
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {community.map((contributor) => (
                <Link
                  className="group rounded-xl border border-transparent px-5 py-5 text-center transition-all duration-200 hover:border-[#222] hover:bg-[#111]"
                  href={contributor.html_url}
                  key={contributor.login}
                  target="_blank"
                >
                  <Avatar className="mx-auto mb-3 h-12 w-12 ring-1 ring-[#222] transition-transform duration-200 group-hover:scale-105">
                    <AvatarImage src={contributor.avatar_url} />
                    <AvatarFallback className="bg-[#111] text-[#666]">
                      {contributor.login.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="mb-1 truncate text-[15px] font-medium text-[#efefef] transition-colors duration-200 group-hover:text-white">
                    {contributor.login}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 text-[14px] text-[#666]">
                    <GitGraph className="h-3.5 w-3.5" />
                    <span>{contributor.contributions}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* External Tools */}
          <section>
            <h2 className="mb-4 font-display text-2xl tracking-tight text-[#efefef]">
              External Tools
            </h2>
            <p className="mb-8 max-w-xl text-[15px] text-[#666]">
              The tools and platforms that power our development workflow.
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {externalTools.map((tool) => (
                <Link
                  className="group rounded-xl border border-transparent px-6 py-5 transition-all duration-200 hover:border-[#222] hover:bg-[#111]"
                  href={tool.url}
                  key={tool.id}
                  target="_blank"
                >
                  <div className="flex items-start gap-5">
                    <div className="flex h-12 w-12 items-center justify-center">
                      <tool.icon className="text-white" size={48} />
                    </div>
                    <div className="flex-1">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium text-[#efefef] transition-colors duration-200 group-hover:text-white">
                          {tool.name}
                        </h3>
                        <span className="rounded-full border border-[#222] px-2.5 py-0.5 text-[13px] text-[#666]">
                          {tool.category}
                        </span>
                      </div>
                      <p className="mb-3 text-[15px] text-[#666]">
                        {tool.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-[14px] text-[#444] transition-colors duration-200 group-hover:text-[#666]">
                        <ArrowUpRight className="h-3.5 w-3.5" />
                        <span>Visit tool</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </section>

      <Footer />
    </div>
  );
}
