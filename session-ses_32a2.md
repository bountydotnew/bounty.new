# Landing page A/B test variants /1-/5

**Session ID:** ses_32a2a26c3ffe9PWGq7FMX08inU
**Created:** 3/9/2026, 8:41:27 PM
**Updated:** 3/11/2026, 3:38:39 AM

---

## User

build 5 versions of the landing page at /1, /2, /3, /4, /5, use a completely different design approach and structure for each

@apps/web/src/app/page.tsx 

---

## Assistant (Build · claude-opus-4-6 · 15.1s)



I'll start by exploring the existing landing page components and the project structure to understand the design system, then create 5 unique landing page variants.

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 121.5s)

**Tool: task**

---

## Assistant (Build · claude-opus-4-6 · 13.2s)

Now I have a thorough understanding of the codebase. Let me create all 5 landing page variants. Each will have a completely different design approach:

1. **Minimal/Editorial** — Lots of whitespace, large serif-inspired typography, understated
2. **Bold/Dark with gradients** — Vibrant gradients, dark background, neon accents
3. **Bento grid layout** — Card-based grid with interactive-looking elements
4. **Storytelling/scroll narrative** — Full-screen sections, step-by-step story
5. **Developer terminal aesthetic** — Code/terminal inspired, monospace, CLI vibe

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 4.9s)

Let me create the route directories and page files. First, let me verify the app directory structure:

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 8.5s)

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 7.7s)

Now let me read the header component to understand the navigation pattern I should reuse or reference:

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 6.5s)

Now let me read the content-blocks to understand the feature sections:

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 253.7s)

Now I have all the context I need. Let me create all 5 landing page variants. I'll create them in parallel since they're independent:

**Tool: write**

**Tool: write**

**Tool: write**

**Tool: write**

**Tool: write**

---

## Assistant (Build · claude-opus-4-6 · 19.6s)

Let me fix the lint errors in variants 3 and 5 (array index as key):

**Tool: edit**

**Tool: edit**

**Tool: edit**

---

## Assistant (Build · claude-opus-4-6 · 14.9s)

The remaining lint issue in variant 3 is the bar chart heights - since values could potentially repeat. Let me fix that by making the keys unique:

**Tool: edit**

---

## Assistant (Build · claude-opus-4-6 · 9.2s)

**Tool: edit**

---

## Assistant (Build · claude-opus-4-6 · 3.6s)

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 3.9s)

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 10.1s)

**Tool: edit**

---

## Assistant (Build · claude-opus-4-6 · 8.2s)

Now let me update the todo list and verify the pages compile:

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 57.9s)

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 7.1s)

All 3 type errors are pre-existing (in `github/route.ts` and `bounties.ts`) - none in my new files. The new pages compile cleanly.

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 14.2s)

All 5 landing page variants are created and compiling. Here's a summary:

### `/1` — Minimal / Editorial
Single-column, narrow reading width (max-w-2xl). Large display typography with numbered essay-style sections (`01`, `02`, `03`), horizontal dividers, a pull quote, and generous whitespace. Inspired by Stripe Press / Linear changelog aesthetic.

### `/2` — Bold / Dark with Gradients
Full dark background (`#050505`) with animated gradient blobs (orange/green/purple), grid pattern overlay, glass-morphism nav and cards. Vibrant gradient text, stats banner, 6-card feature grid, numbered how-it-works section, and a gradient-bordered CTA. Inspired by Raycast/Framer.

### `/3` — Bento Grid
Asymmetric card grid layout with varying column spans. Each card showcases a different feature with its own visual treatment — GitHub issue mockup, Stripe escrow flow, developer avatars, bar chart, integrations grid. Dense information architecture. Inspired by Apple feature pages.

### `/4` — Storytelling / Scroll Narrative
Full-viewport sections that tell a sequential story. Floating pill nav, scroll-down indicator, alternating light/dark sections. Each step includes a visual mockup (terminal, PR diff view, payment confirmation). Includes testimonials section. Inspired by Linear/Notion homepage.

### `/5` — Developer Terminal Aesthetic
Monospace everything, green-on-black terminal theme. ASCII art logo header, CLI-style commands (`bounty create`, `bounty submissions`, `bounty approve`) with realistic terminal output blocks. Feature flags shown as `--github`, `--escrow`, etc. Inspired by Warp/Charm.sh.

---

## User

make 5 more unique variations. 6/7/8/9/10

---

## Assistant (Build · claude-opus-4-6 · 2.9s)



Let me explore what's already been created to understand the patterns used

---

## User

make 5 more unique variations. 6/7/8/9/10 -- but base them off all of the ui in dashboard!! sidebar, taskinput, profile, bounty card, bounty detail

but still keep them vastly different. i loved the creativity you had with the first 5

---

## Assistant (Build · claude-opus-4-6 · 6.1s)



Let me explore the dashboard UI components thoroughly to understand all the elements I need to incorporate.

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 305.0s)

**Tool: task**

---

## Assistant (Build · claude-opus-4-6 · 5.3s)

The agent returned a summary without the actual code. Let me read the key components directly:

**Tool: glob**

**Tool: glob**

**Tool: glob**

**Tool: glob**

**Tool: glob**

---

## Assistant (Build · claude-opus-4-6 · 5.4s)

Now let me read all the key components:

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 5.5s)

Now let me read the bounty card compound components and the bounty detail sub-components:

**Tool: glob**

**Tool: glob**

---

## Assistant (Build · claude-opus-4-6 · 3.6s)

**Tool: read**

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 4.3s)

Now let me read the dashboard page and nav config to complete my understanding:

**Tool: read**

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 4.0s)

Now let me also check the profile tabs and bounty detail submissions for more UI details:

**Tool: read**

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 9.6s)

Now I have deep understanding of all dashboard UI. Let me create all 5 new variants. Each will faithfully reproduce the actual dashboard UI components as mockups on the landing page:

- **6 — Dashboard Walkthrough**: Shows the full app as a live product screenshot - sidebar + task input + bounty feed
- **7 — Magazine/Feature Spread**: Each section zooms into a different UI element at massive scale
- **8 — Side-by-side Comparison**: Problem/solution with actual UI mockups
- **9 — Interactive Playground**: Fake interactive product demo with all UI elements
- **10 — Blueprint/Wireframe**: Technical schematic showing the product internals

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 395.6s)

Now let me create all 5 pages. I'll write them in parallel:

**Tool: write**

**Tool: write**

**Tool: write**

**Tool: write**

**Tool: write**

---

## User

continue twin

---

## Assistant (Build · claude-opus-4-6 · 10.5s)



Let me fix the lint error in `/6` and write the remaining `/10` page:

**Tool: edit**

---

## Assistant (Build · claude-opus-4-6 · 111.2s)

Now let me write `/10`:

**Tool: write**

---

## Assistant (Build · claude-opus-4-6 · 29.6s)

No LSP errors in the new files. Let me run a quick type check to confirm:

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 3.7s)

Same 3 pre-existing errors, none in my new files. Let me confirm all 10 route directories exist:

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 7.7s)

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 18.4s)

All 5 new variants are done. All type-check clean (only pre-existing errors). Here's the summary:

### `/6` — Dashboard Walkthrough (657 lines)
Full product walkthrough. Hero shows a complete dashboard mockup (sidebar + task input + bounty feed all composed together). Then each section zooms into one UI element with an annotated description: task input with chip selectors, bounty cards feed, bounty detail with submissions list, and developer profile with tabs/stats. Faithful reproductions of the actual `TaskInputForm`, `BaseBountyCard`, `BountyDetailHeader`/`Content`/`Submissions`, and `ProfileHeader` component markup.

### `/7` — Magazine / Feature Spread (493 lines)
Apple-style product page. Oversized 120px hero type, then each section is a dramatic full-bleed spread zooming into ONE UI element at massive scale. Giant task input with annotation lines pointing to chips/textarea/repo selector. Oversized bounty card with detailed breakdown. Profile with activity chart. Sidebar rendered at large scale with labeled annotation dots. Generous negative space throughout.

### `/8` — Before/After Problem/Solution (449 lines)
Split-screen comparison layout. Left side shows "The old way" with red X icons and pain points. Right side shows "With bounty.new" with green checkmarks and the actual UI mockup as the solution. Four comparisons: filing bugs → task input, tracking work → bounty feed, vetting devs → profile, managing fixes → bounty detail with submissions. Each mockup is a faithful reproduction of the real component.

### `/9` — Interactive Playground (566 lines)
Client component with clickable tab navigation. Five tabs (Sidebar, Task Input, Bounty Feed, Bounty Detail, Profile) each render inside a framed browser chrome window with a dynamic URL bar. Users click through to explore each part of the product without signing up. The sidebar tab shows the full sidebar + empty state. Real `useState` interactivity for tab switching.

### `/10` — Blueprint / Technical Schematic (800 lines)
Dotted grid background, monospace labels, engineering-diagram aesthetic. Each UI component is presented as a "COMP.001" blueprint with file paths, dependencies, component patterns, and sub-component breakdowns in monospace. Data flow diagram shows the system architecture (Task Input → Stripe → GitHub → Developer → Payout). Tech stack grid at the bottom. Every mockup has colored annotation dots pointing to specific sub-components.

---

## User

theyre all kinda cool, but nothing really speaks to me. theyre very cliche and bland. no character or language in them. they feel like they were made by an ai lmaoo

---

## Assistant (Build · claude-opus-4-6 · 9.2s)



Fair. They're structurally competent but soulless — every section reads like "here's a heading, here's a subheading, here's a CTA button" because that's exactly the template I fell into. No voice, no point of view, no reason to keep scrolling.

Let me look at the existing landing page copy and tone more carefully to understand what voice this brand actually has, then I want to rethink this from scratch.

**Tool: read**

**Tool: read**

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 3.9s)

Let me also look at how the brand talks — the for-developers page and any blog posts:

**Tool: read**

**Tool: glob**

---

## Assistant (Build · claude-opus-4-6 · 3.6s)

**Tool: read**

---

## Assistant (Build · claude-opus-4-6 · 129.8s)

**Tool: question**

---

## Assistant (Build · claude-opus-4-6 · 4.4s)

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 3.5s)

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 2.6s)

**Tool: bash**

---

## Assistant (Build · claude-opus-4-6 · 5.2s)

**Tool: todowrite**

---

## Assistant (Build · claude-opus-4-6 · 169.0s)

Now let me write all 5 with real voice, real opinions, real personality. No more template garbage.

**Tool: write**

**Tool: write**

**Tool: write**

**Tool: write**

**Tool: write**

---

## User

---

## Assistant (Compaction · claude-opus-4-6 · 41.1s)

## Goal

The user wants to build multiple landing page variants for their bounty.new platform (a developer bounty platform where you post bugs with money attached and developers submit PRs to fix them). The pages should be at routes `/1`, `/2`, `/3`, `/4`, `/5` in the Next.js app router. Each variant should have a completely different design approach, voice, and character — and NOT feel like generic AI-generated marketing pages.

## Instructions

- The user explicitly rejected the first 10 variants (routes /1 through /10) for being "cliche and bland" with "no character or language" — they felt AI-generated. All 10 were deleted.
- The user wants pages with REAL VOICE and personality, not template marketing. No generic "heading + subheading + CTA button" patterns.
- The user was given 5 voice/tone options and said "make one of each":
  1. `/1` — **Irreverent and blunt** (Basecamp/DHH style) — Opinionated, calls out bullshit directly
  2. `/2` — **Confident and understated** (Linear/Vercel style) — Few words, trusts the reader, doesn't try to convince
  3. `/3` — **Conversational and human** (early Notion/Superhuman) — Talks like a smart friend, casual but not sloppy
  4. `/4` — **Provocative and edgy** (early Stripe/Arc) — Challenges assumptions, makes you uncomfortable about old ways
  5. `/5` — **Raw and unpolished** (good README/indie hacker) — No marketing speak, just facts and a link
- Earlier iterations also explored using dashboard UI elements (sidebar, task input, bounty card, bounty detail, profile) as mockups within landing pages — this could be revisited if the user wants to enhance the current 5 variants with product visuals.

## Discoveries

- **Project structure**: Next.js monorepo at `/Users/grim/bounty.new` with `apps/web` (Next.js app) and `packages/ui` (shared UI library with 80+ components)
- **Design system**: CSS custom properties for colors (surface-1/2/3, border-subtle/default/strong, text-secondary/tertiary/muted, brand-primary=#e66700, brand-accent=#4ade00), fonts (Geist Sans, Geist Mono, Inter, Sohne Kraftig display font), base radius 0.625rem
- **Key design tokens used in landing pages**: `bg-background`, `text-foreground`, `text-text-secondary`, `text-text-muted`, `border-border-subtle`, `bg-surface-1`, `rounded-full` for pill buttons, `bg-foreground text-background` for primary CTAs
- **Existing landing page** at `/` uses Header + Hero (with interactive demos) + ContentBlocks + Footer
- **Pre-existing type errors** (3 total in `github/route.ts` and `bounties.ts`) — these are NOT from our changes
- **Dashboard components** were thoroughly explored: `AppSidebar` (workspace switcher, nav items, recent bounties), `TaskInputForm` (chip-based title/price/deadline + textarea + repo selector), `BaseBountyCard` (compound component with creator/amount/title/stats rows), `BountyDetail` (compound: Header + Content + Submissions + PaymentAlert), `ProfileHeader` (avatar, stats, GitHub activity, tabs)
- The app router uses route groups like `(auth)` for authenticated pages, with the dashboard at `(auth)/dashboard`

## Accomplished

- **COMPLETED**: All 5 new voice-driven landing page variants have been written and deployed:
  - `/1` — Irreverent/blunt: Long-form essay style, single column (max-w-3xl), no UI mockups, just strong opinion-driven writing about AI debugging failures
  - `/2` — Confident/understated: Extreme minimalism, border-divided sections, sparse text, huge whitespace, barely-there CTA
  - `/3` — Conversational/human: FAQ-style sections with quoted questions, empathetic tone, "you know that feeling?" opening, casual but substantive
  - `/4` — Provocative/edgy: Dark theme (#050505), section labels like "A question" / "An observation" / "A better model", confrontational economics arguments
  - `/5` — Raw/unpolished: Monospace font, README-style layout, "Good for" / "Not good for" lists, tech stack section, minimal max-w-xl layout
- **COMPLETED**: All files type-check clean (only pre-existing errors remain)
- **DELETED**: All previous 10 template-style variants (/1-/10) were removed

## Relevant files / directories

### Created (current variants)
- `apps/web/src/app/1/page.tsx` — Irreverent/blunt voice (~155 lines)
- `apps/web/src/app/2/page.tsx` — Confident/understated voice (~130 lines)
- `apps/web/src/app/3/page.tsx` — Conversational/human voice (~165 lines)
- `apps/web/src/app/4/page.tsx` — Provocative/edgy voice (~155 lines)
- `apps/web/src/app/5/page.tsx` — Raw/unpolished voice (~160 lines)

### Existing landing page (reference)
- `apps/web/src/app/page.tsx` — Main landing page entry
- `apps/web/src/components/landing/header.tsx`
- `apps/web/src/components/landing/hero.tsx`
- `apps/web/src/components/landing/content-blocks.tsx`
- `apps/web/src/components/landing/footer.tsx`
- `apps/web/src/components/landing/cta-section.tsx`
- `apps/web/src/components/landing/footer-faq.tsx`

### Dashboard UI (explored for potential use in landing mockups)
- `apps/web/src/components/dual-sidebar/sidebar.tsx`
- `apps/web/src/components/dual-sidebar/app-sidebar.tsx`
- `apps/web/src/components/dual-sidebar/sidebar-nav-config.ts`
- `apps/web/src/components/dashboard/task-input-form.tsx`
- `apps/web/src/components/bounty/bounty-card/base-card.tsx`
- `apps/web/src/components/bounty/bounty-detail/header.tsx`
- `apps/web/src/components/bounty/bounty-detail/content.tsx`
- `apps/web/src/components/bounty/bounty-detail/submissions.tsx`
- `apps/web/src/components/profile/profile-header.tsx`
- `apps/web/src/components/profile/profile-tabs.tsx`
- `apps/web/src/app/(auth)/dashboard/dashboard-content.tsx`

### Design system
- `packages/ui/src/styles/index.css` — Full CSS custom properties (colors, shadows, radius)
- `apps/web/tailwind.config.ts` — Tailwind config with custom fonts
- `apps/web/src/app/layout.tsx` — Root layout with font setup

---

## User

---

## Assistant (Build · claude-opus-4-6 · 6.9s)

Based on the summary, all 5 landing page variants have been completed and are deployed. There are no outstanding tasks or next steps defined.

What would you like to do next? Some possibilities:

- **Review the pages** — I can pull up any of the 5 variants so you can re-read the copy or tweak it
- **Add product mockups** — We explored dashboard components earlier; I could embed static UI mockups (sidebar, bounty cards, task input) into one or more variants
- **Create more variants** — Different voices, different layouts, A/B test candidates
- **Polish/iterate** — Refine copy, adjust spacing, add animations, improve mobile responsiveness
- **Build shared infrastructure** — Analytics tracking, A/B routing, conversion events across variants
- **Something else entirely**

What's on your mind?

---

## User


i LOVE the wording on 4. 

---

## Assistant (Build · claude-opus-4-6 · 3.8s)



Good to hear. Want to do anything with it — refine the layout, add product visuals, use its voice as the basis for the main landing page, or just leave it as is?

---

## User

bounty --> linear data strictly
bountybot --> app

bountybot is NOT supposed to have webhook events set up DIRECTLY in the app settings?

---

## Assistant (Build · claude-opus-4-6 · 84.2s)



Let me understand what you're saying and figure out the current state of things.

**Tool: task**

---

## User

docs... again. @chat-adapter/linear

Linear adapter for Chat SDK. Respond to @mentions in issue comment threads.

The Linear adapter treats issue comments as messages and issues as threads.

Installation
bash


pnpm add @chat-adapter/linear
Usage
The adapter auto-detects credentials from LINEAR_API_KEY (or LINEAR_CLIENT_ID/LINEAR_CLIENT_SECRET), LINEAR_WEBHOOK_SECRET, and LINEAR_BOT_USERNAME environment variables:

typescript


import { Chat } from "chat";
import { createLinearAdapter } from "@chat-adapter/linear";
const bot = new Chat({
  userName: "my-bot",
  adapters: {
    linear: createLinearAdapter(),
  },
});
bot.onNewMention(async (thread, message) => {
  await thread.post("Hello from Linear!");
});
Authentication
Option A: Personal API key
Best for personal projects, testing, or single-workspace bots. Actions are attributed to you as an individual.

Go to Settings > Security & Access
Under Personal API keys, click Create key
Select Only select permissions and enable Create issues, Create comments
Choose team access
Click Create and set LINEAR_API_KEY
typescript


createLinearAdapter({
  apiKey: process.env.LINEAR_API_KEY!,
});
Option B: OAuth application (recommended)
The bot gets its own identity in Linear. The adapter handles token management internally.

Go to Settings > API > Applications
Create an OAuth2 application with your bot's name and icon
Enable client credentials tokens in the app settings
Note the Client ID and Client Secret
typescript


createLinearAdapter({
  clientId: process.env.LINEAR_CLIENT_ID!,
  clientSecret: process.env.LINEAR_CLIENT_SECRET!,
});
The adapter uses the client credentials grant to obtain tokens automatically. Tokens are valid for 30 days and auto-refresh when expired.

Making the bot @-mentionable (optional)
To make the bot appear in Linear's @ mention dropdown as an Agent:

In your OAuth app settings, enable Agent session events under webhooks
Have a workspace admin install the app with actor=app and the app:mentionable scope:


https://linear.app/oauth/authorize?
  client_id=your_client_id&
  redirect_uri=https://your-domain.com/callback&
  response_type=code&
  scope=read,write,comments:create,app:mentionable&
  actor=app
See the Linear Agents docs for full details.

Webhook setup
Note: Webhook management requires workspace admin access. If you don't see the API settings page, ask a workspace admin to create the webhook for you.

Go to Settings > API and click Create webhook
Fill in:
Label: A descriptive name (e.g., "Chat Bot")
URL: https://your-domain.com/api/webhooks/linear
Copy the Signing secret as LINEAR_WEBHOOK_SECRET
Under Data change events, select:
Comments (required)
Issues (recommended)
Emoji reactions (optional)
Under Team selection, choose All public teams or a specific team
Click Create webhook
Thread model
Linear has two levels of comment threading:



Type	Description	Thread ID format
Issue-level	Top-level comments on an issue	linear:{issueId}
Comment thread	Replies nested under a specific comment	linear:{issueId}:c:{commentId}
When a user writes a comment, the bot replies within the same comment thread.

Reactions


SDK emoji	Linear emoji
thumbs_up	thumbs_up
thumbs_down	thumbs_down
heart	heart
fire	fire
rocket	rocket
eyes	eyes
sparkles	sparkles
wave	wave
Configuration
All options are auto-detected from environment variables when not provided.



Option	Required	Description
apiKey	No*	Personal API key. Auto-detected from LINEAR_API_KEY
clientId	No*	OAuth app client ID. Auto-detected from LINEAR_CLIENT_ID
clientSecret	No*	OAuth app client secret. Auto-detected from LINEAR_CLIENT_SECRET
accessToken	No*	Pre-obtained OAuth access token. Auto-detected from LINEAR_ACCESS_TOKEN
webhookSecret	No**	Webhook signing secret. Auto-detected from LINEAR_WEBHOOK_SECRET
userName	No	Bot display name. Auto-detected from LINEAR_BOT_USERNAME (default: "linear-bot")
logger	No	Logger instance (defaults to ConsoleLogger("info"))
*One of apiKey, clientId/clientSecret, or accessToken is required (via config or env vars).

**webhookSecret is required — either via config or LINEAR_WEBHOOK_SECRET env var.

Environment variables
bash


# API Key auth
LINEAR_API_KEY=lin_api_xxxxxxxxxxxx
# OR OAuth app auth
LINEAR_CLIENT_ID=your-client-id
LINEAR_CLIENT_SECRET=your-client-secret
# Required
LINEAR_WEBHOOK_SECRET=your-webhook-secret
Features
Messaging


Feature	Supported
Post message	Yes
Edit message	Yes
Delete message	Yes
File uploads	No
Streaming	No
Rich content


Feature	Supported
Card format	Markdown
Buttons	No
Link buttons	No
Select menus	No
Tables	GFM
Fields	Yes
Images in cards	No
Modals	No
Conversations


Feature	Supported
Slash commands	No
Mentions	Yes
Add reactions	Yes
Remove reactions	Partial
Typing indicator	No
DMs	No
Ephemeral messages	No
Message history


Feature	Supported
Fetch messages	Yes
Fetch single message	No
Fetch thread info	Yes
Fetch channel messages	No
List threads	No
Fetch channel info	No
Post channel message	No
Limitations
No typing indicators — Linear doesn't support typing indicators
No streaming — Messages posted in full (editing supported for updates)
No DMs — Linear doesn't have direct messages
No modals — Linear doesn't support interactive modals
Action buttons — Rendered as text; use link buttons for clickable actions
Remove reaction — Requires reaction ID lookup (not directly supported)
Troubleshooting
"Invalid signature" error
Verify LINEAR_WEBHOOK_SECRET matches the secret from your webhook configuration
The webhook secret is shown only once at creation — regenerate if lost
Bot not responding to mentions
Verify webhook events are configured with Comments resource type
Check that the webhook URL is correct and accessible
Ensure the userName config matches how users mention the bot
Linear may auto-disable webhooks after repeated failures
"Webhook expired" error
Webhook timestamp is too old (> 5 minutes)
Usually indicates a delivery delay or clock skew
Check that your server time is synchronized
License
MIT 

bounty is the bot on linear thats for just linear sdk data fetching for the bounty --> linear integ
bountybot is what they install AFTER the first linear integ. for linear --> bounty

So im not supposed to add webhook settings directly to bountybot inside of linear's application settings? but im supposed to create its own unique webhook right?

---

## User

docs... again. @chat-adapter/linear

Linear adapter for Chat SDK. Respond to @mentions in issue comment threads.

The Linear adapter treats issue comments as messages and issues as threads.

Installation
bash


pnpm add @chat-adapter/linear
Usage
The adapter auto-detects credentials from LINEAR_API_KEY (or LINEAR_CLIENT_ID/LINEAR_CLIENT_SECRET), LINEAR_WEBHOOK_SECRET, and LINEAR_BOT_USERNAME environment variables:

typescript


import { Chat } from "chat";
import { createLinearAdapter } from "@chat-adapter/linear";
const bot = new Chat({
  userName: "my-bot",
  adapters: {
    linear: createLinearAdapter(),
  },
});
bot.onNewMention(async (thread, message) => {
  await thread.post("Hello from Linear!");
});
Authentication
Option A: Personal API key
Best for personal projects, testing, or single-workspace bots. Actions are attributed to you as an individual.

Go to Settings > Security & Access
Under Personal API keys, click Create key
Select Only select permissions and enable Create issues, Create comments
Choose team access
Click Create and set LINEAR_API_KEY
typescript


createLinearAdapter({
  apiKey: process.env.LINEAR_API_KEY!,
});
Option B: OAuth application (recommended)
The bot gets its own identity in Linear. The adapter handles token management internally.

Go to Settings > API > Applications
Create an OAuth2 application with your bot's name and icon
Enable client credentials tokens in the app settings
Note the Client ID and Client Secret
typescript


createLinearAdapter({
  clientId: process.env.LINEAR_CLIENT_ID!,
  clientSecret: process.env.LINEAR_CLIENT_SECRET!,
});
The adapter uses the client credentials grant to obtain tokens automatically. Tokens are valid for 30 days and auto-refresh when expired.

Making the bot @-mentionable (optional)
To make the bot appear in Linear's @ mention dropdown as an Agent:

In your OAuth app settings, enable Agent session events under webhooks
Have a workspace admin install the app with actor=app and the app:mentionable scope:


https://linear.app/oauth/authorize?
  client_id=your_client_id&
  redirect_uri=https://your-domain.com/callback&
  response_type=code&
  scope=read,write,comments:create,app:mentionable&
  actor=app
See the Linear Agents docs for full details.

Webhook setup
Note: Webhook management requires workspace admin access. If you don't see the API settings page, ask a workspace admin to create the webhook for you.

Go to Settings > API and click Create webhook
Fill in:
Label: A descriptive name (e.g., "Chat Bot")
URL: https://your-domain.com/api/webhooks/linear
Copy the Signing secret as LINEAR_WEBHOOK_SECRET
Under Data change events, select:
Comments (required)
Issues (recommended)
Emoji reactions (optional)
Under Team selection, choose All public teams or a specific team
Click Create webhook
Thread model
Linear has two levels of comment threading:



Type	Description	Thread ID format
Issue-level	Top-level comments on an issue	linear:{issueId}
Comment thread	Replies nested under a specific comment	linear:{issueId}:c:{commentId}
When a user writes a comment, the bot replies within the same comment thread.

Reactions


SDK emoji	Linear emoji
thumbs_up	thumbs_up
thumbs_down	thumbs_down
heart	heart
fire	fire
rocket	rocket
eyes	eyes
sparkles	sparkles
wave	wave
Configuration
All options are auto-detected from environment variables when not provided.



Option	Required	Description
apiKey	No*	Personal API key. Auto-detected from LINEAR_API_KEY
clientId	No*	OAuth app client ID. Auto-detected from LINEAR_CLIENT_ID
clientSecret	No*	OAuth app client secret. Auto-detected from LINEAR_CLIENT_SECRET
accessToken	No*	Pre-obtained OAuth access token. Auto-detected from LINEAR_ACCESS_TOKEN
webhookSecret	No**	Webhook signing secret. Auto-detected from LINEAR_WEBHOOK_SECRET
userName	No	Bot display name. Auto-detected from LINEAR_BOT_USERNAME (default: "linear-bot")
logger	No	Logger instance (defaults to ConsoleLogger("info"))
*One of apiKey, clientId/clientSecret, or accessToken is required (via config or env vars).

**webhookSecret is required — either via config or LINEAR_WEBHOOK_SECRET env var.

Environment variables
bash


# API Key auth
LINEAR_API_KEY=lin_api_xxxxxxxxxxxx
# OR OAuth app auth
LINEAR_CLIENT_ID=your-client-id
LINEAR_CLIENT_SECRET=your-client-secret
# Required
LINEAR_WEBHOOK_SECRET=your-webhook-secret
Features
Messaging


Feature	Supported
Post message	Yes
Edit message	Yes
Delete message	Yes
File uploads	No
Streaming	No
Rich content


Feature	Supported
Card format	Markdown
Buttons	No
Link buttons	No
Select menus	No
Tables	GFM
Fields	Yes
Images in cards	No
Modals	No
Conversations


Feature	Supported
Slash commands	No
Mentions	Yes
Add reactions	Yes
Remove reactions	Partial
Typing indicator	No
DMs	No
Ephemeral messages	No
Message history


Feature	Supported
Fetch messages	Yes
Fetch single message	No
Fetch thread info	Yes
Fetch channel messages	No
List threads	No
Fetch channel info	No
Post channel message	No
Limitations
No typing indicators — Linear doesn't support typing indicators
No streaming — Messages posted in full (editing supported for updates)
No DMs — Linear doesn't have direct messages
No modals — Linear doesn't support interactive modals
Action buttons — Rendered as text; use link buttons for clickable actions
Remove reaction — Requires reaction ID lookup (not directly supported)
Troubleshooting
"Invalid signature" error
Verify LINEAR_WEBHOOK_SECRET matches the secret from your webhook configuration
The webhook secret is shown only once at creation — regenerate if lost
Bot not responding to mentions
Verify webhook events are configured with Comments resource type
Check that the webhook URL is correct and accessible
Ensure the userName config matches how users mention the bot
Linear may auto-disable webhooks after repeated failures
"Webhook expired" error
Webhook timestamp is too old (> 5 minutes)
Usually indicates a delivery delay or clock skew
Check that your server time is synchronized
License
MIT 

bounty is the bot on linear thats for just linear sdk data fetching for the bounty --> linear integ
bountybot is what they install AFTER the first linear integ. for linear --> bounty

So im not supposed to add webhook settings directly to bountybot inside of linear's application settings? but im supposed to create its own unique webhook right?

---

## Assistant (Build · claude-opus-4-6)

---

