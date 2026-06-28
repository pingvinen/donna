---
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
plan: "04"
subsystem: capture
status: complete
tags: [follow-up, ux, fix, interactive-prompts, date-validation]
requires: [donna:follow-up-workflow]
provides: [fixed-interactive-prompts, invalid-date-error]
affects:
  - workflows/follow-up.md
tech-stack:
  added: []
  patterns:
    - prose-before-askuserquestion
key-files:
  created: []
  modified:
    - workflows/follow-up.md
decisions:
  - "AskUserQuestion prompts use single-sentence text; time-expression examples printed as prose block before questions to avoid Claude Code picker mode"
  - "Invalid dates produce error + halt instead of silent fallback to today — user must correct their expression"
metrics:
  duration_seconds: 0
  completed_date: "2026-06-17T22:23:04+02:00"
---

# Phase 07 Plan 04: Fix Follow-Up UX — Summary

Fix two blocking UX issues found in UAT: (1) confusing interactive prompts triggering picker mode due to parenthetical examples inside AskUserQuestion, and (2) invalid dates silently falling back to today instead of showing an error.

## Implementation

### Task 1: Fix interactive prompt text to avoid picker mode

**Commit:** `435fe24`

Modified `workflows/follow-up.md` parse-input step (lines 42-62):

- Added a prose block printed before questions with time-expression examples:
  ```
  Time expression examples: "in 2 months", "on 2026-09-15", "next Tuesday", "in 3 weeks", or leave blank for today.
  ```
- Removed parenthetical examples `(e.g. "in 2 months", "on 2026-09-15", or leave blank for today)` from the second AskUserQuestion text — these triggered Claude Code's picker menu, creating a confusing multi-mode UI.
- Simplified second AskUserQuestion to single sentence: `When is it due?`
- Added CRITICAL note: "Both AskUserQuestion prompts must use free-text input mode — do NOT use a picker with predefined options."
- The first AskUserQuestion (`What task would you like to schedule?`) was already simple and was left unchanged.

This matches the `add-task.md` pattern where AskUserQuestion uses single-sentence text without parenthetical examples.

### Task 2: Replace silent date fallback with error + halt

**Commit:** `4b7beb9`

Modified `workflows/follow-up.md` resolve-date step (lines 115-121):

- Replaced the fallback instruction `"If the resolved date is NaN or invalid, fall back to today's date (re-run Case 1)"` with:
  - Error output: `✗ Invalid date expression: <due_expression>. Use formats like "tomorrow", "next friday", "in 3 days", or YYYY-MM-DD.`
  - Workflow halt: "Then stop the workflow. Do NOT fall back to today — the user must correct their date expression."
- Moved `Store the output as <due_date>` into the success path only.

Mitigates T-07-01 — invalid/tampered date expressions no longer silently proceed with wrong dates.

## Verification

- [x] `grep -c "e.g." workflows/follow-up.md` — no parenthetical examples remain in AskUserQuestion text (2 remaining "e.g." occurrences are in CLI parsing examples section, not interactive prompts)
- [x] `grep -c "fall back" workflows/follow-up.md` — pattern removed from resolve-date step (only remaining occurrence is in the "Do NOT fall back" prohibition instruction)
- [x] AskUserQuestion prompts are single-sentence questions matching add-task.md pattern
- [x] Invalid dates produce error message with valid format examples and halt the workflow
- [x] Valid dates continue to resolve correctly (today, YYYY-MM-DD, relative expressions — no changes to Case 1, 2, or 3)

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

None — no new security surface introduced. Both changes are UX improvements to existing workflow; T-07-01 mitigation is strengthened (error+halt replaces silent fallback).

## Self-Check

- [x] `workflows/follow-up.md` modified and committed
- [x] Commit `435fe24` exists (Task 1)
- [x] Commit `4b7beb9` exists (Task 2)
- [x] Both commits apply against expected base `616bc5b9670a82d38cda81b38d84aadfe0065841`