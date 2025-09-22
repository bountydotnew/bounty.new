CRUSH.md

Build/lint/test

- Install: bun install
- Dev (all): bun run dev
- Dev web only: bun run dev:web
- Build (all via Turbo): bun run build
- Start web: bun --filter web run start
- Typecheck: bun run check-types
- Lint (web): bun --filter web run lint
- DB (Drizzle): bun run db:push | db:generate | db:migrate | db:studio
- Single test: no tests configured. If adding vitest/jest, prefer Bun+Vitest; run a single test with: bunx vitest run path/to/file.test.ts -t "test name"

Monorepo

- Package manager: Bun ("packageManager": "bun@1.x"); tasks orchestrated with Turbo (turbo.json)
- Workspaces: apps/_, packages/_; prefer bun --filter <pkg> run <script> for scoped scripts

Code style

- Language: TypeScript (strict). Prefer interfaces over types for object shapes; use generics and type guards
- Imports: path-aliases via TS configs; group: std -> deps -> workspace -> absolute -> relative; no default exports for shared libs
- Formatting: Prettier-style, 2 spaces, single quotes where applicable; keep files comment-light
- React/Next.js (App Router): server components by default; keep useEffect minimal; add error.tsx boundaries; use Image where possible
- Hooks: obey rules-of-hooks; memoize with React.memo/useMemo; create custom hooks in src/hooks; avoid side-effects in render
- State/forms: use react-hook-form with resolvers; controlled components via Controller when needed
- TRPC: validate inputs with Zod; keep routers small; use middleware for auth/ratelimits
- DB: manage schema via drizzle-kit migrations; never edit generated SQL by hand; keep queries typed
- Auth: follow better-auth best practices; never log secrets; store keys in .env; do not hardcode PostHog keys (read from env)
- Tailwind: utility-first; extract reusable UI with @apply; ensure responsive variants
- Naming: UPPER_SNAKE for constants/enums; camelCase for vars/functions; PascalCase for components/types; clear, descriptive names
- Errors: throw typed errors; handle at boundaries; avoid swallowing; surface user-safe messages; never leak secrets

Testing

- Add Vitest for units; colocate \*.test.ts; use bunx vitest; mock network/DB; snapshot only for stable UI

Cursor rules to honor

- .cursor/rules: bun, drizzle-orm, nextjs, trpc, react-hook-form, tailwindcss, useEffect, typescript, better-auth, posthog
- Follow: minimize useEffect, SSR/SSG appropriately, Zod validation, Bun PM, Drizzle migrations, never hallucinate API keys
