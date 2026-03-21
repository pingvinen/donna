---
phase: 03-prioritized-now-view-distill-daily-file-to-focus-items
plan: 01
subsystem: skills
tags: [focus, workflow, stub, installer, readme, prioritization]
dependency_graph:
  requires: []
  provides:
    - donna:focus stub at stubs/claude-code/donna/focus.md
    - focus workflow at workflows/focus.md
  affects:
    - src/installer.cjs (success message string)
    - README.md (command table)
    - test/stubs.test.cjs (test coverage)
tech_stack:
  added: []
  patterns:
    - stub-workflow split (consistent with all Donna skills)
    - read-config step (copied character-for-character from run-tools.md)
    - check-pending-migrations step (copied from run-tools.md)
    - parallel Task agent pattern for tool enrichment (from run-tools.md)
    - type-aware tool execution (cli/rest/graphql/mcp)
    - terminal banner pattern (from begin-the-day.md print-brief step)
key_files:
  created:
    - stubs/claude-code/donna/focus.md
    - workflows/focus.md
  modified:
    - src/installer.cjs
    - README.md
    - test/stubs.test.cjs
decisions:
  - Non-interactive skill (no AskUserQuestion) per D-02 and D-03
  - 9 steps in workflow (added check-pending-migrations per plan requirement)
  - Test coverage added as Rule 2 deviation (FOCUS-11 requirement from research)
metrics:
  duration: ~10 minutes
  completed: 2026-03-21
  tasks_completed: 2
  files_created: 2
  files_modified: 3
---

# Phase 03 Plan 01: Create donna:focus Skill Summary

Created the complete `/donna:focus` skill: a read-only distillation skill that reads today's daily file, scores open tasks using urgency keywords, carry-forward counts, recency, and tool enrichment data, then writes a prioritized focus list to `daily/focus.md` and prints it to the terminal with a Donna banner.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create focus stub, update installer, update README | 130001d | stubs/claude-code/donna/focus.md, src/installer.cjs, README.md |
| 2 | Create focus workflow and add tests | 4596b8b | workflows/focus.md, test/stubs.test.cjs |

## What Was Built

### stubs/claude-code/donna/focus.md

Skill stub with YAML frontmatter: `name: donna:focus`, `description: Distill today's tasks into a short prioritized focus list`, `allowed-tools: [Read, Write, Bash]` (no AskUserQuestion — non-interactive per D-02). References `@~/.donna/workflows/focus.md`.

### workflows/focus.md

Full 9-step workflow:
1. `read-config` — reads config, extracts storage_repo/daily_folder/auto_push, Obsidian sync (copied from run-tools.md)
2. `check-pending-migrations` — handles move-standing-files and backfill-tool-type migrations (copied from run-tools.md)
3. `read-daily-file` — reads today's YYYY-MM-DD.md, stops if missing
4. `parse-open-tasks` — extracts all `- [ ]` lines only (D-12), classifies each with urgency/carry/freshness signals
5. `enrich-from-tools` — re-queries only tools whose tags appear in open tasks (D-13), parallel Task agents with "DO NOT run git commands" constraint (D-15 graceful fallback)
6. `score-and-rank` — applies D-08 through D-14 signals, Claude selects 3-8 items dynamically (D-17), computes `<other_count>` for footer (D-18)
7. `write-focus-file` — writes `daily/focus.md` with YAML frontmatter and reason tags (D-04, D-06, D-07)
8. `git-commit` — commits focus.md to storage repo (consistent with all other skills)
9. `print-focus` — terminal banner output with numbered items and reason tags (D-05)

### src/installer.cjs

Success message string updated to include "focus" at the end of the skill list.

### README.md

Command table updated with `/donna:focus` row: "Distill today's tasks into a short prioritized focus list".

### test/stubs.test.cjs

Added 8 new tests covering:
- focus stub exists and has correct YAML frontmatter
- focus stub references correct workflow path
- focus stub does not have AskUserQuestion
- focus workflow exists and has required steps
- installer success message includes "focus"

## Deviations from Plan

### Auto-added Missing Critical Functionality

**1. [Rule 2 - Missing Functionality] Added test coverage for focus skill**
- **Found during:** Task 2
- **Issue:** FOCUS-11 requirement (from RESEARCH.md Wave 0 Gaps) specifies test coverage for the new stub and workflow. The plan's must_haves list and acceptance criteria don't explicitly include this, but the research document explicitly lists it as a Wave 0 gap, and all other skills have corresponding tests.
- **Fix:** Added `describe` blocks for `stub: stubs/claude-code/donna/focus.md`, `workflow: workflows/focus.md`, and installer success message test for "focus" in `test/stubs.test.cjs`
- **Files modified:** test/stubs.test.cjs
- **Commit:** 4596b8b

## Known Stubs

None. The workflow reads live tool data from the user's configured tools, parses the real daily file, and writes a real focus.md. No hardcoded placeholder data.

## Self-Check: PASSED

All created files exist on disk. All task commits verified in git log.

- stubs/claude-code/donna/focus.md: FOUND
- workflows/focus.md: FOUND
- 03-01-SUMMARY.md: FOUND
- Commit 130001d: FOUND
- Commit 4596b8b: FOUND
