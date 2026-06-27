---
status: complete
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
source: [07-UAT.md gaps, gap-closure plans 07-04/05/06]
started: 2026-06-27T00:00:00Z
updated: 2026-06-27T00:00:00Z
---

## Current Test

[testing complete]

## Tests

Re-test of the 4 issues found in 07-UAT.md after gap-closure plans 07-04/05/06.
Verified via code inspection + automated test suite (per project preference: confirm
fixes with automated checks rather than manual re-testing).

### 1. Interactive prompts are clear and usable (was test 2)
expected: Both AskUserQuestion prompts use free-text input; time-expression examples
are printed as prose before the question, not rendered as a picker menu.
result: pass
evidence: workflows/follow-up.md — free-text mode enforced, examples moved to prose.

### 2. Invalid date shows an error and halts (was test 4)
expected: An unparseable/NaN date prints an explicit error and stops, instead of
silently falling back to today.
result: pass
evidence: workflows/follow-up.md:115-119 — prints error and stops; no fallback.

### 3. No overdue annotation on past-due follow-ups (was test 6)
expected: Past-due follow-ups surface on the daily list with no `(overdue N days)` suffix.
result: pass
evidence: workflows/begin-the-day.md — annotation removed; test asserts it is absent.

### 4. Skill discoverable as add-follow-up-task (was test 10)
expected: Skill is named `donna:add-follow-up-task` so it surfaces alongside `add-task`
when typing `/add`.
result: pass
evidence: stub renamed to add-follow-up-task.md; installer + README updated.

## Summary

total: 4
passed: 4
issues: 0
pending: 0
skipped: 0

## Gaps

[none — all gaps from 07-UAT.md closed by 07-04/05/06 and re-verified]
