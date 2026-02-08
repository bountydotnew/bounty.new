# Organizations (Teams)

## Decisions (finalized)

### Terminology
- Backend/schema: "organization" / "org"
- Frontend/UI: "team"
- Every user gets a **personal team** at signup, named `{handle}'s team`

### Architecture: Better Auth Organization Plugin
We use Better Auth's built-in `organization` plugin instead of hand-rolling org/member/invitation tables. This gives us:
- `organization` table (id, name, slug, logo, metadata, createdAt) + our `additionalFields`
- `member` table (id, userId, organizationId, role, createdAt)
- `invitation` table (id, email, inviterId, organizationId, role, status, expiresAt, createdAt)
- `session.activeOrganizationId` for tracking which org the user is working in
- Full CRUD API (create, update, delete, list orgs)
- Member management (add, remove, update role, leave)
- Invitation flow (invite, accept, reject, cancel) with email hook
- Access control system (roles, permissions, `hasPermission`)
- Client hooks (`useActiveOrganization`, `useListOrganizations`)
- Active org switching (`setActive` persists in session)
- Slug validation (`checkSlug`)

### Custom fields on `organization` table (via `additionalFields`)
- `isPersonal` (boolean, NOT NULL, default false) — marks the auto-created personal team
- `stripeCustomerId` (string, nullable) — Stripe customer for bounty payments

### Scoping rules

| Resource | Scope | Notes |
|---|---|---|
| Bounties | **Org** | `bounty.organizationId` added. `createdById` kept for audit. Any org member can manage. |
| GitHub installations | **Org** | `githubInstallation.organizationId` added. Keep existing `githubAccountId` FK for audit trail. Only owners install/remove. Persists when linker leaves. |
| Linear accounts | **Org** | `linearAccount.organizationId` added. Keep existing `accountId` FK. Same pattern as GitHub. |
| Discord guilds | **Org** | `discordGuild.organizationId` added. Same pattern. |
| Billing (Autumn plans) | **Org** | Each org has its own plan. `concurrent_bounties` + `feeFreeAllowance` counted per-org. Personal team starts on free. |
| Stripe Connect (payouts) | **User** | Solver's bank account is personal. Stays on `user.stripeConnectAccountId`. |
| Stripe Customer (payments) | **Org** | `organization.stripeCustomerId` — the org pays for bounties. |
| Account settings | **User** | Profile, email, avatar. |
| Security settings | **User** | Password, sessions, passkeys. |
| Payment settings | **User** | Stripe Connect onboarding (for solvers). |
| Billing settings | **Org** | Plan management via Autumn. Route: `[slug]/settings/billing`. |
| Integration settings | **Org** | Route: `[slug]/integrations`. |
| Members | **Org** | New page. Route: `[slug]/settings/members`. |
| Notifications | **User** | Personal. Fan-out: org events create one notification per org member. |

### Routing

| Route | Scoped? | Notes |
|---|---|---|
| `/dashboard` | No | Personal dashboard, aggregates across all user's orgs |
| `/bounties` | No | Browse/discover bounties (public feed) |
| `/bounty/[id]` | No | Single bounty view |
| `/bookmarks` | No | Personal bookmarks |
| `/profile/[handle]` | No | User profile |
| `/settings/account` | No | User settings |
| `/settings/security` | No | User settings |
| `/settings/payments` | No | User Stripe Connect |
| `/settings/notifications` | No | User notifications |
| `/[slug]/integrations` | **Org** | Org integrations |
| `/[slug]/settings` | **Org** | Org settings (billing, members) |
| `/[slug]/settings/billing` | **Org** | Org plan management |
| `/[slug]/settings/members` | **Org** | Org member management + invites |

### Active org management
- **Session-based**: stored in `session.activeOrganizationId` (Better Auth manages this)
- Team switcher in sidebar calls `authClient.organization.setActive()`
- `[slug]` route layouts call `setActive({ organizationSlug: slug })` on mount to sync
- Bounty creation form defaults to active org, with dropdown to switch
- tRPC procedures read `ctx.session.session.activeOrganizationId`

### Org member roles
- **owner**: Full access — manage settings, integrations, billing, members, bounties
- **member**: Create and manage bounties using org integrations

### Slug rules
- Global uniqueness across all orgs (including personal teams) — enforced by `organization` table unique constraint
- Personal team slug = user's handle
- No collision with app routes — Next.js resolves static routes before dynamic `[slug]` routes, so no reserved slugs list needed
- If a slug matches a static route, the static route wins; the `[slug]` page would just 404 on invalid org lookup

---

## Implementation Plan

### Phase 1: Schema & Better Auth Plugin Setup

**1.1** Add `organization` plugin to Better Auth server (`packages/auth/src/server.ts`):
- Import `organization` from `better-auth/plugins`
- Configure:
  - `additionalFields` on `organization`: `isPersonal` (boolean), `stripeCustomerId` (string, nullable)
  - `creatorRole: 'owner'`
  - `sendInvitationEmail`: send org invite email via Resend (new `OrgInvitation` template)
  - `organizationHooks.beforeCreateOrganization`: validate slug against reserved words
  - `organizationHooks.afterCreateOrganization`: post-creation setup

**1.2** Add `organizationClient` to auth client (`packages/auth/src/client.ts`)

**1.3** Schema changes (Drizzle):
- `session` table: add `activeOrganizationId` (text, nullable)
- Better Auth auto-manages: `organization`, `member`, `invitation` tables
- `bounty`: add `organizationId` (FK -> organization.id, nullable initially -> NOT NULL after migration)
- `githubInstallation`: add `organizationId` (FK -> organization.id, nullable) — keep existing `githubAccountId` FK
- `linearAccount`: add `organizationId` (FK -> organization.id, nullable) — keep existing `accountId` FK
- `discordGuild`: add `organizationId` (FK -> organization.id, nullable)

**1.4** Add org-related Drizzle schema tables to the `schema` object in `drizzleAdapter`

**1.5** Generate & run Drizzle migration

**1.6** Update `ExtendedAuthSession` / `BetterAuthSessionData` types to include `activeOrganizationId`

### Phase 2: Personal Team Auto-Creation

**2.1** `databaseHooks.user.create.after`: auto-create personal team
- Call `auth.api.createOrganization` with `isPersonal: true`, `slug: user.handle`, `name: "{name}'s team"`
- User automatically becomes `owner` member (Better Auth handles this)

**2.2** `databaseHooks.session.create.before`: set `activeOrganizationId` to user's personal team if not already set

**2.3** Update `linkUserToWaitlist` (`packages/api/src/routers/early-access.ts`):
- Ensure personal team exists before draft bounty promotion
- Set `organizationId` on promoted bounty

### Phase 3: tRPC Middleware & Core Re-Scoping

**3.1** New tRPC middleware (`packages/api/src/trpc.ts`):
- `orgProcedure`: reads `ctx.session.session.activeOrganizationId`, validates membership via `member` table, passes org to context
- `orgOwnerProcedure`: extends `orgProcedure`, validates role = `owner`

**3.2** Bounty creation — all 5 entry points updated:
- **Web UI** (`packages/api/src/routers/bounties.ts` -> `createBounty`): accept `organizationId` in input (defaults to `session.activeOrganizationId`), validate membership
- **GitHub webhook** (`apps/web/src/app/api/webhooks/github/route.ts` -> `handleBountyCreateCommand`): resolve org from `githubInstallation.organizationId` using `installation.id` from webhook payload
- **Discord bot** (`apps/discord-bot/src/commands/bounty.tsx`): resolve org from `discordGuild.organizationId`, fallback to user's personal team
- **Linear** (via web UI `createBounty`): org context passed through
- **Waitlist draft promotion** (`packages/api/src/routers/early-access.ts`): use personal team org ID

**3.3** Bounty queries:
- `/bounties` (public feed): no org filter — stays global
- `/dashboard`: aggregate across all user's orgs
- Management queries (update, delete, cancel): check org membership instead of `createdById === userId`
- `getMonthlySpend` (`packages/api/src/routers/bounties.ts`): filter by `organizationId`

**3.4** Integration re-scoping:
- `githubInstallationRouter` (`packages/api/src/routers/github-installation.ts`): all queries filter by `organizationId` from active org instead of personal `account.id`
  - `getInstallations`: filter by `organizationId`
  - `syncInstallation`: set `organizationId` on upsert
  - `setDefaultInstallation`: scoped per-org
- GitHub installation callback (`apps/web/src/app/api/github/installation-callback/route.ts`): link to session's active org
- GitHub webhook `handleInstallationEvent`: link to org from existing installation record or creator's personal team
- `linearAccount` router (`packages/api/src/routers/linear.ts`): same pattern as GitHub
- `discordGuild`: add `organizationId`, link via installer's active org

**3.5** `ensureStripeCustomer` (`packages/api/src/routers/bounties.ts`): org-aware variant using `organization.stripeCustomerId`

**3.6** Cancellation permissions: org owner OR original `createdById` can request cancellation

### Phase 4: Billing Re-Scoping (Autumn)

**4.1** Autumn `identify()` (`apps/web/src/app/api/autumn/[...all]/route.ts`): pass `session.activeOrganizationId` as `customerId` instead of `session.user.id`

**4.2** `AutumnProvider` (`apps/web/src/components/providers.tsx`): needs org context awareness so SDK refetches when active org changes

**4.3** `useBilling()` hook (`apps/web/src/hooks/use-billing.ts`): reads from org-scoped Autumn customer (automatic if `identify()` is correct)

### Phase 5: Frontend

**5.1** Org-scoped routes:
- `/[slug]/integrations` — org integrations page
- `/[slug]/settings` — org settings layout
- `/[slug]/settings/billing` — org plan management
- `/[slug]/settings/members` — member management (invite, remove, role update via Better Auth client API)

**5.2** `[slug]` layout: call `authClient.organization.setActive({ organizationSlug: slug })` on mount

**5.3** Team switcher in sidebar:
- Replace fake `WorkspaceSwitcher` (`apps/web/src/components/dual-sidebar/app-sidebar.tsx`) with real org selector
- Uses `authClient.useListOrganizations()` to list orgs
- Uses `authClient.useActiveOrganization()` to show current
- Switching calls `authClient.organization.setActive()` + navigates to `/${newSlug}/integrations`

**5.4** Settings split:
- User settings stay at `/settings/account`, `/settings/security`, `/settings/payments`, `/settings/notifications`
- Org settings at `/[slug]/settings/billing`, `/[slug]/settings/members`
- Settings sidebar dynamically shows user vs org items based on route

**5.5** Bounty creation UI: org selector dropdown (pre-filled from active org), shows org's integrations for repo selection

**5.6** Slug uniqueness: enforced by DB unique constraint on `organization.slug`. No reserved slugs needed — Next.js static routes take priority over dynamic `[slug]` routes

### Phase 6: Notifications

**6.1** Org event fan-out: when an org bounty event happens (submission received, payment status change, new comment), create a notification for each org member
- Helper function: `notifyOrgMembers(orgId, notificationData)` — queries `member` table, creates one `notification` row per member + emits realtime event per member

**6.2** Keep notification table user-scoped (one row per user per event)

### Phase 7: Migration (Existing Users)

**7.1** Migration script:
1. For each existing user: create org with `isPersonal: true`, `slug: user.handle`, `name: "{name}'s team"`
2. Create `member` row with role `owner` for each user -> their personal org
3. Backfill `bounty.organizationId` = creator's personal org ID (via `createdById` -> user -> personal org)
4. Backfill `githubInstallation.organizationId` = installer's personal org (via `githubAccountId` -> `account.userId` -> personal org)
5. Backfill `linearAccount.organizationId` = same pattern (via `accountId` -> `account.userId` -> personal org)
6. Backfill `discordGuild.organizationId` = `installedById` -> personal org
7. Copy `user.stripeCustomerId` to personal org's `stripeCustomerId`
8. Set `session.activeOrganizationId` for all active sessions -> user's personal org
9. ALTER `bounty.organizationId` to NOT NULL

### Phase 8: Hooks Documentation
- Create `task-hooks.md` documenting all Better Auth hooks (database hooks, auth hooks, organization hooks) to implement after orgs feature is complete
- See `task-hooks.md` for the full list

---

## Tables affected by this change

### New tables (managed by Better Auth org plugin)
- `organization` (id, name, slug, logo, metadata, createdAt + `isPersonal`, `stripeCustomerId`)
- `member` (id, userId, organizationId, role, createdAt)
- `invitation` (id, email, inviterId, organizationId, role, status, expiresAt, createdAt)

### Altered tables
- `session` — add `activeOrganizationId`
- `bounty` — add `organizationId` (NOT NULL after migration)
- `githubInstallation` — add `organizationId`
- `linearAccount` — add `organizationId`
- `discordGuild` — add `organizationId`

### Unchanged tables (confirmed no org impact)
- `user` — personal identity, no org column needed
- `account` — OAuth identities stay user-scoped
- `verification`, `emailOTP`, `oauthState`, `deviceCode`, `passkey` — auth infrastructure
- `userProfile`, `userReputation`, `userRating` — personal reputation, stays user-scoped
- `featureVote` — individual preference signals
- `betaApplication` — individual access applications
- `invite` — platform invites (separate from org invites)
- `transaction` — references bounties which carry org context
- `payout` — solver payouts, stays user-scoped
- `submission`, `bountyApplication`, `bountyVote`, `bountyComment`, `bountyCommentLike`, `bountyBookmark` — reference bounties, inherit org context
- `cancellationRequest` — references bounties
- `onboardingState`, `onboardingCoupon` — user-level onboarding
- `waitlist` — pre-signup, no org context
- `notification` — user-scoped (fan-out creates per-member rows)

---

## Bounty creation entry points (all 5 must set `organizationId`)

| Entry Point | File | How org is resolved |
|---|---|---|
| Web UI (tRPC) | `packages/api/src/routers/bounties.ts` -> `createBounty` | Input param, defaults to `session.activeOrganizationId` |
| GitHub webhook | `apps/web/src/app/api/webhooks/github/route.ts` -> `handleBountyCreateCommand` | `githubInstallation.organizationId` from `installation.id` |
| Discord bot | `apps/discord-bot/src/commands/bounty.tsx` -> `handleCreate` | `discordGuild.organizationId` or user's personal team |
| Linear (via web UI) | Same as Web UI | Same as Web UI, org context passed through |
| Waitlist draft | `packages/api/src/routers/early-access.ts` -> `linkUserToWaitlist` | User's personal team |

---

## Separate tasks (not org-related)

- [ ] Server-side `concurrent_bounties` enforcement in `createBounty` mutation (currently client-side only — can be bypassed)
- [ ] Add `EarlyAccessGuard` to `(settings)` route group layout

## Post-org tasks

- [ ] Implement Better Auth hooks (see `task-hooks.md`)
