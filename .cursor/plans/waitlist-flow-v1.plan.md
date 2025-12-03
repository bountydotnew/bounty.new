# Simplify Waitlist Flow (Version 1 - Detailed)

## Current Problems

- URL params are fragile and cause bugs when entries don't exist
- Flow is convoluted with multiple verification steps
- Email collection happens before login, creating sync issues

## New Flow Overview

**Home Page (`/`):**

- Both "Create bounty" and "Skip" redirect to `/login?callback=/waitlist/dashboard`
- If already logged in: redirect directly to `/waitlist/dashboard`

**Waitlist Dashboard (`/waitlist/dashboard`):**

- Not logged in → show login button
- Logged in, no waitlist entry → auto-create entry using GitHub email, show bounty form
- Logged in, has entry, no bounty → show bounty form
- Logged in, has entry, has bounty → show editable bounty preview

## Implementation

### 1. Simplify Home Page Form

**File:** [`apps/web/src/components/waitlist/bounty-form.tsx`](apps/web/src/components/waitlist/bounty-form.tsx)

- Remove all mutation logic from this form
- Both buttons redirect to `/login?callback=/waitlist/dashboard`
- If session exists, redirect directly to `/waitlist/dashboard`
- Store draft bounty data in localStorage before redirect (so dashboard can pick it up)

### 2. Refactor Waitlist Dashboard

**File:** [`apps/web/src/app/waitlist/dashboard/page.tsx`](apps/web/src/app/waitlist/dashboard/page.tsx)

- Check session state
- If not logged in: show login button with callback to self
- If logged in: call `getMyWaitlistEntry` (which auto-creates if missing)
- Based on entry state, render either:
- Bounty form (if no bounty)
- `DashboardPreview` (if has bounty)

### 3. Update `getMyWaitlistEntry` to Auto-Create

**File:** [`packages/api/src/routers/early-access.ts`](packages/api/src/routers/early-access.ts)

- If no entry exists for user, create one using their session email
- Return the entry (existing or newly created)
- Add a `createOrUpdateBounty` mutation that the dashboard form will call

### 4. Update DashboardPreview for Editing

**File:** [`apps/web/src/components/waitlist/dashboard-preview.tsx`](apps/web/src/components/waitlist/dashboard-preview.tsx)

- Add edit mode/button
- When editing, show inline form or modal
- Call `updateBountyDraft` mutation on save

### 5. Remove Obsolete Pages/Components

- Remove or simplify `/waitlist/verify` (no longer needed - email comes from GitHub)
- Remove `/waitlist/connect` (GitHub connection happens at login)
- Clean up unused URL param logic

### 6. Update Home Page

**File:** [`apps/web/src/app/page.tsx`](apps/web/src/app/page.tsx)

- Remove `onSubmitSuccess` prop and handler
- Let `BountyForm` handle its own redirects