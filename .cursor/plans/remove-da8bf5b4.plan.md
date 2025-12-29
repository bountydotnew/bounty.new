<!-- da8bf5b4-0962-4e84-8d96-2df1229e4309 db3927d4-92bd-48a3-985d-1a78d68552d1 -->
# Simplify Waitlist Flow

## Context

This waitlist system is **temporary** and will be removed at launch. Keep it minimal and easy to gut later.

## New Flow

**Home Page (`/`):**

- Both buttons redirect to `/login?callback=/waitlist/dashboard`
- If already logged in: redirect directly to `/waitlist/dashboard`
- Store draft bounty data in localStorage before redirect

**Waitlist Dashboard (`/waitlist/dashboard`):**

- Not logged in → login button
- Logged in, no entry → auto-create entry with GitHub email, show bounty form
- Logged in, has entry but no bounty → show bounty form
- Logged in, has bounty → show editable preview

## Changes

### 1. Create Calendar Icon

[`packages/ui/src/components/icons/huge/calendar.tsx`](packages/ui/src/components/icons/huge/calendar.tsx)

- Add the HugeIcons calendar-01-solid icon
- Export from index.ts

### 2. Create Natural Language DatePicker Component

[`packages/ui/src/components/date-picker.tsx`](packages/ui/src/components/date-picker.tsx)

- Reusable component using `chrono-node` for natural language parsing
- Text input + calendar icon button that opens Calendar popover
- Props: `value`, `onChange`, `placeholder`

### 3. Simplify BountyForm

[`apps/web/src/components/waitlist/bounty-form.tsx`](apps/web/src/components/waitlist/bounty-form.tsx)

- Remove mutation logic, just redirect to login (or dashboard if session exists)
- Save draft to localStorage
- Use new DatePicker for deadline chip (text input + calendar icon)
- Placeholder like "Tomorrow" or "In 2 weeks"

### 4. Refactor Dashboard Page

[`apps/web/src/app/waitlist/dashboard/page.tsx`](apps/web/src/app/waitlist/dashboard/page.tsx)

- Handle all states: login prompt, bounty form, or preview
- Call `getMyWaitlistEntry` which auto-creates if missing

### 5. Update getMyWaitlistEntry

[`packages/api/src/routers/early-access.ts`](packages/api/src/routers/early-access.ts)

- Auto-create waitlist entry if none exists for user

### 6. Add Edit to DashboardPreview

[`packages/ui/src/components/waitlist/dashboard-preview.tsx`](packages/ui/src/components/waitlist/dashboard-preview.tsx)

- Simple edit button/mode

### 7. Delete Obsolete Files

- `/waitlist/verify` - no longer needed
- `/waitlist/connect` - no longer needed

### To-dos

- [ ] Remove email from URL in page.tsx navigation
- [ ] Update verifyOTP endpoint to accept entryId instead of email and remove email logging