---
phase: 05-fix-the-constant-timeout-warnings
plan: 01
subsystem: workflows
tags: [timeout, cross-platform, macOS, bash-tool]
dependency_graph:
  requires: []
  provides: [timeout-free-workflows, updated-test-assertions]
  affects: [workflows/begin-the-day.md, workflows/run-tools.md, workflows/focus.md, workflows/add-tool.md, workflows/relearn-tools.md, test/stubs.test.cjs]
tech_stack:
  added: []
  patterns: [Bash tool native timeout parameter instead of external timeout binary]
key_files:
  created: []
  modified:
    - workflows/begin-the-day.md
    - workflows/run-tools.md
    - workflows/focus.md
    - workflows/add-tool.md
    - workflows/relearn-tools.md
    - test/stubs.test.cjs
decisions:
  - "Use Bash tool native timeout parameter (ms) instead of external timeout binary — cross-platform, no coreutils required"
  - "Preserve same timeout durations: 10s (10000ms) for tool commands, 15s (15000ms) for GraphQL introspection"
  - "Keep error message templates (timed out after 10s) and failure condition prose unchanged"
metrics:
  duration_seconds: 152
  completed_date: "2026-03-27"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 6
---

# Phase 05 Plan 01: Remove timeout Binary from Workflows Summary

**One-liner:** Replaced all `timeout N cmd` binary invocations across 5 workflow files with Bash tool native `timeout` parameter prose (10000ms/15000ms), eliminating macOS coreutils dependency and constant warnings.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Remove timeout binary from all 5 workflow files | 2c778fd | workflows/begin-the-day.md, run-tools.md, focus.md, add-tool.md, relearn-tools.md |
| 2 | Update test assertions and verify full suite passes | 15efa3d | test/stubs.test.cjs |

## What Was Built

### Task 1: Workflow file updates

Replaced all 15+ `timeout N <command>` binary invocations across 5 workflow files with prose instructing Claude to use the Bash tool's native `timeout` parameter:

- **CLI/REST/GraphQL commands (10s):** "Run via Bash (set the Bash tool's `timeout` parameter to `10000`):"
- **GraphQL introspection (15s):** "Run via Bash with a 15-second timeout (set the Bash tool's `timeout` parameter to `15000`)."
- **add-tool auth tests:** Inline format — "run `<cmd>` via Bash with `timeout: 10000`"
- **run-tools smart-merge gh check:** Updated inline prose to use "set the Bash tool's `timeout` parameter to `10000`"

Error message templates like "timed out after 10s" and failure condition prose ("non-zero exit, timeout, missing secret") were preserved unchanged.

### Task 2: Test assertion updates

Updated 2 assertions in `test/stubs.test.cjs`:

1. `workflow: workflows/run-tools.md` — "contains timeout for failure isolation" changed to "contains Bash tool timeout parameter for failure isolation", checking `content.includes("10000")` instead of `content.includes("timeout")`
2. `cross-cutting: begin-the-day tool integration` — "includes timeout for failure isolation" changed to "includes Bash tool timeout parameter for failure isolation", checking `content.includes("10000")` instead of the old OR condition

Full test suite: 287 tests, 0 failures.

## Verification Results

- `grep -rn "timeout [0-9]" workflows/*.md` → 0 matches
- `grep -c "10000" workflows/begin-the-day.md` → 3
- `grep -c "10000" workflows/run-tools.md` → 4
- `grep -c "10000" workflows/focus.md` → 3
- `grep -c "10000" workflows/add-tool.md` → 4
- `grep -c "15000" workflows/relearn-tools.md` → 1
- `grep -c "timed out after 10s" workflows/begin-the-day.md` → 1 (preserved)
- `npm test` → 287 passed, 0 failed

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All timeout parameter values are correct and complete — no placeholder values remain.

## Self-Check: PASSED

- workflows/begin-the-day.md: exists, contains "10000" (3 occurrences)
- workflows/run-tools.md: exists, contains "10000" (4 occurrences)
- workflows/focus.md: exists, contains "10000" (3 occurrences)
- workflows/add-tool.md: exists, contains "10000" (4 occurrences)
- workflows/relearn-tools.md: exists, contains "15000" (1 occurrence)
- test/stubs.test.cjs: exists, contains "10000" (4 occurrences), zero "timeout 10"
- Commits 2c778fd and 15efa3d verified in git log
