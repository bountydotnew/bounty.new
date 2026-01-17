# Vibe Coding Broke Open Source Contributions. bounty.new Fixes the Incentives.

A contributor opened a PR to the Zettlr project adding RTL support. +16,555 lines. −1,510 lines. When the maintainer asked them to explain the changes, they couldn't. When asked for incremental, reviewable commits, the response was: "just pick what you want from the pile."

Months of back-and-forth followed. The maintainer, Hendrik Erz, eventually wrote a 3,000-word post titled ["Vibe Coding: The Final Form of Hyper-Individualism."](https://www.hendrik-erz.de/post/vibe-coding-the-final-form-of-hyper-individualism) He wasn't being dramatic. He was describing what it feels like to receive contributions from someone who doesn't understand their own code.

This pattern is now everywhere. And it has nothing to do with AI being good or bad at coding. The problem is that the incentive structure of open source contributions was already fragile, and vibe coding shattered it.

## What the Numbers Actually Show

[An analysis of 40.3 million GitHub PRs](https://www.gitclear.com/ai_assistant_code_quality_2025) found AI agents involved in 14.9% of pull requests by late 2025. That number alone isn't the problem. The problem is what happens next: nearly 70% of AI-authored review feedback goes unresolved.

That's not contribution. That's noise with a good commit message.

Tldraw, a popular drawing library, [paused external contributions entirely](https://tldraw.substack.com/p/were-pausing-open-contributions) in January 2026. The maintainers cited vibe-coded PRs as a primary factor. Their reasoning was simple: reading code is already the hardest part of maintenance. Reading code that someone generated without understanding it—and can't explain or modify—isn't reviewing. It's archaeology.

## The Curl and Django Response

Daniel Stenberg, creator of Curl, [implemented an outright ban](https://daniel.haxx.se/blog/2024/01/02/the-i-in-llm-stands-for-intelligence/) on AI-generated security reports after none of the AI-assisted reports over several years found a real vulnerability. Zero percent hit rate. Django followed with [their own policy](https://www.djangoproject.com/weblog/2024/feb/28/ai-generated-content-policy/): unverified AI output gets closed without response.

These aren't anti-AI stances. They're self-preservation.

The [st0012.dev maintainer proposed a model](https://st0012.dev/from-human-to-human) that makes the division clearer: PRs and discussions should remain human-to-human. AI agents stay on the contributor's side—helping them write and test—but never speaking directly to maintainers. The triad is maintainer ↔ contributor ↔ contributor's agent, not maintainer ↔ agent.

## Why Volunteer-Based Contributions Stopped Working

The original open source model assumed contributors had skin in the game. Maybe they used the software. Maybe they wanted to learn. Maybe they wanted the resume line. Regardless of motive, they had to understand what they were submitting, because they'd be the ones explaining it and iterating on it.

Vibe coding broke that assumption. Now you can generate a PR in twenty minutes without reading the codebase. The contributor gets the dopamine hit of "contributing." The maintainer inherits debugging, architectural debt, security holes, and the time cost of explaining why the approach won't work.

[A 2025 survey](https://tidelift.com/open-source-maintainer-survey) found a large fraction of maintainers had considered quitting. Work hours exceeded anything officially acknowledged. Funding gaps remained chronic. Entitlement from users who'd never contributed kept growing.

Hector Martin [resigned as Asahi Linux project lead](https://social.treehouse.systems/@marcan/113669626190764058) citing burnout, demanding users, and interpersonal abuse. That was *before* the vibe-coded PR flood became routine.

The contribution model was already straining. Vibe coding didn't cause the break, but it accelerated it.

## The Structural Fix

bounty.new was built on a different assumption: contributions work better when money changes hands, because money creates accountability on both sides.

Here's the mechanism:

**For maintainers:** You create a bounty for work you actually need done. You set the price. The funds are held by Stripe until you approve a submission. If nobody delivers work you're satisfied with, you get refunded. You never pay for PRs you don't merge.

**For contributors:** You browse open bounties, pick one that matches your skills, and submit a PR. If the maintainer approves and merges it, payment releases to you immediately. If they request changes, you iterate. If they reject it, you move on.

The key difference: contributors get paid only after a human maintainer reviews and approves the code. Not for opening the PR. Not for the commit count. For shipping something a real person decided was worth merging.

A vibe coder can still generate a PR. But if they can't explain it, they can't address review feedback. If they can't address feedback, they don't get paid. The maintainer still closes the PR, same as before—but they didn't review it for free. And the contributor who did understand the work? They took the bounty.

## What This Looks Like in Practice

When you create a bounty on bounty.new, it syncs with GitHub. A bot comments on the issue with the bounty amount and instructions. Contributors submit via PR like normal, then comment `/submit` on the issue to register their solution.

You review the code. If you want changes, you ask for them. The contributor updates the PR. If you approve, you comment `/approve` and merge. The payment releases from escrow.

No new review workflow to learn. No separate platform to check. The entire interaction happens in GitHub, where you already work.

## Why This Matters Beyond Vibe Coding

The vibe coding problem is real, but it's a symptom. The deeper issue is that open source contributions scaled faster than open source sustainability. Projects that matter to millions of people are maintained by a handful of exhausted volunteers who get nothing but entitlement from most of their users.

Bounties don't fix every problem with open source funding. They fix one specific thing: they make individual contributions sustainable.

If you're a maintainer drowning in your backlog, you can post bounties on the issues that actually matter. You pay for results, not effort. You maintain control over what gets merged.

If you're a developer who wants to contribute but also wants to get paid, you can find work that matches your skills. You don't need to beg for freelance contracts or compete on Upwork. The work is already scoped. The pay is already set. You just need to ship code good enough to get approved.

## The Tradeoff

This model won't work for everything. Some contributions are exploratory. Some are tiny fixes that aren't worth the overhead of a bounty. Some maintainers prefer pure volunteer energy for community reasons.

But for the issues that rot in backlogs because nobody has time—the features that would make the project better but never bubble up the priority list—bounties offer something the current system doesn't: a reason for skilled people to show up and do the work well.

That's what vibe coding destroyed: the implicit trust that a contribution came from someone who cared about the outcome. Bounties rebuild that trust through a simpler mechanism. You care because you're getting paid. You do good work because good work is what gets approved.

---

If you maintain a project and you're tired of reviewing garbage PRs, post a bounty. Set the price at what the work is worth to you. Get real contributions from people who understand the code they're submitting.

If you're a developer who wants to contribute and get paid, browse the open bounties. Find something you can ship. Submit work you're proud of.

The vibe coding flood isn't going to stop. But your project doesn't have to drown in it. [Start your first bounty on bounty.new →](https://bounty.new/dashboard)
