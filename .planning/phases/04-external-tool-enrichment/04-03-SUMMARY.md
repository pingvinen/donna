---
phase: 04-external-tool-enrichment
plan: "03"
subsystem: workflows
tags: [begin-the-day, done, installer, tool-integration]
dependency_graph:
  requires: ["04-01", "04-02"]
  provides: ["tool-data-in-daily-brief", "done-tool-tag-stripping", "installer-8-skills"]
  affects: ["workflows/begin-the-day.md", "workflows/done.md", "src/installer.cjs"]
tech_stack:
  added: []
  patterns: ["workflow-step-injection", "normalization-pipeline-extension", "todo-test-promotion"]
key_files:
  created: []
  modified:
    - workflows/begin-the-day.md
    - workflows/done.md
    - src/installer.cjs
    - test/stubs.test.cjs
decisions:
  - "pull-tool-data step inserts between check-recurring and read-existing-today to keep task assembly order correct"
  - "Tool tag stripping uses [tool-name](url) form (no angle brackets) so test literal matches work"
  - "Completed tool-tagged tasks keep their [tool](url) suffix for provenance/traceability"
  - "write-daily-file omits ## From Tools and ## Resolved entirely when tool_tasks is empty"
metrics:
  duration: "2 min"
  completed_date: "2026-03-16"
  tasks_completed: 2
  files_changed: 4
---

# Phase 4 Plan 03: Tool Data Integration into Daily Workflow Summary

Wire tool data from 04-01/04-02 into begin-the-day and done, adding pull-tool-data step with 10s-timeout failure isolation, [tool](url) fuzzy-match stripping in done.md, and 8-skill installer message.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add pull-tool-data step to begin-the-day | 8b9dde1 | workflows/begin-the-day.md |
| 2 | Update done.md fuzzy matching, installer message, tests | 0ba0da6 | workflows/done.md, src/installer.cjs, test/stubs.test.cjs |

## What Was Built

### Task 1: begin-the-day pull-tool-data step

Inserted a new `<step name="pull-tool-data">` between `check-recurring` and `read-existing-today`. The step:

- Reads `<storage_repo>/donna/tools.md` — graceful no-op if absent (no errors printed)
- For each tool section, runs each capability command via `timeout 10 <cli_invocation> 2>&1`
- On success: parses JSON (gh) or plain output (jira/other) into `- [ ] <title> [tool](url)` format
- On failure: adds a warning line to `<tool_warnings>` (4 failure types: timeout/auth/not-found/other)
- Collects `<tool_tasks>` and `<tool_warnings>` for downstream steps

Updated `deduplicate` step:
- Normalization now strips `[word](url)` suffix and `(reason)` suffix in addition to `(N times)`
- Added step 4: deduplicates tool_tasks against existing (closed tasks block re-addition)

Updated `write-daily-file` step:
- Content format includes `## From Tools` and `## Resolved` sections
- Both sections omitted entirely when tool_tasks is empty

Updated `print-brief` step:
- Prints `## From Tools` section if tool tasks were added
- Prints `## Warnings` section if tool_warnings is non-empty
- "No tasks for today" condition now also requires tool tasks to be empty

### Task 2: done.md, installer, tests

`done.md` changes:
- `select-tasks` (both with/without arg): strips `[tool-name](url)` suffix for fuzzy matching
- `read-tasks`: strips `[tool-name](url)` suffix for display (but keeps full line for file ops)
- `mark-complete`: preserves `[tool-name](url)` on completed lines for provenance

`src/installer.cjs`: success message now lists all 8 skills: setup, add-task, done, set-role, begin-the-day, add-tool, relearn-tools, refresh-tools

`test/stubs.test.cjs`:
- Removed `{ todo: "installer updated in Plan 03" }` from 3 installer skill list tests
- Added `strips [tool](url) suffix` test to done.md counter-strip describe block
- Added new `cross-cutting: begin-the-day tool integration` describe block with 5 tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed [tool-name] vs [<tool-name>] mismatch**
- **Found during:** Task 2, test run
- **Issue:** Plan specified test checks for `[tool-name]` literal but done.md was written with `[<tool-name>]` (angle-bracket placeholder notation). Test failed.
- **Fix:** Changed all `[<tool-name>]` to `[tool-name]` in done.md — functionally equivalent for markdown workflow, and test literal match now works
- **Files modified:** workflows/done.md
- **Commit:** 0ba0da6 (included in task 2 commit)

## Verification

- `npm test` passes: 200 tests, 0 failures, 0 todos
- begin-the-day.md has pull-tool-data step at correct position (after check-recurring, before read-existing-today)
- done.md handles tool-tagged tasks in fuzzy matching and preserves tags on completion
- Installer lists all 8 skills in success message
- begin-the-day works as before when tools.md is absent (graceful no-op)

## Self-Check: PASSED

Files verified:
- FOUND: workflows/begin-the-day.md
- FOUND: workflows/done.md
- FOUND: src/installer.cjs
- FOUND: test/stubs.test.cjs

Commits verified:
- 8b9dde1 — feat(04-03): add pull-tool-data step to begin-the-day
- 0ba0da6 — feat(04-03): update done.md fuzzy matching, installer message, and tests
