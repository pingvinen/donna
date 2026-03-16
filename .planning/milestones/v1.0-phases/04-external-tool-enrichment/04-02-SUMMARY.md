---
phase: 04-external-tool-enrichment
plan: 02
subsystem: workflows
tags: [cli-tools, tools-registry, relearn-tools, refresh-tools, donna-workflow, stub]

# Dependency graph
requires:
  - phase: 04-01
    provides: add-tool workflow and tools.md schema used as foundation
  - phase: 03.1-standing-files-subfolder
    provides: check-pending-migrations block pattern (character-for-character identical)
provides:
  - donna:relearn-tools stub at stubs/claude-code/donna/relearn-tools.md
  - donna:refresh-tools stub at stubs/claude-code/donna/refresh-tools.md
  - relearn-tools workflow at workflows/relearn-tools.md with 9 steps
  - refresh-tools workflow at workflows/refresh-tools.md with 9 steps
affects: [04-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "relearn-tools: check-versions compares stored vs installed via string equality (not semver parsing)"
    - "relearn-tools: training data re-learning for gh/jira/kubectl, --help for unknown tools"
    - "refresh-tools: 10s timeout per capability command for failure isolation"
    - "refresh-tools: 4-rule smart merge (user [x] wins, keep open, resolve closed/removed, add new)"
    - "refresh-tools: read-modify-write daily file atomically in one Write operation"

key-files:
  created:
    - stubs/claude-code/donna/relearn-tools.md
    - stubs/claude-code/donna/refresh-tools.md
    - workflows/relearn-tools.md
    - workflows/refresh-tools.md
  modified:
    - test/stubs.test.cjs

key-decisions:
  - "Both stubs are non-interactive (no AskUserQuestion) — relearn-tools and refresh-tools are background operations"
  - "check-pending-migrations step is character-for-character identical to begin-the-day.md in both new workflows"
  - "Version comparison uses string equality — 'is it different?' is sufficient, no semver parsing needed"
  - "refresh-tools smart merge uses URL as stable identifier for matching tasks across runs"
  - "Installer skill list tests added as todo items — will pass after Plan 03 updates installer"

patterns-established:
  - "Non-interactive workflows have only Read/Write/Bash in allowed-tools — no AskUserQuestion"
  - "Smart merge 4 rules: user [x] wins > keep open > auto-resolve closed/removed > add new"
  - "Failure isolation: 10s timeout per tool, warn and continue, never block on single tool failure"

requirements-completed: [TOOL-03]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 04 Plan 02: Relearn-Tools and Refresh-Tools Summary

**donna:relearn-tools and donna:refresh-tools stubs and workflows — version-aware selective re-learning and mid-day smart merge refresh with 4-rule conflict resolution and per-tool failure isolation**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T23:10:43Z
- **Completed:** 2026-03-15T23:12:43Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created donna:relearn-tools stub (non-interactive, no AskUserQuestion)
- Created donna:refresh-tools stub (non-interactive, no AskUserQuestion)
- Created 9-step relearn-tools workflow with version comparison (string equality), training-data baseline for gh/jira/kubectl, and upsert write to tools.md
- Created 9-step refresh-tools workflow with 10s per-tool timeout, 4-rule smart merge, atomic read-modify-write daily file, and failure isolation
- check-pending-migrations step is character-for-character identical to begin-the-day.md in both workflows
- Added 28 test assertions covering both stubs and workflows plus 3 todo installer assertions
- All 191 non-todo tests pass (194 total, 3 todo as expected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create relearn-tools and refresh-tools stubs and workflows** - `f5d0c1a` (feat)
2. **Task 2: Add test assertions for relearn-tools and refresh-tools** - `13b3b15` (test)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `stubs/claude-code/donna/relearn-tools.md` - Non-interactive stub referencing @~/.donna/workflows/relearn-tools.md
- `stubs/claude-code/donna/refresh-tools.md` - Non-interactive stub referencing @~/.donna/workflows/refresh-tools.md
- `workflows/relearn-tools.md` - 9-step workflow: read-config, check-pending-migrations, read-tools-md, check-versions, report-unchanged, relearn-changed, write-tools-md, git-commit, confirm
- `workflows/refresh-tools.md` - 9-step workflow: read-config, check-pending-migrations, read-tools-md, find-daily-file, read-existing-tool-tasks, pull-fresh-data, smart-merge, git-commit, print-summary
- `test/stubs.test.cjs` - Added describe blocks for both stubs (8 assertions each) and both workflows (6-8 assertions each) plus 3 todo installer assertions

## Decisions Made

- Both stubs are non-interactive because relearn-tools and refresh-tools are background operations that should not interrupt the user with questions
- Version comparison uses simple string equality — no semver parsing — because "is it different?" is sufficient to trigger a re-learn
- Smart merge uses the embedded URL `[tool](url)` as the stable identifier for matching tasks across refresh runs
- refresh-tools uses 10-second timeout per capability command to prevent a single slow tool from blocking the entire refresh
- Installer skill list tests marked as `{ todo: "installer updated in Plan 03" }` — they will pass when Plan 03 updates the installer success message

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness

- relearn-tools and refresh-tools workflows are complete — tools lifecycle is now: add-tool (declare) → relearn-tools (version update) → refresh-tools (mid-day data)
- begin-the-day integration of tool data is ready to be implemented in Plan 03
- Installer success message update pending in Plan 03

## Self-Check: PASSED

All created files exist on disk. Both task commits (`f5d0c1a`, `13b3b15`) verified in git log. SUMMARY.md created at expected path.

---
*Phase: 04-external-tool-enrichment*
*Completed: 2026-03-16*
