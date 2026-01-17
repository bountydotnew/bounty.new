# Vibe Coding Broke Open Source Contributions. bounty.new Fixes the Incentives.

A contributor opened a PR to the Zettlr project adding RTL support. +16,555 lines. −1,510 lines. When the maintainer asked them to explain the changes, they couldn't. When asked for incremental commits, the response was: "just pick what you want from the pile."

The maintainer, Hendrik Erz, eventually wrote a 3,000-word post titled ["Vibe Coding: The Final Form of Hyper-Individualism."](https://www.hendrik-erz.de/post/vibe-coding-the-final-form-of-hyper-individualism) He wasn't being dramatic. He was describing what happens when contributors don't understand their own code.

This pattern is everywhere now. The incentive structure of open source contributions was already fragile. Vibe coding shattered it.

## What the Numbers Actually Show

[An analysis of 40.3 million GitHub PRs](https://www.gitclear.com/ai_assistant_code_quality_2025_research) found AI agents involved in 14.9% of pull requests by late 2025. Nearly 70% of AI-authored review feedback goes unresolved.

That's not contribution. That's noise with a good commit message.

Tldraw, a popular drawing library, [paused external contributions entirely](https://github.com/tldraw/tldraw/issues/7695) in January 2026. The maintainers cited vibe-coded PRs as a primary factor. Reading code is already hard. Reading code that someone can't explain or modify isn't reviewing. It's archaeology.

## How Projects Are Responding

Daniel Stenberg, creator of Curl, [banned AI-generated security reports](https://daniel.haxx.se/blog/2024/01/02/the-i-in-llm-stands-for-intelligence/) after none found a real vulnerability over several years. Zero percent hit rate. Django followed with [their own policy](https://www.djangoproject.com/weblog/2024/feb/28/ai-generated-content-policy/): unverified AI output gets closed without response.

These aren't anti-AI stances. They're self-preservation.

The [st0012.dev maintainer proposed a cleaner model](https://st0012.dev/2025/12/30/ai-and-open-source-a-maintainers-take-end-of-2025/): PRs and discussions should remain human-to-human. AI agents stay on the contributor's side, but never speak directly to maintainers.

## Why Volunteer Contributions Stopped Working

The original open source model assumed contributors had skin in the game. They had to understand what they were submitting, because they'd be the ones explaining and iterating on it.

Now you can generate a PR in twenty minutes without reading the codebase. The contributor gets the dopamine hit. The maintainer inherits the debugging.

[A 2023 survey](https://www.sonarsource.com/open-source-maintainer-survey-2023.pdf) found a large fraction of maintainers had considered quitting. Funding gaps remained chronic. Entitlement from users kept growing.

Hector Martin [resigned as Asahi Linux project lead](https://marcan.st/2025/02/resigning-as-asahi-linux-project-lead/) citing burnout and interpersonal abuse. That was *before* the vibe-coded PR flood became routine.

## The Structural Fix

bounty.new was built on a different assumption: contributions work better when money changes hands, because money creates accountability on both sides.

**For maintainers:** You create a bounty for work you need done. Funds are held by Stripe until you approve a submission. If nobody delivers, you get refunded. You never pay for PRs you don't merge.

**For contributors:** You browse open bounties, pick one that matches your skills, and submit a PR. If the maintainer approves and merges, payment releases immediately. If they reject it, you move on.

The key difference: contributors get paid only after a human approves the code. Not for opening the PR. For shipping something worth merging.

A vibe coder can still generate a PR. But if they can't address review feedback, they don't get paid. The contributor who understood the work? They took the bounty.

## What This Looks Like in Practice

When you create a bounty on bounty.new, it syncs with GitHub. A bot comments on the issue with the bounty amount. Contributors submit via PR, then comment `/submit` to register their solution.

You review the code. If you want changes, you ask for them. If you approve, you comment `/approve` and merge. Payment releases from escrow.

No new workflow to learn. The entire interaction happens in GitHub.

## Why This Matters Beyond Vibe Coding

The vibe coding problem is real, but it's a symptom. Open source contributions scaled faster than open source sustainability. Projects that matter to millions are maintained by exhausted volunteers.

Bounties don't fix every funding problem. They fix one thing: they make individual contributions sustainable.

If you're a maintainer drowning in your backlog, post bounties on issues that matter. You pay for results, not effort.

If you're a developer who wants to contribute and get paid, find work that matches your skills. The work is scoped. The pay is set. Ship code good enough to get approved.

## The Tradeoff

This model won't work for everything. Some contributions are exploratory. Some are tiny fixes not worth the overhead.

But for issues that rot in backlogs because nobody has time, bounties offer something the current system doesn't: a reason for skilled people to show up and do the work well.

---

If you maintain a project, post a bounty. If you're a developer, browse the open bounties.

The vibe coding flood isn't stopping. Your project doesn't have to drown in it. [Start your first bounty →](https://bounty.new/dashboard)
