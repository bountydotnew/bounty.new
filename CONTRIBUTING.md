# Contributing to bounty.new

## Bounty Submission Quickstart

Use this flow when a GitHub issue includes bounty instructions (example: issue #188).

1. Fork and create a branch from `main`
2. Implement the smallest verifiable change for the issue
3. Open a PR that references the issue URL
4. In PR description, add `@bountydotnew submit`
5. If needed, comment `/submit #PR_NUMBER` on the issue
6. Wait for maintainer review and approval

## Minimal Evidence Checklist

- Include the issue link in your PR description
- Include one short test or verification note
- Keep the scope small and directly tied to the issue

## Maintainer Acceptance Packet (Issue #188)

Use this exact packet to reduce back-and-forth before `/approve`:

1. PR link
2. Last commit link
3. Scope note: one-sentence statement of what changed
4. Verification note: one short expected outcome
5. Submit command confirmation (`@bountydotnew submit` or `/submit #PR_NUMBER`)

Template file: `ISSUE_188_MINIMAL_EVIDENCE_PACKET.md`

## Why this file exists

Issue #188 is a test bounty. This guide gives contributors a repeatable submit/claim path so first submissions do not get stuck on process.
