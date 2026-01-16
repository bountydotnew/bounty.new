import { BountyCard } from '@/components/bounty/bounty-card';
import SubmissionCard from '@/components/bounty/submission-card';
import { GithubIcon } from '@/components/icons';
import { Zap, Shield, Globe, Code2, Users, ArrowRight } from 'lucide-react';
import { cn } from '@bounty/ui/lib/utils';
import Link from 'next/link';

// Mock data for the showcase
const MOCK_BOUNTY = {
  id: '1',
  title: 'Implement virtual scrolling for large lists',
  amount: 500,
  currency: 'USD',
  status: 'open' as const,
  creator: {
    id: '1',
    name: 'Sarah Chen',
    image: 'https://avatars.githubusercontent.com/u/1?v=4',
  },
  repository: {
    id: '1',
    name: 'frontend-core',
    owner: {
      login: 'acme-inc',
    },
  },
  repositoryUrl: 'https://github.com/acme-inc/frontend-core',
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  bountyContext: 'full',
};

const MOCK_SUBMISSION = {
  user: 'Alex Rivera',
  description: "I've implemented the virtualization using react-window. Performance improved by 300%.",
  avatarSrc: 'https://avatars.githubusercontent.com/u/2?v=4',
  rank: 'Rank 42',
  hasBadge: true,
  previewSrc: 'https://github.com/shadcn.png', // Placeholder image
};

function FeatureSection({
  title,
  description,
  align = 'left',
  children,
}: {
  title: string;
  description: string;
  align?: 'left' | 'right';
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className={cn("grid gap-16 lg:grid-cols-2 lg:items-center", align === 'right' && "lg:[direction:rtl]")}>
        <div className={cn("flex flex-col gap-8", align === 'right' && "lg:[direction:ltr]")}>
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {title}
          </h2>
          <p className="text-xl leading-relaxed text-zinc-400">
            {description}
          </p>
        </div>
        <div className={cn("relative flex items-center justify-center rounded-3xl bg-white/5 p-8 ring-1 ring-inset ring-white/10", align === 'right' && "lg:[direction:ltr]")}>
           <div className="absolute inset-0 -z-10 bg-[radial-gradient(40%_40%_at_50%_50%,rgba(255,255,255,0.05),transparent)]" />
          {children}
        </div>
      </div>
    </div>
  );
}

function GridFeature({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-8 transition-all hover:bg-white/10 hover:scale-[1.02]">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      <p className="text-zinc-400 leading-relaxed">{description}</p>
    </div>
  );
}

export function Features() {
  return (
    <div className="flex flex-col gap-0 bg-[#0A0A0A]">
      
      {/* Feature 1: Create Bounties */}
      <FeatureSection
        title="Turn backlog issues into completed features"
        description="Stop letting important issues rot in your backlog. Post a bounty, set your price, and watch as the community delivers production-ready code."
      >
         <div className="w-full max-w-md transform transition-transform hover:scale-105 duration-500">
            <div className="pointer-events-none select-none">
               <BountyCard bounty={MOCK_BOUNTY} stats={{ commentCount: 5, voteCount: 12, submissionCount: 3, isVoted: false, bookmarked: false }} />
            </div>
         </div>
      </FeatureSection>

      {/* Feature 2: Earn */}
      <FeatureSection
        title="Get paid to write code"
        description="Browse thousands of open bounties. Pick one that matches your skills, submit a PR, and get paid instantly upon merge."
        align="right"
      >
        <div className="w-full max-w-md transform transition-transform hover:scale-105 duration-500">
           <div className="pointer-events-none select-none">
             <SubmissionCard {...MOCK_SUBMISSION} className="w-full max-w-full" />
           </div>
        </div>
      </FeatureSection>

      {/* Seamless Integration Section */}
      <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 hidden lg:hidden md:hidden opacity-0">
        <div className="relative overflow-hidden rounded-[40px] bg-zinc-900/30 px-6 py-24 text-center ring-1 ring-white/10 sm:px-16">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_50%)]" />
          
          <h2 className="mx-auto max-w-2xl font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Seamless Integration
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl leading-relaxed text-zinc-400">
            bounty.new lives where you work. We sync directly with GitHub issues and PRs so you never have to leave your workflow.
          </p>
          
          <div className="mt-16 flex items-center justify-center">
            <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-[#0A0A0A] ring-1 ring-white/10 shadow-2xl">
              <GithubIcon className="h-16 w-16 fill-white" />
              {/* Connection lines (decorative) */}
              <div className="absolute -left-24 top-1/2 h-px w-24 bg-gradient-to-r from-transparent to-white/20" />
              <div className="absolute -right-24 top-1/2 h-px w-24 bg-gradient-to-l from-transparent to-white/20" />
              
              {/* Floating "nodes" */}
              <div className="absolute -left-28 top-1/2 h-3 w-3 rounded-full bg-white/20" />
              <div className="absolute -right-28 top-1/2 h-3 w-3 rounded-full bg-white/20" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid Stats/Benefits - Improved Boxes */}
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8 hidden lg:hidden md:hidden opacity-0">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GridFeature 
            icon={Zap} 
            title="Instant Payouts" 
            description="No waiting for net-30 terms. Payments are processed immediately upon PR merge." 
          />
          <GridFeature 
            icon={Globe} 
            title="Global Talent Pool" 
            description="Access thousands of verified developers from around the world ready to tackle your issues." 
          />
          <GridFeature 
            icon={Shield} 
            title="Secure Payments" 
            description="Funds are held securely until the work is verified and merged. 100% safe." 
          />
           <GridFeature 
            icon={Code2} 
            title="Code Quality First" 
            description="Our automated checks and community review process ensure high quality contributions." 
          />
           <GridFeature 
            icon={Users} 
            title="Community Driven" 
            description="Build a community around your project by rewarding contributors fairly." 
          />
           {/* Removed Crypto/Fiat box as requested, kept 5 items or we can add a 6th filler if needed, 
               but 5 looks fine in grid if handled or we can add one more */}
           <GridFeature 
            icon={ArrowRight} 
            title="Start Building" 
            description="Ready to get started? Join thousands of developers and companies building on bounty.new today." 
          />
        </div>
      </div>

      {/* Trusted by developers - Interactive Logo Wall */}
      <div className="mx-auto max-w-7xl px-6 py-32 lg:px-8 text-center overflow-hidden hidden lg:hidden md:hidden opacity-0">
         <h2 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl mb-12">
            Trusted by developers at
         </h2>
         
         <div className="relative mx-auto h-auto max-w-[1000px] group cursor-pointer">
            <Link href="/login">
               <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className="inline-flex gap-x-2 items-center justify-center whitespace-nowrap ring-1 ring-inset relative rounded-full w-auto transition-transform duration-200 overflow-hidden bg-white text-black ring-black/10 backdrop-blur-xs px-6 py-3 text-sm font-medium shadow-xl">
                     This could be you
                     <ArrowRight className="w-4 h-4" />
                  </div>
               </div>
            </Link>

            <div className="grid w-full items-center gap-y-12 gap-x-8 grid-cols-3 lg:grid-cols-5 transition-all duration-300 group-hover:blur-sm group-hover:opacity-50">
               {/* Logo 1: Vercel (using text/svg placeholder logic for now, ideally actual SVGs) */}
               <div className="flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 1155 1000" className="h-8 w-auto fill-white" xmlns="http://www.w3.org/2000/svg"><path d="m577.3 0 577.4 1000H0z"/></svg>
               </div>

               {/* Logo 2: Supabase */}
               <div className="flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                  <img src="https://supabase.com/dashboard/img/supabase-logo.svg" alt="Supabase" className="h-8 w-auto opacity-90 invert filter" />
               </div>

               {/* Logo 3: Linear */}
               <div className="flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                  <svg viewBox="0 0 24 24" className="h-8 w-auto fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M1.5 0C0.671573 0 0 0.671573 0 1.5V22.5C0 23.3284 0.671573 24 1.5 24H22.5C23.3284 24 24 23.3284 24 22.5V1.5C24 0.671573 23.3284 0 22.5 0H1.5ZM17.265 6.73309C15.919 8.16509 13.2233 11.0032 10.5464 13.8247L8.73482 11.8964L6.73328 13.7766L10.5464 17.8363L19.2665 8.6132L17.265 6.73309Z"/></svg>
               </div>
               
               {/* Logo 4: Resend */}
               <div className="flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                   <img src="https://resend.com/static/brand/resend-icon-white.svg" alt="Resend" className="h-8 w-auto" />
               </div>

               {/* Logo 5: Stripe */}
               <div className="flex items-center justify-center opacity-50 hover:opacity-100 transition-opacity">
                   <svg viewBox="0 0 32 32" className="h-10 w-auto fill-white" xmlns="http://www.w3.org/2000/svg"><path d="M12.28 10.66c0-2.16 1.8-3.12 4.66-3.12 2.6 0 5.18.76 5.18.76l.72-4.08s-2.2-.82-5.48-.82c-5.3 0-9.14 2.7-9.14 7.62 0 7.6 10.52 6.32 10.52 9.58 0 2.18-1.94 3.24-5.02 3.24-2.96 0-6.1-1.06-6.1-1.06l-.88 4.34s2.78 1.04 6.5 1.04c5.5 0 9.66-2.62 9.66-7.76 0-8.12-10.62-6.68-10.62-9.74z"/></svg>
               </div>
            </div>
         </div>
      </div>

    </div>
  );
}
