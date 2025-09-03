import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { GithubIcon } from "@/components/icons";
import Link from "next/link";
import { Footer } from "@/components/sections/home/footer";
import { Header } from "@/components/sections/home/header";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

const roadmapItems: {
  title: string;
  description: string;
  status: {
    text: string;
    type: "complete" | "pending" | "default" | "info";
  };
}[] = [
  {
    title: "Start",
    description:
      "This is where it all fucking started. Repository created, initial project structure, and the vision for a bounty platform that doesn't suck. [Check out the announcement](https://x.com/rincidium/status/1937110780853588342) where I basically said 'fuck it, let's build this thing'.",
    status: {
      text: "Completed",
      type: "complete",
    },
  },
  {
    title: "Core Platform",
    description:
      "Built the foundation - authentication with GitHub OAuth, database schema with PostgreSQL & Drizzle ORM, tRPC API setup, and modern Next.js 14 app structure. Basically all the boring shit that makes everything else possible.",
    status: {
      text: "Completed",
      type: "complete",
    },
  },
  {
    title: "Bounty System",
    description:
      "The heart of any bounty platform. Create bounties, browse available tasks, application system, difficulty levels, and submission workflow. **This shit has to work perfectly** or the whole platform is useless.",
    status: {
      text: "In Progress",
      type: "pending",
    },
  },
  {
    title: "Payment Integration",
    description:
      "Integration with payment providers for secure transactions. Escrow system for bounty funds, automatic payouts, and billing management. Nobody gives a shit about your platform if they can't get paid reliably.",
    status: {
      text: "In Progress",
      type: "pending",
    },
  },
  {
    title: "User Profiles & Reputation",
    description:
      "Comprehensive user profiles with portfolio showcase, reputation tracking, skill verification, and contribution history. Because nobody wants to hire some random ass developer with zero credibility.",
    status: {
      text: "Not Started",
      type: "default",
    },
  },
  {
    title: "GitHub Integration",
    description:
      "Deep GitHub integration for importing issues as bounties, automatic PR tracking, repository linking, and code review workflows. Because manually copying shit from GitHub is fucking tedious.",
    status: {
      text: "Not Started",
      type: "default",
    },
  },
  {
    title: "Community Features",
    description:
      "Team collaboration, project management tools, discussion threads, messaging system, and community governance features. All the social crap that makes people actually want to stick around.",
    status: {
      text: "Not Started",
      type: "default",
    },
  },
  {
    title: "Scale & Optimize",
    description:
      "Once we nail the core features, we can build whatever the fuck we want. Advanced search, analytics dashboard, mobile app, API for integrations, and enterprise features. Sky's the limit.",
    status: {
      text: "Future",
      type: "info",
    },
  },
];

export const metadata: Metadata = {
  title: "Roadmap - bounty.new",
  description:
    "See what's coming next for bounty.new - the modern bounty platform connecting developers with rewarding opportunities.",
  openGraph: {
    title: "bounty.new Roadmap - What's Coming Next",
    description:
      "See what's coming next for bounty.new - the modern bounty platform connecting developers with rewarding opportunities.",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "bounty.new Roadmap",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "bounty.new Roadmap - What's Coming Next",
    description:
      "See what's coming next for bounty.new - the modern bounty platform connecting developers with rewarding opportunities.",
    images: ["/og-image.png"],
  },
};

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-linear-to-br from-muted/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-40 w-80 h-80 bg-linear-to-tr from-muted/10 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <Link
                href="https://github.com/ripgrim/bounty.new"
                target="_blank"
              >
                <Badge variant="secondary" className="gap-2 mb-6">
                  <GithubIcon className="h-3 w-3" />
                  Open Source
                </Badge>
              </Link>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
                Roadmap
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                What's coming next for bounty.new - no bullshit, just the real deal (last updated: January 20, 2025)
              </p>
            </div>
            <div className="space-y-6">
              {roadmapItems.map((item, index) => (
                <div key={index} className="relative">
                  <div className="flex items-start gap-2">
                    <span className="text-lg font-medium text-muted-foreground select-none leading-normal">
                      {index + 1}.
                    </span>
                    <div className="flex-1 pt-[2px]">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{item.title}</h3>
                        <Badge
                          className={cn("shadow-none", {
                            "bg-green-500! text-white":
                              item.status.type === "complete",
                            "bg-yellow-500! text-white":
                              item.status.type === "pending",
                            "bg-blue-500! text-white":
                              item.status.type === "info",
                            "bg-foreground/10! text-accent-foreground":
                              item.status.type === "default",
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
                                  "text-primary hover:underline",
                                  className
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
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

            <div className="mt-12 pt-8 border-t border-muted/20">
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Want to Help?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  bounty.new is open source and built by the community. Every
                  contribution, no matter how small, helps us build something that doesn't suck.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                  <Link
                    href="https://github.com/ripgrim/bounty.new"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge
                      variant="outline"
                      className="text-sm px-4 py-2 hover:bg-muted/50 transition-colors"
                    >
                      <GithubIcon className="h-4 w-4 mr-2" />
                      Start Contributing
                    </Badge>
                  </Link>
                  <Link
                    href="https://github.com/ripgrim/bounty.new/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Badge
                      variant="outline"
                      className="text-sm px-4 py-2 hover:bg-muted/50 transition-colors"
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
