---
status: diagnosed
trigger: "Remove (overdue N days) annotation from past-due follow-up tasks in begin-the-day"
created: 2026-06-17T22:01:32+0200
updated: 2026-06-17T22:01:32+0200
---

## Current Focus

hypothesis: The `(overdue N days)` annotation on past-due follow-ups adds unnecessary carry-forward complexity — it would need updating each day a task remains undone. The annotation should be removed, and past-due follow-ups should surface as plain task text (optionally with original due date).
test: Read and trace all locations where "overdue" appears in workflows/begin-the-day.md
expecting: Confirmation of 4 locations: (1) annotation computation in check-follow-ups, (2) dedup normalization, (3) dedup description text, (4) print-brief example
next_action: Map all locations in begin-the-day.md that need changes

## Symptoms

expected: Past-due follow-ups surface in the daily Tasks section without the `(overdue N days)` annotation. The task text and optionally the original due date is sufficient.
actual: Past-due follow-ups display with `(overdue N days)` annotation (e.g., `- [ ] Submit expense report (overdue 3 days)`). The annotation creates an undesirable update burden if the task is carried forward to subsequent days.
errors: N/A — this is a design simplification, not a functional error
reproduction: Create a follow-up with a past due date, run begin-the-day, observe the overdue annotation in the daily brief output
started: Phase 07 UAT — test 6

## Eliminated

## Evidence

- timestamp: 2026-06-17T22:01:32+0200
  checked: Location of overdue annotation computation
  found: workflows/begin-the-day.md line 111: `Add to <follow_up_tasks> as: - [ ] <description> (overdue N days)`
  implication: This is the primary source — where the annotation is computed and appended

- timestamp: 2026-06-17T22:01:32+0200
  checked: Dedup normalization rule
  found: workflows/begin-the-day.md line 236: normalization strips `(overdue N days)` suffix
  implication: If annotation is removed, this normalization rule becomes dead code and should be cleaned up

- timestamp: 2026-06-17T22:01:32+0200
  checked: Dedup step description text
  found: workflows/begin-the-day.md line 244: mentions "The (overdue N days) suffix is stripped during normalization"
  implication: Explanatory prose that references the annotation — needs updating

- timestamp: 2026-06-17T22:01:32+0200
  checked: Print-brief example output
  found: workflows/begin-the-day.md line 339: `- [ ] Submit expense report (overdue 3 days)`
  implication: Example output in print-brief step — needs updating

- timestamp: 2026-06-17T22:01:32+0200
  checked: Stub test for overdue annotation
  found: test/stubs.test.cjs line 1504-1510: asserts `content.includes("overdue")`
  implication: Test assertion must be updated — currently a positive check for the word "overdue"

- timestamp: 2026-06-17T22:01:32+0200
  checked: Research document references
  found: .planning/phases/07-* multiple files reference overdue annotation as planned feature
  implication: History/archival documents — no code changes needed in these

- timestamp: 2026-06-17T22:01:32+0200
  checked: Whether overdue days calculation is still useful after annotation removal
  found: Lines 103-110 compute overdue days exclusively for the annotation; lines 103-113 are the full past-due branch
  implication: If annotation is removed, the past-due and due-today cases can be collapsed into a single path: `if due <= today → add as - [ ] <description>`

- timestamp: 2026-06-17T22:01:32+0200
  checked: Whether "overdue" appears in any other workflow files
  found: All 6 occurrences are in workflows/begin-the-day.md only
  implication: No cross-workflow cleanup needed beyond begin-the-day.md itself

## Resolution

root_cause: The `(overdue N days)` annotation on past-due follow-up tasks is unnecessary complexity — if the task remains undone and is carried forward, the annotation would need to be updated each day. The design intent (past-due tasks should be surfaced and noticeable) is already served by the task appearing in the daily list. The annotation adds no functional value while introducing a maintenance burden.

fix: 
  - Collapse past-due and due-today branches into a single path: `if due <= today → add as - [ ] <description>` (lines 102-113)
  - Remove `(overdue N days)` strip from dedup normalization rule (line 236)
  - Remove explanatory prose about overdue normalization in dedup step (line 244)
  - Update print-brief example (line 339)
  - Update test assertion from positive check (`content.includes("overdue")`) to negative check (`!content.includes("(overdue`)
verification: TBD
files_changed:
  - workflows/begin-the-day.md: remove overdue annotation computation, simplify dedup normalization, clean prose
  - test/stubs.test.cjs: update assertion