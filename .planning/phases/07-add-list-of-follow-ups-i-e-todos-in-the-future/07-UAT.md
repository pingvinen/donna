---
status: complete
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
source: 07-01-SUMMARY.md, 07-02-SUMMARY.md, 07-03-SUMMARY.md, 07-04-SUMMARY.md, 07-05-SUMMARY.md, 07-06-SUMMARY.md
started: 2026-06-17T18:01:05+02:00
updated: 2026-06-27T00:00:00+02:00
---

## Current Test

[testing complete]

## Re-verification (2026-06-27)

The 4 issues below (tests 2, 4, 6, 10) were diagnosed and closed by gap-closure plans
07-04/05/06. Re-verified via code inspection + automated test suite (per project preference:
fixes confirmed by automated checks rather than manual re-testing):

- **Test 2** (interactive prompts) — `workflows/follow-up.md` now prints examples as prose
  before asking and marks both AskUserQuestion prompts free-text only (no picker). ✓
- **Test 4** (invalid date) — `workflows/follow-up.md:115-119` now prints an explicit error
  and halts; no silent fall-back to today. ✓
- **Test 6** (overdue annotation) — removed from `workflows/begin-the-day.md`; test asserts
  it is absent. ✓
- **Test 10** (skill rename) — stub renamed to `add-follow-up-task.md`, frontmatter,
  installer, and README updated to `donna:add-follow-up-task`. ✓

Regression found and fixed during re-verification:
- STORE-03 guard (`test/stubs.test.cjs:495`) failed because the check-follow-ups note added
  in 07-02 used the literal word "glob". Reworded the note (behavior was always correct);
  test now passes.

Full suite: 338 pass / 0 fail (exit 0). The `gsd-custom:ingest-issues` error is a pre-existing
environment artifact (missing installed `.claude/commands/` file, Phase 04 scope) and does not
fail the run.

## Tests

### 1. Schedule a follow-up from CLI
expected: Running `/donna:follow-up "Buy groceries" "next friday"` schedules a follow-up entry with resolved date, commits, and confirms.
result: pass

### 2. Schedule a follow-up interactively
expected: Running `/donna:follow-up` with no arguments prompts for description and time expression via AskUserQuestion, then schedules the follow-up the same as CLI mode.
result: pass
resolved_by: 07-04 (free-text prompts, examples moved to prose) — re-verified 2026-06-27

### 3. Relative date resolution
expected: Time expressions like "tomorrow", "next monday", "in 3 days" resolve to correct YYYY-MM-DD dates using local timezone (not UTC), with no `toISOString` usage.
result: pass

### 4. Invalid date falls back to today
expected: An unparseable or NaN date expression shows an error message telling the user the date is invalid, instead of silently falling back to today.
result: pass
resolved_by: 07-04 (invalid date prints error and halts, no silent fallback) — re-verified 2026-06-27

### 5. Follow-ups surface in begin-the-day
expected: Running `/donna:begin-the-day` surfaces follow-up items due today or past-due in the Tasks section of the daily file.
result: pass

### 6. Past-due follow-ups show overdue annotation
expected: Past-due follow-ups display with `(overdue N days)` annotation in the daily Tasks section.
result: pass
resolved_by: 07-05 (overdue annotation removed from begin-the-day) — re-verified 2026-06-27

### 7. Surfaced follow-ups removed from standing file
expected: After begin-the-day surfaces a follow-up, the entry is removed from `donna/follow-ups.md` (not checked off, not left with marker).
result: pass

### 8. Follow-up deduplication
expected: If a follow-up task matches an already-existing task in the daily file (after normalizing overdue suffix), it is not duplicated.
result: pass

### 9. Installer lists follow-up skill
expected: Running the Donna installer shows "follow-up" in the success message's comma-separated skills list.
result: pass

### 10. README documents follow-up skill
expected: README.md contains `/donna:follow-up` in the Daily workflow commands table; `follow-ups.md` appears in the directory tree.
result: pass
resolved_by: 07-06 (skill renamed to donna:add-follow-up-task) — re-verified 2026-06-27

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

All gaps below were closed by gap-closure plans 07-04/05/06 and re-verified 2026-06-27.
Retained for provenance.

- truth: "Interactive follow-up prompts are clear and usable"
  status: failed
  reason: "User reported: AskUserQuestion shows 'Use the other option below to enter...' but there is no 'other' option. Both description and due date prompts need plain free-text input."
  severity: major
  test: 2
  root_cause: "workflows/follow-up.md parse-input step includes parenthetical examples ('e.g. \"in 2 months\", \"on 2026-09-15\", or leave blank for today') inside the AskUserQuestion text. Claude Code's AskUserQuestion renders them as a picker menu, creating a confusing multi-mode UI. add-task.md avoids this by using simple single-sentence questions without parenthetical examples."
  artifacts:
    - path: "workflows/follow-up.md"
      issue: "Lines 44-57: AskUserQuestion text with parenthetical examples triggers picker mode. Should follow add-task.md pattern: print examples as prose before the question, ask with simple single-sentence text."
  missing:
    - "Move time-expression examples to a prose block printed before the AskUserQuestion"
    - "Simplify both AskUserQuestion texts to single sentences: 'What follow-up task?' and 'When is it due?'"
  debug_session: ".planning/debug/follow-up-interactive-prompts-confusing.md"
- truth: "Invalid date expressions show an error to the user"
  status: failed
  reason: "User reported: I do not agree that it should 'fall back'. It should tell the user what is wrong with the date, otherwise the user will think everything was fine and will then be annoyed tomorrow when it pops up"
  severity: major
  test: 4
  root_cause: "workflows/follow-up.md resolve-date step line 110 instructs: 'If the resolved date is NaN or invalid, fall back to today's date (re-run Case 1).' This silently swallows the error — the confirm step then prints a success message with today's date, leading the user to believe their date expression was accepted."
  artifacts:
    - path: "workflows/follow-up.md"
      issue: "Line 110: Invalid dates silently fall back to today instead of printing an error and halting."
  missing:
    - "Replace fallback instruction with error output: '✗ Invalid date expression: <input>. Use formats like tomorrow, next friday, in 3 days, or YYYY-MM-DD'"
    - "Halt workflow after invalid date (do not silently proceed)"
  debug_session: ".planning/debug/invalid-date-silent-fallback.md"
- truth: "Overdue annotation on past-due follow-ups"
  status: failed
  reason: "User reported: That annotation is a bit dangerous. If I do not finish the task that day and it is carried forward, it would have to be updated. I think that complexity is unnecessary, so I think we should remove the '(overdue N days)'. As long as it hits my task list, I am fine."
  severity: minor
  test: 6
  root_cause: "workflows/begin-the-day.md check-follow-ups step (lines 102-113) computes overdue days via macOS date -j arithmetic and appends '(overdue N days)' annotation. This adds carry-forward maintenance burden without functional value — the task appearing in the daily list already solves the 'don't forget' problem. 4 locations in begin-the-day.md + 1 test assertion need changes."
  artifacts:
    - path: "workflows/begin-the-day.md"
      issue: "Lines 102-113: Overdue days calculation and annotation. Lines 236, 244: Dedup normalization of overdue suffix. Line 339: Print-brief example."
    - path: "test/stubs.test.cjs"
      issue: "Lines 1504-1510: Test asserts 'overdue' is present — must flip to assert absent."
  missing:
    - "Remove overdue days calculation (lines 103-111 in check-follow-ups step)"
    - "Merge past-due and due-today branches into single 'due <= today' branch"
    - "Remove '(overdue N days)' strip from dedup normalization rules"
    - "Update print-brief example"
    - "Flip test assertion from checking overdue IS present to checking overdue is NOT present"
  debug_session: ".planning/debug/remove-overdue-annotation.md"
- truth: "Skill is named for discoverability alongside add-task"
  status: failed
  reason: "User reported: I am wondering if it would be better to rename it to 'add-follow-up-task' as that will allow a user thinking 'I need to add something' to find it simply by writing '/add' and they might even see it and notice while just using the regular 'add-task'."
  severity: minor
  test: 10
  root_cause: "Skill is named 'donna:follow-up' but 'donna:add-follow-up-task' would surface alongside 'add-task' when typing '/add' for better discoverability. Requires renaming the stub file, updating frontmatter name, and propagating through 5 source files."
  artifacts:
    - path: "stubs/claude-code/donna/follow-up.md"
      issue: "Rename to add-follow-up-task.md, change name frontmatter to donna:add-follow-up-task"
    - path: "workflows/follow-up.md"
      issue: "Lines 29, 40: Update inline examples from /donna:follow-up to /donna:add-follow-up-task"
    - path: "src/installer.cjs"
      issue: "Line 82: Change 'follow-up' to 'add-follow-up-task' in skills list"
    - path: "README.md"
      issue: "Line 156: Update command table entry"
    - path: "test/stubs.test.cjs"
      issue: "14 test assertions reference 'donna:follow-up' or 'follow-up.md' — must be updated"
  missing:
    - "Rename stub file: follow-up.md → add-follow-up-task.md"
    - "Update stub frontmatter name to donna:add-follow-up-task"
    - "Update workflow inline examples"
    - "Update installer skills string"
    - "Update README command table"
    - "Update all test assertions (14 changes)"
  debug_session: ".planning/debug/rename-skill-add-follow-up-task.md"
- truth: "Overdue annotation on past-due follow-ups"
  status: failed
  reason: "User reported: That annotation is a bit dangerous. If I do not finish the task that day and it is carried forward, it would have to be updated. I think that complexity is unnecessary, so I think we should remove the '(overdue N days)'. As long as it hits my task list, I am fine."
  severity: minor
  test: 6
  artifacts: []
  missing: []
- truth: "Skill is named for discoverability alongside add-task"
  status: failed
  reason: "User reported: I am wondering if it would be better to rename it to 'add-follow-up-task' as that will allow a user thinking 'I need to add something' to find it simply by writing '/add' and they might even see it and notice while just using the regular 'add-task'."
  severity: minor
  test: 10
  artifacts: []
  missing: []