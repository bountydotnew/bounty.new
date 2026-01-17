# Vibe Coding Is Wrecking Open Source. bounty.new is how we push back.

A maintainer for Zettlr got a PR with +16,555 lines and no explanation. The contributor could not explain the changes and asked the maintainer to pick what they wanted. A 16k-line PR with no context is a Jenga tower dumped on a desk.

The rest of the ecosystem is seeing the same pattern. An analysis of 40.3 million GitHub PRs found AI agents involved in 14.9% of PRs by late 2025, and nearly 70% of AI-authored review feedback goes unresolved. Tldraw paused external contributions in January 2026. Curl and Django now close unverified AI output on sight. Actual Budget documented PRs that consumed real maintainer time and delivered zero value.

## The pattern is boring and brutal
When a huge PR lands, the maintainer inherits it whether they asked for it or not. This is the common arc:
1. Someone generates code with an LLM.
2. They open a huge PR to a project they do not understand.
3. The maintainer spends hours reviewing and asking questions.
4. The contributor cannot answer without re-prompting.
5. The PR closes. Everyone loses time.

Linus called vibe coding a horrible idea from a maintenance standpoint because maintainers have to understand and debug the code. That line is the heart of the problem.

## bounty.new changes the incentives, not just the tone
bounty.new is not a PR factory. It is a contract. The work starts with a maintainer posting a bounty and a scope, not a contributor dumping a diff.

We put the flow in the repo where maintainers already work:
- Create a bounty in bounty.new, fund it, and it posts the instructions to the GitHub issue.
- A contributor ships a PR and claims it with a /submit comment on the issue.
- The maintainer reviews, approves, and merges. The payout only happens on merge.

That sequence is already visible in the product demos: a bounty is created, a bot comment lays out the steps, a /submit ties the PR to the issue, and /approve plus /merge releases payment. Funds are held until the maintainer says the work is done.

## Why this fights vibe coded slop
The traditional PR flood rewards the contributor for shipping anything, even if it is unreadable. A bounty flips that. If you cannot explain your PR, it does not get approved. If it does not get approved, you do not get paid. That makes "I cannot explain it" a losing strategy.

It also gives maintainers a filter they can use without guilt. If an issue is not a bounty, they can ignore drive-by AI submissions. If it is a bounty, they already agreed to review that scope and only that scope.

## We keep AI on the contributor side
We are not anti-AI. We are anti-dumping. Use tools to write tests, explore edge cases, and draft code, but show up ready to defend your choices. The maintainer should never be negotiating with a model. They should be working with a human who can explain the code they sent.

If you ship a wall of code you did not read, you will not get paid. That is the difference between a toy project and a real collaboration.

## The short version
bounty.new is our way to keep open source human, reviewable, and worth the time:
- Maintainers define the work and the price.
- Contributors know exactly what done means.
- Payment happens only after human review and merge.

If you are a maintainer, post one bounty and see if the signal improves. If you are a contributor, pick one bounty and own it end to end. We will handle the admin so you can ship real work, not noise.
