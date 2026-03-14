---
phase: 02-foundation-and-capture
plan: "02"
subsystem: skills
tags: [claude-code, stubs, workflows, markdown, git, tasks]

# Dependency graph
requires:
  - phase: 02-01
    provides: donna:setup stub and workflow pattern, config.md bootstrap at ~/.config/donna/config.md
provides:
  - donna:add-task stub at stubs/claude-code/donna/add-task.md
  - donna:done stub at stubs/claude-code/donna/done.md
  - add-task workflow at workflows/add-task.md
  - done workflow at workflows/done.md
  - Installer success message listing all three skills
affects: [03-daily-rhythm]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Skill stubs reference workflows via @~/.donna/workflows/<skill>.md"
    - "Workflows start with read-config step (config/donna/config.md) and end with git-commit step"
    - "Daily file format: YAML frontmatter with date field, ## Tasks heading, - [ ] checkbox items"
    - "Git commit messages follow donna(<skill>): <description> convention"

key-files:
  created:
    - stubs/claude-code/donna/add-task.md
    - stubs/claude-code/donna/done.md
    - workflows/add-task.md
    - workflows/done.md
  modified:
    - src/installer.cjs
    - test/stubs.test.cjs

key-decisions:
  - "add-task stub includes AskUserQuestion in allowed-tools to handle both arg-provided and interactive modes"
  - "done workflow supports both fuzzy-match (with arg) and numbered list (without arg) selection modes"
  - "Installer success message uses simple enumeration of all three skills rather than dynamic discovery"

patterns-established:
  - "Stub pattern: YAML frontmatter with name/description/allowed-tools, objective block, execution_context referencing @~/.donna/workflows/<skill>.md"
  - "Workflow pattern: read-config first, fail fast if config missing, end with git-commit and confirm steps"

requirements-completed: [TASK-01, TASK-02, STORE-02]

# Metrics
duration: 8min
completed: 2026-03-14
---

# Phase 2 Plan 02: Add-Task and Done Skills Summary

**donna:add-task and donna:done skills (stubs + workflows) delivering the core task capture and completion loop, with installer message updated to list all three skills**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-14T18:10:00Z
- **Completed:** 2026-03-14T18:18:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Two new skill stubs (add-task, done) following the established stub pattern from Plan 01
- Two new workflows implementing the full task capture and completion flow with config read, daily file management, and git commit
- Installer success message updated to enumerate all three Donna skills
- 20 new tests covering all structural invariants for stubs and workflows (106 total, all passing)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create add-task and done stubs and workflows with tests** - `81e9c13` (feat)
2. **Task 2: Update installer success message for multiple skills** - `9daa676` (feat)

**Plan metadata:** (docs commit to follow)

_Note: Task 1 used TDD — tests written first (RED), then implementation (GREEN)._

## Files Created/Modified
- `stubs/claude-code/donna/add-task.md` - Stub with Read/Write/Bash/AskUserQuestion tools, references add-task workflow
- `stubs/claude-code/donna/done.md` - Stub with Read/Write/Bash/AskUserQuestion tools, references done workflow
- `workflows/add-task.md` - Full workflow: read-config, get-description (with fallback prompt), ensure-daily-file, append-task, git-commit, confirm
- `workflows/done.md` - Full workflow: read-config, find-daily-file, read-tasks, select-tasks (fuzzy-match or numbered list), mark-complete, git-commit, confirm
- `src/installer.cjs` - Updated success message from "Copied donna:setup" to "Copied donna skills (setup, add-task, done)"
- `test/stubs.test.cjs` - Extended with 20 new tests for add-task stub, add-task workflow, done stub, done workflow

## Decisions Made
- Included AskUserQuestion in add-task allowed-tools even though the command takes an inline arg, since the workflow handles the no-arg case with an interactive prompt
- done workflow offers two UX modes: fuzzy-match with confirmation (when arg provided) and numbered list selection (when no arg)
- Installer message uses simple string enumeration rather than dynamic discovery — clear and not fragile

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core task capture/completion loop is complete (add-task, done, setup)
- Phase 3 can build donna:daily-brief on top of this foundation
- The storage repo daily/ directory format is established and stable

---
*Phase: 02-foundation-and-capture*
*Completed: 2026-03-14*

## Self-Check: PASSED

- FOUND: stubs/claude-code/donna/add-task.md
- FOUND: stubs/claude-code/donna/done.md
- FOUND: workflows/add-task.md
- FOUND: workflows/done.md
- FOUND: src/installer.cjs
- FOUND: test/stubs.test.cjs
- FOUND: .planning/phases/02-foundation-and-capture/02-02-SUMMARY.md
- FOUND commit: 81e9c13 (Task 1)
- FOUND commit: 9daa676 (Task 2)
