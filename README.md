# bounty.new

A modern bounty platform for developers and creators.

## What is bounty.new?

bounty.new connects talented developers with rewarding opportunities through structured bounties. Post tasks, complete challenges, earn rewards.

**For Contributors**
- Browse available bounties
- Submit quality work
- Get paid for your skills
- Build your reputation

**For Project Owners**
- Post bounty tasks
- Access skilled developers
- Get quality work done
- Pay only for results

## Tech Stack

**Frontend**
- Next.js 14 with App Router
- React with TypeScript
- TailwindCSS
- shadcn/ui components

**Backend**
- Next.js API routes
- tRPC for type-safe APIs
- PostgreSQL with Drizzle ORM
- Better Auth with GitHub OAuth

**Development**
- Bun runtime
- Turborepo monorepo
- TypeScript throughout

## Quick Start

**Prerequisites**
- Bun v1.0+
- PostgreSQL v14+
- Node.js v18+

**Setup**

```bash
# Clone and install
git clone https://github.com/ripgrim/bounty.new.git
cd bounty.new
bun install

# Setup database
createdb bounty_new
cp apps/server/.env.example apps/server/.env
cp apps/web/.env.example apps/web/.env

# Configure environment (edit apps/server/.env)
DATABASE_URL="postgresql://username:password@localhost:5432/bounty_new"
BETTER_AUTH_SECRET="your-secret-key"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# Initialize database and start
bun db:push
bun dev
```

**Access**
- Web: http://localhost:3001
- API: http://localhost:3000

## Project Structure

```
bounty.new/
├── apps/
│   ├── web/           # Frontend application
│   │   ├── src/
│   │   │   ├── app/           # App router pages
│   │   │   ├── components/    # UI components
│   │   │   └── lib/           # Utilities and hooks
│   │   └── ...
│   └── server/        # Backend API
│       ├── src/
│       │   ├── app/           # API routes
│       │   ├── db/            # Database schema
│       │   ├── lib/           # Server utilities
│       │   └── routers/       # tRPC routers
│       └── ...
├── packages/          # Shared packages
└── docs/             # Documentation
```

## Available Commands

**Development**
```bash
bun dev              # Start all apps
bun dev:web          # Frontend only
bun dev:server       # Backend only
bun build            # Build for production
```

**Database**
```bash
bun db:push          # Apply schema changes
bun db:studio        # Open database UI
bun db:generate      # Generate migrations
```

**Quality**
```bash
bun check-types      # Type checking
bun lint             # Code linting
bun test             # Run tests
```

## Environment Setup

**Server (.env)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/bounty_new"
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

**Web (.env)**
```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3001"
```

## GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Secret to your `.env` file

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `bun test`
5. Submit a pull request

**Guidelines**
- Follow TypeScript best practices
- Write tests for new features
- Keep components focused
- Use semantic commits

## Deployment

**Vercel**
1. Connect GitHub repository
2. Configure environment variables
3. Deploy on push to main

**Self-hosting**
1. Build: `bun build`
2. Setup PostgreSQL
3. Configure environment
4. Start: `bun start`

## Links

- [Issues](https://github.com/ripgrim/bounty.new/issues)
- [Discussions](https://github.com/ripgrim/bounty.new/discussions)
- [License](LICENSE)

---

Ready to earn? Start contributing to bounty.new.
