# AGENTS.md

## Cursor Cloud specific instructions

### Overview

bounty.new is a **Turborepo monorepo** using **Bun** (`bun@1.2.17`) as the package manager. The main product is a **Next.js 16 web app** at `apps/web`; there is also an optional Discord bot at `apps/discord-bot`.

### Running the dev server

```bash
bun dev:web       # starts just the web app (Next.js + Turbopack on port 3000)
bun dev           # starts all packages except the Discord bot (also runs @react-grab/cursor telemetry first)
```

The `bun dev` script includes `npx @react-grab/cursor@latest` before starting turbo. Prefer `bun dev:web` for a cleaner startup.

### Database

A local PostgreSQL 16 instance is used. The database is `bounty_new` on `localhost:5432` (user: `postgres`, password: `postgres`). Start PostgreSQL before running the app:

```bash
sudo pg_ctlcluster 16 main start
```

After installing new schema changes, push with `bun db:push`.

### Environment variables

A `.env` file in the project root provides all required env vars. Many external service keys (Stripe, Resend, Upstash, PostHog, Autumn) use **placeholder values** — the app starts and serves pages, but features depending on those services (payments, email, analytics, rate limiting) will not fully work without real credentials.

The env validation (`packages/env/src/server.ts` and `client.ts`) uses `@t3-oss/env-nextjs` with `skipValidation: false`, so all non-optional env vars must be present and pass Zod validation.

### Lint and format

- `bun prettier` — runs `ultracite format` (Biome-based). The codebase has pre-existing lint/format issues; the command runs but exits non-zero.
- Pre-commit hook (`.husky/pre-commit`) runs `npx ultracite format` via lint-staged.

### Type checking

- `bun check:web` — runs `tsc --noEmit` for the web app (via turborepo). Pre-existing type errors exist in `packages/ui`.

### Build

- `bun run build` — runs a production build. Currently fails due to a pre-existing type error in `apps/web/src/components/settings/payment-settings.tsx`.

### Key paths

| Path | Purpose |
|---|---|
| `apps/web` | Next.js web app |
| `apps/discord-bot` | Discord bot (optional) |
| `packages/db` | Drizzle ORM schema + migrations |
| `packages/env` | Type-safe env var validation |
| `packages/api` | tRPC API layer |
| `packages/auth` | Better Auth config |
| `packages/ui` | Shared UI components |
