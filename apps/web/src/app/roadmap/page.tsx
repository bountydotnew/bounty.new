import { Badge } from '@bounty/ui/components/badge';
import Link from '@bounty/ui/components/link';
import { cn } from '@bounty/ui/lib/utils';
import type { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';
import { GithubIcon } from '@/components/icons';
import { Footer } from '@/components/sections/home/footer';
import { Header } from '@/components/sections/home/header';

const roadmapItems: {
  title: string;
  description: string;
  status: {
    text: string;
    type: 'complete' | 'pending' | 'default' | 'info';
  };
}[] = [
  {
    title: 'Start',
    description:
      "This is where it all fucking started. Repository created, initial project structure, and the vision for a bounty platform that doesn't suck. [Check out the announcement](https://x.com/rincidium/status/1937110780853588342) where I basically said 'fuck it, let's build this thing'.",
    status: {
      text: 'Completed',
      type: 'complete',
    },
  },
  {
    title: 'Core Platform',
    description:
      'Built the foundation - authentication with GitHub OAuth, database schema with PostgreSQL & Drizzle ORM, tRPC API setup, and modern Next.js 14 app structure. Basically all the boring shit that makes everything else possible.',
    status: {
      text: 'Completed',
      type: 'complete',
    },
  },
  {
    title: 'Bounty System',
    description:
      'The heart of any bounty platform. Create bounties, browse available tasks, application system, difficulty levels, and submission workflow. **This shit has to work perfectly** or the whole platform is useless.',
    status: {
      text: 'In Progress',
      type: 'pending',
    },
  },
  {
    title: 'Payment Integration',
    description:
      "Integration with payment providers for secure transactions. Escrow system for bounty funds, automatic payouts, and billing management. Nobody gives a shit about your platform if they can't get paid reliably.",
    status: {
      text: 'In Progress',
      type: 'pending',
    },
  },
  {
    title: 'User Profiles & Reputation',
    description:
      'Comprehensive user profiles with portfolio showcase, reputation tracking, skill verification, and contribution history. Because nobody wants to hire some random ass developer with zero credibility.',
    status: {
      text: 'Not Started',
      type: 'default',
    },
  },
  {
    title: 'GitHub Integration',
    description:
      'Deep GitHub integration for importing issues as bounties, automatic PR tracking, repository linking, and code review workflows. Because manually copying shit from GitHub is fucking tedious.',
    status: {
      text: 'Not Started',
      type: 'default',
    },
  },
  {
    title: 'Community Features',
    description:
      'Team collaboration, project management tools, discussion threads, messaging system, and community governance features. All the social crap that makes people actually want to stick around.',
    status: {
      text: 'Not Started',
      type: 'default',
    },
  },
  {
    title: 'Scale & Optimize',
    description:
      "Once we nail the core features, we can build whatever the fuck we want. Advanced search, analytics dashboard, mobile app, API for integrations, and enterprise features. Sky's the limit.",
    status: {
      text: 'Future',
      type: 'info',
    },
  },
];

export const metadata: Metadata = {
  title: 'Roadmap - bounty.new',
  description:
    "See what's coming next for bounty.new - the modern bounty platform connecting developers with rewarding opportunities.",
  openGraph: {
    title: "bounty.new Roadmap - What's Coming Next",
    description:
      "See what's coming next for bounty.new - the modern bounty platform connecting developers with rewarding opportunities.",
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'bounty.new Roadmap',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "bounty.new Roadmap - What's Coming Next",
    description:
      "See what's coming next for bounty.new - the modern bounty platform connecting developers with rewarding opportunities.",
    images: ['/og-image.png'],
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="-top-40 -right-40 absolute h-96 w-96 rounded-full bg-linear-to-br from-muted/20 to-transparent blur-3xl" />
          <div className="-left-40 absolute top-1/2 h-80 w-80 rounded-full bg-linear-to-tr from-muted/10 to-transparent blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4 py-16">
          <div className="mx-auto max-w-4xl">
            <div className="mb-10 text-center">
              <Link
                href="https://github.com/bountydotnew/bounty.new"
                target="_blank"
              >
                <Badge className="mb-6 gap-2" variant="secondary">
                  <GithubIcon className="h-3 w-3" />
                  Open Source
                </Badge>
              </Link>
              <h1 className="mb-6 font-bold text-5xl tracking-tight md:text-6xl">
                Roadmap
              </h1>
              <p className="mx-auto mb-8 max-w-2xl text-muted-foreground text-xl leading-relaxed">
                What&apos;s coming next for bounty.new - no bullshit, just the
                real deal (last updated: January 20, 2025)
              </p>
            </div>
            <div className="space-y-6">
              {roadmapItems.map((item, index) => (
                <div className="relative" key={item.title}>
                  <div className="flex items-start gap-2">
                    <span className="select-none font-medium text-lg text-muted-foreground leading-normal">
                      {index + 1}.
                    </span>
                    <div className="flex-1 pt-[2px]">
                      <div className="mb-2 flex items-center gap-2">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <Badge
                          className={cn('shadow-none', {
                            'bg-green-500! text-white':
                              item.status.type === 'complete',
                            'bg-yellow-500! text-white':
                              item.status.type === 'pending',
                            'bg-blue-500! text-white':
                              item.status.type === 'info',
                            'bg-foreground/10! text-accent-foreground':
                              item.status.type === 'default',
                          })}
                        >
                          {item.status.text}
                        </Badge>
                      </div>
                      <div className="text-foreground/70 leading-relaxed">
                        <ReactMarkdown
                          components={{
                            a: ({ className, children, ...props }) => (
                              <a
                                className={cn(
                                  'text-primary hover:underline',
                                  className
                                )}
                                rel="noopener noreferrer"
                                target="_blank"
                                {...props}
                              >
                                {children}
                              </a>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-foreground">
                                {children}
                              </strong>
                            ),
                          }}
                        >
                          {item.description}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 border-muted/20 border-t pt-8">
              <div className="space-y-4 text-center">
                <h3 className="font-semibold text-xl">Want to Help?</h3>
                <p className="mx-auto max-w-2xl text-muted-foreground">
                  bounty.new is open source and built by the community. Every
                  contribution, no matter how small, helps us build something
                  that doesn&apos;t suck.
                </p>
                <div className="mt-6 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="https://github.com/bountydotnew/bounty.new"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Badge
                      className="px-4 py-2 text-sm transition-colors hover:bg-muted/50"
                      variant="outline"
                    >
                      <GithubIcon className="mr-2 h-4 w-4" />
                      Start Contributing
                    </Badge>
                  </Link>
                  <Link
                    href="https://github.com/bountydotnew/bounty.new/issues"
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    <Badge
                      className="px-4 py-2 text-sm transition-colors hover:bg-muted/50"
                      variant="outline"
                    >
                      Report Issues
                    </Badge>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
