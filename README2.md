# bounty.new 🎯

> **Ship fast. Get paid faster.**

A modern, full-stack bounty platform that connects developers with rewarding opportunities through structured challenges. Built for speed, scale, and seamless integration.

## 🌟 Overview

bounty.new is a comprehensive bounty management platform where:
- **Project Owners** post coding challenges and tasks with monetary rewards
- **Developers** browse, apply, and submit solutions to earn payments
- **Everyone** benefits from a transparent, efficient, and secure workflow

### Core Value Proposition
- ⚡ **Instant Payouts** - Get paid immediately upon approval
- 🔗 **GitHub Integration** - Import issues directly as bounties
- 🛡️ **Zero Friction** - Streamlined workflow from posting to payment
- 📊 **Reputation System** - Build credibility through successful completions

## 🏗️ Architecture

### Tech Stack

**Frontend**
- **Next.js 14** with App Router for modern React development
- **TypeScript** throughout for type safety
- **TailwindCSS** + **shadcn/ui** for beautiful, consistent design
- **React Hook Form** + **Zod** for bulletproof form validation
- **Recharts** for data visualization

**Backend**
- **tRPC** for end-to-end type-safe APIs
- **PostgreSQL** with **Drizzle ORM** for robust data management
- **Better Auth** with GitHub OAuth and passkey support
- **Polar.sh** integration for billing and subscriptions

**Infrastructure**
- **Turborepo** monorepo for organized, scalable development
- **Bun** runtime for blazing-fast builds and package management
- **Vercel** deployment with edge functions
- **Neon** PostgreSQL hosting

### Project Structure

```
bounty.new/
├── apps/
│   └── web/                    # Main Next.js application
│       ├── src/
│       │   ├── app/           # App Router pages and layouts
│       │   ├── components/    # Reusable UI components
│       │   ├── lib/          # Utilities and shared logic
│       │   └── types/        # TypeScript type definitions
│       └── public/           # Static assets
├── packages/
│   ├── api/                  # tRPC API layer
│   ├── auth/                 # Authentication configuration
│   ├── db/                   # Database schema and migrations
│   ├── env/                  # Environment variable validation
│   └── [shared configs]/    # ESLint, TypeScript configs
└── [config files]          # Root workspace configuration
```

## 🚀 Core Features

### 🎯 Bounty Management
- **Create Bounties** - Rich editor with GitHub issue import
- **Smart Filtering** - Search by difficulty, tags, amount, status
- **Real-time Updates** - Live status changes and notifications
- **Version Control Integration** - Link to repositories and PRs

### 👤 User System
- **GitHub OAuth** - Seamless authentication
- **Passkey Support** - Passwordless login option
- **User Profiles** - Showcase skills, rates, and availability
- **Reputation Tracking** - Success rates, completion history, ratings

### 💰 Payment & Billing
- **Polar Integration** - Secure payment processing
- **Instant Payouts** - Immediate reward distribution
- **Pro Subscriptions** - Enhanced features and lower fees
- **Usage Tracking** - Monitor limits and usage metrics

### 🔐 Access Control
- **Beta Access System** - Staged rollout with application process
- **Role-based Permissions** - Admin, user, and contributor roles
- **Feature Gating** - Granular access to platform features

### 📱 User Experience
- **Responsive Design** - Perfect on mobile, tablet, and desktop
- **Dark Mode Support** - System preference detection
- **Progressive Enhancement** - Works without JavaScript
- **Accessibility** - WCAG compliant interface

## 🗄️ Database Schema

### Core Entities

**Users (`user`)**
```sql
- id, name, email, image
- hasAccess, betaAccessStatus, accessStage
- role, createdAt, updatedAt
```

**Bounties (`bounty`)**
```sql
- id, title, description, amount, currency
- status, difficulty, deadline, tags
- repositoryUrl, issueUrl
- createdById, assignedToId
- createdAt, updatedAt
```

**Submissions (`submission`)**
```sql
- id, bountyId, contributorId
- description, deliverableUrl, pullRequestUrl
- status, reviewNotes
- submittedAt, reviewedAt
```

**User Profiles (`user_profile`)**
```sql
- userId, bio, location, website
- skills, preferredLanguages, hourlyRate
- timezone, availableForWork
```

**Reputation System (`user_reputation`)**
```sql
- userId, totalEarned, bountiesCompleted
- averageRating, successRate, responseTime
```

### Access & Applications

**Beta Applications (`beta_application`)**
```sql
- userId, name, twitter, projectName
- projectLink, description, status
- reviewedBy, reviewedAt, reviewNotes
```

**Authentication (`session`, `account`, `verification`)**
- Better Auth managed tables for secure session handling

## 🎨 Key Components

### Bounty Flow
1. **Creation** - `CreateBountyModal` with form validation
2. **Browse** - `BountiesFeed` with filtering and pagination
3. **Detail** - `BountyDetailPage` with submissions sidebar
4. **Edit** - `EditBountyModal` for bounty owners

### User Interface
- **Smart Navigation** - Context-aware breadcrumbs
- **Responsive Layouts** - Mobile-first design patterns
- **Loading States** - Skeleton loaders and spinners
- **Error Boundaries** - Graceful error handling

### Business Logic
- **Form Validation** - Zod schemas with error handling
- **State Management** - React Query for server state
- **Real-time Updates** - Optimistic updates and cache invalidation
- **Permission Checks** - Access gates and role validation

## 🔧 Development

### Prerequisites
- **Bun** v1.0+ (runtime and package manager)
- **PostgreSQL** v14+ (database)
- **Node.js** v18+ (for compatibility)

### Environment Setup

1. **Clone and Install**
```bash
git clone https://github.com/bountydotnew/bounty.new.git
cd bounty.new
bun install
```

2. **Database Configuration**
```bash
# Get a database URL from https://neon.new
# Configure environment variables
DATABASE_URL="postgresql://username:password@localhost:5432/bounty_new"
```

3. **Authentication Setup**
```bash
# GitHub OAuth (https://github.com/settings/developers)
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
BETTER_AUTH_SECRET="your-secret-key"
```

4. **Additional Services**
```bash
# CMS Integration
NEXT_PUBLIC_MARBLE_API_URL="https://api.marblecms.com"
MARBLE_WORKSPACE_KEY="your-workspace-key"

# Billing (optional for development)
POLAR_ACCESS_TOKEN="your-polar-token"
POLAR_WEBHOOK_SECRET="your-webhook-secret"
```

### Development Workflow

```bash
# Initialize database
bun db:push

# Start development server
bun dev

# Available at http://localhost:3000

# Other useful commands
bun db:studio          # Database browser
bun db:generate         # Generate migrations
bun build              # Production build
bun check-types        # Type checking
```

### Package Commands

```bash
# Workspace-specific commands
bun dev:web            # Start only web app
bun db:push            # Database migrations
bun db:studio          # Database GUI
```

## 🌍 Deployment

### Production Environment

**Vercel Deployment**
- Automatic deployments from `main` branch
- Environment variables configured in dashboard
- Edge functions for optimal performance

**Database**
- Neon PostgreSQL for production
- Automatic backups and scaling
- Connection pooling enabled

**Monitoring**
- DataBuddy analytics integration
- Error tracking and performance monitoring
- Real-time user behavior insights

## 🤝 Contributing

### Development Guidelines

**Code Standards**
- TypeScript for all new code
- ESLint + Biome for formatting
- Conventional commits for clear history
- Component-driven development

**Testing Strategy**
- Type safety with TypeScript
- Runtime validation with Zod
- Manual testing for user flows
- Performance monitoring in production

**PR Process**
1. Create feature branch from `main`
2. Implement changes with proper typing
3. Ensure all type checks pass
4. Submit PR with clear description
5. Address review feedback
6. Merge after approval

### Feature Development

**New Components**
- Follow existing patterns in `/components`
- Use TypeScript interfaces for props
- Implement responsive design
- Add proper error handling

**API Endpoints**
- Add to appropriate router in `/packages/api`
- Use tRPC procedures with Zod validation
- Handle errors gracefully
- Document complex logic

**Database Changes**
- Create migration files
- Update schema definitions
- Test with sample data
- Consider performance implications

## 📋 Current Status

### ✅ Completed Features
- User authentication with GitHub OAuth
- Bounty creation and management system
- Submission workflow with review process
- Beta access control and applications
- Responsive UI with dark mode support
- Payment integration foundation
- GitHub issue import functionality

### 🚧 In Development
- Advanced filtering and search
- Real-time notifications
- Enhanced reputation system
- Mobile app considerations
- Advanced analytics dashboard

### 🔮 Future Roadmap
- Multi-language support
- Advanced payment methods
- API for third-party integrations
- Machine learning for matching
- Community features and forums

## 🔗 Key Integrations

**GitHub**
- OAuth authentication
- Issue import as bounties
- Repository linking
- Pull request tracking

**Polar.sh**
- Subscription management
- Payment processing
- Usage tracking
- Webhook handling

**Marble CMS**
- Blog content management
- Dynamic content delivery
- SEO optimization

**DataBuddy**
- Privacy-focused analytics
- User behavior insights
- Performance tracking

## 📖 API Reference

### tRPC Routers

**Bounties (`bounties`)**
- `createBounty` - Create new bounty
- `updateBounty` - Modify existing bounty
- `fetchBounties` - List with filtering
- `fetchBountyById` - Get specific bounty
- `deleteBounty` - Remove bounty

**Users (`user`)**
- `getUserProfile` - Fetch user data
- `updateProfile` - Modify user info
- `getUserReputation` - Get reputation stats

**Beta Applications (`beta-applications`)**
- `submitApplication` - Apply for beta access
- `getApplicationStatus` - Check current status
- `reviewApplication` - Admin review process

**Billing (`billing`)**
- `getCustomer` - Fetch billing info
- `createCheckout` - Initiate payment
- `getUsage` - Track feature usage

### Form Schemas

**CreateBountyForm**
```typescript
{
  title: string (1-200 chars)
  description: string (10-1000 chars)
  amount: string (regex validated)
  currency: string (default: "USD")
  difficulty: "beginner" | "intermediate" | "advanced" | "expert"
  deadline?: string (datetime)
  tags?: string[]
  repositoryUrl?: string (URL)
  issueUrl?: string (URL)
}
```

## 🛠️ Troubleshooting

### Common Issues

**Database Connection**
- Verify `DATABASE_URL` format
- Check network connectivity
- Ensure database exists

**Authentication**
- Verify GitHub OAuth app settings
- Check callback URL configuration
- Validate secret keys

**Build Errors**
- Run `bun install` to update dependencies
- Clear `.next` cache folder
- Check TypeScript errors

### Development Tips

**Performance**
- Use React Query for data fetching
- Implement proper loading states
- Optimize bundle size with dynamic imports

**UI/UX**
- Test on multiple screen sizes
- Ensure keyboard navigation works
- Validate color contrast ratios

**Security**
- Never expose secrets in client code
- Validate all user inputs
- Use proper CORS settings

---

## 🏆 Credits

Built with ❤️ by the bounty.new team

**Special Thanks:**
- [Vercel](https://vercel.com) - OSS Program support
- [Neon](https://neon.tech) - Database hosting
- [Polar.sh](https://polar.sh) - Payment infrastructure
- [Marble](https://marblecms.com) - Content management
- [DataBuddy](https://databuddy.cc) - Privacy-focused analytics

---

**Ready to start earning? Visit [bounty.new](https://bounty.new) and join the future of freelance development! 🚀**

