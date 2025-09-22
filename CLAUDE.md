# AGENT.md

# AGENT.md - bounty.new Codebase Guide

## Build/Lint/Test Commands
- `bun dev` - Start all apps (web + database)
- `bun dev:web` - Frontend only (port 3001) 
- `bun build` - Build for production
- `bun check-types` - TypeScript type checking
- `bun lint` - ESLint (via Next.js)
- `bun test` - Run tests (Bun's built-in test runner, minimal tests currently)
- `bun db:push` - Apply database schema changes
- `bun db:studio` - Open Drizzle Studio (database UI)
- `bun db:generate` - Generate database migrations

## Architecture & Structure
- **Turborepo monorepo** with apps/ (web frontend) and packages/ (shared libs)
- **Frontend**: Next.js 15 + React 19 + TypeScript + TailwindCSS + shadcn/ui
- **Backend**: tRPC API + PostgreSQL + Drizzle ORM + Better Auth (GitHub OAuth)
- **Database**: PostgreSQL with Drizzle schema in packages/db/
- **Shared packages**: @bounty/api (tRPC routers), @bounty/db (schema), @bounty/auth

## Package Structure & File Patterns
- **@bounty/auth**: `client.ts` (React auth), `server.ts` (Better Auth config)
  - GitHub OAuth + Passkeys + Polar payment integration
  - Exports: `./client` and `./server` for clean imports
- **@bounty/db**: Database schemas in `src/schema/` by domain
  - `auth.ts` (user, session, account), `bounties.ts`, `profiles.ts`, `passkey.ts`, `beta-applications.ts`
  - All schemas exported through `src/index.ts` with wildcard exports
- **@bounty/api**: tRPC routers in `src/routers/` by domain
  - `user.ts`, `bounties.ts`, `profiles.ts`, `notifications.ts`, `news.ts`, `early-access.ts`, `beta-applications.ts`
  - Main router in `routers/index.ts` combines all sub-routers
- **@bounty/env**: Environment variable validation
- **@bounty/eslint-config**: Shared ESLint configs (base, next, react)

## Database Schema Patterns
- **Tables**: snake_case (`created_at`, `beta_access_status`)
- **Enums**: pgEnum for status fields (`bounty_status`, `submission_status`, `difficulty`)
- **Relations**: Foreign keys with cascade/set null (`onDelete: "cascade"`)
- **Timestamps**: `created_at`, `updated_at` with `sql\`now()\`` defaults
- **IDs**: `gen_random_uuid()` for primary keys, text references for foreign keys

## tRPC Router Patterns
- **Procedures**: `publicProcedure`, `protectedProcedure`, `adminProcedure`
- **Validation**: Zod schemas for input validation
- **Returns**: Consistent `{ success: true, data: ... }` patterns
- **Errors**: TRPCError with proper status codes
- **Organization**: Domain-based routers exported through main `appRouter`

## Code Style & Conventions
- **Files**: kebab-case (user-profile.ts), **Variables**: camelCase, **Types**: PascalCase
- **Imports**: External libs first, then @bounty/* packages, then relative imports
- **Strings**: Double quotes, **Functions**: Arrow functions with export const
- **Components**: shadcn/ui patterns with cn() utility for className merging

