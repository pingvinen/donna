---
phase: 03-role-awareness-and-daily-rhythm
plan: "02"
subsystem: daily-rhythm
tags: [begin-the-day, carry-forward, recurring-tasks, deduplication, workflow, stub, installer]
dependency_graph:
  requires:
    - 03-01  # set-role writes recurring.md consumed by begin-the-day
  provides:
    - donna:begin-the-day skill (stub + workflow)
    - updated donna:done with carry-forward counter stripping
    - installer listing all five skills
  affects:
    - workflows/done.md (backward-compatible update)
    - src/installer.cjs (success message only)
tech_stack:
  added: []
  patterns:
    - Idempotent daily file assembly via single-pass deduplication
    - Carry-forward counter pattern: "(N times)" suffix incremented per day
    - Normalization before dedup: strip prefix, strip counter suffix, lowercase, trim
    - macOS date arithmetic for "every other" recurring interval tracking
    - grep -v TODAY exclusion pattern to prevent self-referencing loop in prev-file lookup
key_files:
  created:
    - stubs/claude-code/donna/begin-the-day.md
    - workflows/begin-the-day.md
  modified:
    - workflows/done.md
    - src/installer.cjs
    - test/stubs.test.cjs
decisions:
  - "[03-02]: begin-the-day stub has Read/Write/Bash only — no WebSearch (no research needed) and no AskUserQuestion (non-interactive brief)"
  - "[03-02]: Closed tasks block recurring task re-addition during deduplication (Pitfall 6)"
  - "[03-02]: Re-run idempotency achieved by normalizing existing tasks before dedup, not by skipping file write"
  - "[03-02]: done.md counter-strip is backward-compatible — tasks without counter continue to match normally"
metrics:
  duration: "2 minutes"
  completed: "2026-03-15"
  tasks_completed: 2
  files_created: 2
  files_modified: 3
---

# Phase 03 Plan 02: Begin-the-Day Skill Summary

donna:begin-the-day workflow with 11-step morning ritual: carry-forward open tasks with (N times) counter, recurring.md due-today surfacing with macOS-compatible date arithmetic, single-pass idempotent deduplication blocking both open and closed existing tasks, and action-first daily brief; plus done.md counter-strip and installer skill list update.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create begin-the-day stub, workflow, and cross-cutting updates | 2ad0335 | stubs/claude-code/donna/begin-the-day.md, workflows/begin-the-day.md, workflows/done.md, src/installer.cjs |
| 2 | Add begin-the-day and cross-cutting tests to stubs.test.cjs | eedc80c | test/stubs.test.cjs |

## What Was Built

### donna:begin-the-day stub (`stubs/claude-code/donna/begin-the-day.md`)
Minimal stub following the existing pattern. YAML frontmatter with `name: donna:begin-the-day`, description, and `allowed-tools: [Read, Write, Bash]`. No WebSearch (no research step), no AskUserQuestion (non-interactive brief). References `@~/.donna/workflows/begin-the-day.md`.

### begin-the-day workflow (`workflows/begin-the-day.md`)
11-step workflow implementing the full morning ritual:
1. **read-config** — reads `~/.config/donna/config.md`, Obsidian sync check (same pattern as add-task)
2. **get-today** — date, day-of-week, day-of-month via Bash
3. **find-previous-file** — `ls | sort | grep -v "$TODAY" | tail -1` — excludes today to prevent self-reference loop
4. **carry-forward** — extracts open tasks from previous file, increments `(N times)` counter or appends `(1 times)`
5. **check-recurring** — reads `recurring.md`, evaluates due-today for every/weekday/first/every-other intervals; gracefully skips if file missing
6. **read-existing-today** — reads today's file if it exists, extracts both open and closed tasks
7. **deduplicate** — single-pass: existing tasks first, then carried/recurring tasks that normalize to no-match; closed tasks block recurring re-addition
8. **write-daily-file** — `mkdir -p`, writes YAML frontmatter + `## Tasks` section
9. **update-recurring-last-run** — read-modify-write for "every other" tasks that ran today
10. **git-commit** — same porcelain-check pattern as add-task
11. **print-brief** — action-first banner with Carried Forward and Due Today sections; graceful empty state

### done.md updates (`workflows/done.md`)
Three targeted additions:
- **read-tasks step**: strip `(N times)` for display (keep full line for file ops)
- **select-tasks step** (both with-arg and without-arg branches): fuzzy-match after stripping `(\d+ times)` suffix
- **mark-complete step**: strip counter when writing completed task (clean `- [x] description` with no counter)

### installer update (`src/installer.cjs`)
Success message updated from listing 3 skills to listing all 5: `"Copied donna skills (setup, add-task, done, set-role, begin-the-day) to ${provider.stubTarget}"`

### Tests (`test/stubs.test.cjs`)
14 new tests in 4 describe blocks:
- `stub: stubs/claude-code/donna/begin-the-day.md` (4 tests): existence, frontmatter name, description, @-reference
- `workflow: workflows/begin-the-day.md` (7 tests): existence, config ref, carry-forward, recurring.md, dedup, git commit, STORE-03
- `cross-cutting: done.md counter-strip` (1 test): verifies `(N times)` strip pattern present
- `cross-cutting: installer skill list` (2 tests): verifies set-role and begin-the-day in success message

**Full suite: 138 tests, 0 failures** (up from 124).

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist
- [x] `stubs/claude-code/donna/begin-the-day.md` — created
- [x] `workflows/begin-the-day.md` — created
- [x] `workflows/done.md` — updated with counter-strip in 3 steps
- [x] `src/installer.cjs` — updated with all five skills
- [x] `test/stubs.test.cjs` — 14 new tests added

### Commits exist
- [x] 2ad0335 — feat(03-02): create begin-the-day stub, workflow, and cross-cutting updates
- [x] eedc80c — test(03-02): add begin-the-day and cross-cutting tests

### Must-haves verified
- [x] begin-the-day stub has `name: donna:begin-the-day` frontmatter
- [x] Workflow has all 11 steps (read-config through print-brief)
- [x] `dedup` keyword present in workflow (deduplicate step)
- [x] `recurring.md` referenced in workflow
- [x] `grep -v "$TODAY"` exclusion in find-previous-file step
- [x] done.md references `\d+ times` regex pattern
- [x] Installer contains "set-role" and "begin-the-day"
- [x] `npm test` passes: 138 tests, 0 failures

## Self-Check: PASSED
