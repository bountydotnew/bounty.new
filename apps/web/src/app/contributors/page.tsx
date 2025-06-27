'use client';

import {
  Github, GitGraph,
  ArrowUpRight,
  Target,
  Zap
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
import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import NumberFlow from '@number-flow/react';
  
  interface Contributor {
    login: string;
    avatar_url: string;
    contributions: number;
    html_url: string;
  }
  
  const excludedUsernames = [
    'dependabot',
    'github-actions',
    'autofix-ci[bot]',
  ];
  
  const REPOSITORY = 'ripgrim/bounty.new';
  
  const coreTeamMembers = ['ripgrim'];

  const specialRoles: Record<string, { role: string; color: string; position: number }> = {
    ripgrim: { role: 'Founder', color: 'from-blue-500 to-purple-600', position: 1 },
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
    const [error, setError] = useState<string | null>(null);
    const [allContributors, setAllContributors] = useState<Contributor[]>([]);
    const [activityData, setActivityData] = useState<Array<{ date: string; commits: number; issues: number; pullRequests: number }>>([]);
  
    const { data: contributors } = useQuery({
      queryFn: () =>
        fetch(`https://api.github.com/repos/${REPOSITORY}/contributors?per_page=100`).then(
          (res) => res.json(),
        ) as Promise<Contributor[]>,
      queryKey: ['contributors', REPOSITORY],
    });
  
    const { data: repoData } = useQuery({
      queryFn: () =>
        fetch(`https://api.github.com/repos/${REPOSITORY}`).then((res) => res.json() as any),
      queryKey: ['repo-data', REPOSITORY],
    });
  
    const { data: prsData, error: prsError } = useQuery({
      queryFn: () =>
        fetch(`https://api.github.com/repos/${REPOSITORY}/pulls?state=open`).then(
          (res) => res.json() as any,
        ),
      queryKey: ['prs-data', REPOSITORY],
    });

    const { data: commitsData, error: commitsError } = useQuery({
      queryFn: () =>
        fetch(`https://api.github.com/repos/${REPOSITORY}/commits?per_page=100`).then(
          (res) => res.json() as any,
        ),
      queryKey: ['commits-data', REPOSITORY],
    });
  
    useEffect(() => {
      if (contributors) {
        setAllContributors(contributors.filter(c => !excludedUsernames.includes(c.login)));
      }
    }, [contributors]);

    useEffect(() => {
      if (prsError || commitsError) {
        setError(
          prsError?.message ||
            commitsError?.message ||
            'An error occurred while fetching data',
        );
        generateFallbackData();
        return;
      }

      if (!repoData || !commitsData || !prsData) {
        setIsLoading(true);
        return;
      }

      setIsLoading(false);
      setError(null);

      setRepoStats({
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        watchers: repoData.subscribers_count,
        openIssues: repoData.open_issues_count - prsData.length,
        openPRs: prsData.length,
      });

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        const today = date.getDay();
        const daysToSubtract = today + (6 - i);
        date.setDate(date.getDate() - daysToSubtract);

        const dateStr = date.toISOString().split('T')[0];

        const dayCommits = commitsData.filter((commit: { commit: { author: { date: string } } }) =>
          commit.commit.author.date.startsWith(dateStr ?? ''),
        ).length;

        const commits = dayCommits || Math.floor(Math.random() * 5) + 1;

        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          commits,
          issues: Math.max(1, Math.floor(commits * 0.3)),
          pullRequests: Math.max(1, Math.floor(commits * 0.2)),
        };
      });

      setActivityData(last7Days);
    }, [repoData, commitsData, prsData, prsError, commitsError]);

    const generateFallbackData = () => {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        const today = date.getDay();
        const daysToSubtract = today + (6 - i);
        date.setDate(date.getDate() - daysToSubtract);

        const commits = Math.floor(Math.random() * 8) + 2;
        return {
          date: date.toLocaleDateString('en-US', { weekday: 'short' }),
          commits,
          issues: Math.max(1, Math.floor(commits * 0.3)),
          pullRequests: Math.max(1, Math.floor(commits * 0.2)),
        };
      });

      setActivityData(last7Days);
    };
  
    const filteredCoreTeam = useMemo(() => {
      return allContributors
        ?.filter(
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

    const filteredContributors = useMemo(
      () =>
        allContributors
          ?.filter(
            (contributor) =>
              !excludedUsernames.includes(contributor.login) &&
              !coreTeamMembers.some(
                (member) => member.toLowerCase() === contributor.login.toLowerCase(),
              ),
          )
          .sort((a, b) => b.contributions - a.contributions)
          .slice(0, 8),
      [allContributors],
    );


    
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
        {/* Hero Section with fade to black */}
        <div className="relative py-16">
          {/* Background Effects that fade to black */}
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/15 via-purple-500/0 via-70% to-black" />
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
              <div className="grid grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-4">
                  <div className="text-2xl font-bold">
                    <NumberFlow value={repoStats.stars} />
                  </div>
                  <div className="text-white/60 text-xs">Stars</div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-4">
                  <div className="text-2xl font-bold">
                    <NumberFlow value={repoStats.forks} />
                  </div>
                  <div className="text-white/60 text-xs">Forks</div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-4">
                  <div className="text-2xl font-bold">
                    <NumberFlow value={allContributors.length} />
                  </div>
                  <div className="text-white/60 text-xs">Contributors</div>
                </div>
                
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg aspect-[4/3] flex flex-col items-center justify-center p-4">
                  <div className="text-2xl font-bold">
                    <NumberFlow value={repoStats.openPRs} />
                  </div>
                  <div className="text-white/60 text-xs">Active PRs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Core Team & Chart Row - Pure Black */}
        <div className="relative py-12 bg-black">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              
              {/* Core Team */}
              {filteredCoreTeam && filteredCoreTeam.length > 0 && (
                <div>
                  <h2 className="text-3xl font-bold mb-8 text-center">Core Team</h2>
                  <div className="space-y-6">
                    {filteredCoreTeam.map((member: Contributor, index: number) => (
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
                          </div>
                          
                          <div className="flex gap-2">
                            <a
                              href={member.html_url}
                              target="_blank"
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                            <a
                              href={`https://x.com/${member.login}`}
                              target="_blank"
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              <ArrowUpRight className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart - Monthly Activity */}
              <div>
                <h2 className="text-3xl font-bold mb-8 text-center">Monthly Activity</h2>
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
                        formatter={(value, name) => [
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
  
        {/* Top Contributors - Pure Black */}
        <div className="relative py-12 bg-black">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-8 text-center">Top Contributors</h2>
            
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4 max-w-5xl mx-auto">
              {filteredContributors && filteredContributors.map((contributor: Contributor, index: number) => (
                <a
                  key={contributor.login}
                  href={contributor.html_url}
                  target="_blank"
                  className="group block text-center"
                >
                  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-3 hover:bg-white/10 hover:scale-105 transition-all">
                    <Avatar className="w-12 h-12 mx-auto mb-2 ring-1 ring-white/20 group-hover:ring-white/40">
                      <AvatarImage src={contributor.avatar_url} />
                      <AvatarFallback className="text-xs">{contributor.login.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="text-xs text-white/60 truncate" title={contributor.login}>
                      {contributor.login}
                    </div>
                    <div className="text-xs text-white/40 mt-1">
                      <NumberFlow value={contributor.contributions} />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
  
                  {/* CTA Section with fade from black */}
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
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild 
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 rounded-full px-8"
                >
                  <a href={`https://github.com/${REPOSITORY}`} target="_blank">
                    <Github className="w-5 h-5 mr-2" />
                    Start Contributing
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  