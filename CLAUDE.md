# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development**
```bash
# Start development server
bun dev

# Build the entire project
bun build

# Type checking across all packages
bun check-types

# Format code with ultracite
bun prettier
```

**Database Operations**
```bash
# Push database schema changes
bun db:push

# Open Drizzle Studio
bun db:studio

# Generate migrations
bun db:generate

# Run migrations
bun db:migrate
```

**Package-specific Commands**
```bash
# Run only the web app in development
bun dev:web

# Work with specific packages using turbo filters
turbo -F @bounty/db db:push
```

## Architecture Overview

**Monorepo Structure**
- Turborepo monorepo with Bun as package manager
- `apps/web/` - Next.js 15 application with App Router
- `packages/` - Shared packages across the application

**Core Packages**
- `@bounty/db` - Drizzle ORM with PostgreSQL, schema definitions
- `@bounty/api` - tRPC API routes and business logic
- `@bounty/auth` - Better Auth with GitHub OAuth integration  
- `@bounty/track` - Analytics and tracking utilities
- `@bounty/dev-logger` - Development logging utilities

**Frontend Stack**
- Next.js 15 with App Router and Turbopack
- React 19 with TypeScript
- TailwindCSS v4 with shadcn/ui components
- tRPC for type-safe API calls with React Query
- React Hook Form with Zod validation

**Backend & Data**
- PostgreSQL with Drizzle ORM
- Better Auth for authentication (GitHub OAuth)
- tRPC API routes organized by feature in `packages/api/src/routers/`
- Rate limiting with Unkey

**Key Features**
- Bounty system with profiles, applications, and notifications
- Admin panel with notification management
- Early access/beta application system
- GitHub integration for repository linking
- Billing integration with payment processing

## Database Schema

Core entities include:
- `auth` - User authentication and sessions
- `profiles` - User profile information  
- `bounties` - Bounty postings and management
- `beta-applications` - Beta access application system
- `notifications` - User notification system
- `passkey` - Passkey authentication support

## Code Standards

**TypeScript Guidelines** (from .cursor/rules)
- Use strict null checks and prefer interfaces over types
- Implement type guards for better type safety
- Utilize generics for reusable components

**Drizzle ORM Best Practices**
- Use migrations for schema changes
- Leverage TypeScript's type safety with clear model definitions
- Use query builders for complex queries

**Formatting & Linting**
- Code formatting handled by ultracite (extends Biome)
- Pre-commit hooks managed by lefthook
- Lint-staged runs formatting on staged files

## Development Notes

**Authentication Flow**
- Better Auth handles GitHub OAuth
- Session management and user profiles
- Passkey support for additional security

**API Architecture**  
- tRPC routers organized by feature domain
- Rate limiting on API endpoints
- Proper error handling and validation with Zod

**Environment Setup**
- Requires PostgreSQL database (suggest Neon for cloud)
- GitHub OAuth app for authentication
- Various API keys for integrations (Marble CMS, PostHog, etc.)

**Testing**
- Run tests with: `bun test`
- Type checking: `bun check-types`