---
phase: 06-polish-and-harden
plan: "05"
subsystem: workflows
tags: [refactoring, donna-tools, bootstrap, workflows, installer]

# Dependency graph
requires:
  - phase: 06-01
    provides: donna-tools.cjs with init/commit/daily-path/resolve-secret subcommands
  - phase: 06-02
    provides: adjust-tool simplification
  - phase: 06-04
    provides: enhanced tool learning cascade in add-tool and relearn-tools

provides:
  - All 9 workflows call donna-tools init instead of inline bootstrap (~75 lines per workflow removed)
  - All committing workflows call donna-tools commit instead of inline git commands (~12 lines per workflow removed)
  - 5 daily-path workflows call donna-tools daily-path instead of manual path construction
  - Installer copies donna-tools.cjs to ~/.donna/ on every install/upgrade
  - Version check hint present in all 9 workflows

affects: [begin-the-day, add-task, done, run-tools, focus, set-role, add-tool, relearn-tools, adjust-tool, installer]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "All 9 workflows share a single donna-tools.cjs init step — eliminates ~675 lines of duplicated bootstrap"
    - "donna-tools commit encapsulates git add, status --porcelain, commit, and conditional push"
    - "donna-tools daily-path encapsulates date computation and path construction"
    - "Installer guard pattern: if (fs.existsSync(donnaToolsSource)) for forward compatibility"

key-files:
  created: []
  modified:
    - src/installer.cjs
    - workflows/begin-the-day.md
    - workflows/add-task.md
    - workflows/done.md
    - workflows/run-tools.md
    - workflows/focus.md
    - workflows/set-role.md
    - workflows/add-tool.md
    - workflows/relearn-tools.md
    - workflows/adjust-tool.md
    - test/stubs.test.cjs

key-decisions:
  - "Tests updated from checking config/donna/config.md presence to checking donna-tools.cjs init — tests now verify the refactored bootstrap contract"
  - "setup.md, help.md, and contribute-idea.md were explicitly excluded from refactoring — setup.md creates config so init would fail; help.md and contribute-idea.md are read-only"
  - "Installer guard: if (fs.existsSync(donnaToolsSource)) ensures older package versions without donna-tools.cjs don't fail on upgrade"

requirements-completed: [D-12]

# Metrics
duration: ~20min
completed: 2026-03-27
---

# Phase 06 Plan 05: Refactor Skill Bootstrap — Workflow Migration to donna-tools.cjs Summary

**9 workflows migrated from ~75-line inline bootstrap + ~12-line inline git commit to single donna-tools.cjs init and donna-tools.cjs commit calls, eliminating ~800 lines of duplicated boilerplate.**

## Performance

- **Duration:** ~20 min
- **Completed:** 2026-03-27
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

### Task 1: Installer donna-tools.cjs copy step

Added a copy step in `src/installer.cjs` that copies `src/donna-tools.cjs` to `~/.donna/donna-tools.cjs` on every install/upgrade. Guarded with `fs.existsSync` to prevent failures on older package versions.

### Task 2: 9 workflows refactored

All 9 workflows (begin-the-day, add-task, done, run-tools, focus, set-role, add-tool, relearn-tools, adjust-tool) now:

1. Start with a single `<step name="init">` that calls `donna-tools.cjs init` — replacing the inline `read-config` and `check-pending-migrations` steps.
2. Commit via `donna-tools.cjs commit "message" --files ...` instead of inline `git -C add/status/commit/push` blocks.
3. 5 workflows (begin-the-day, add-task, done, run-tools, focus) use `donna-tools.cjs daily-path` instead of manual date computation and path construction.
4. All 9 workflows print a version update hint when `update_available` is non-null.

`test/stubs.test.cjs` was updated to check for the new bootstrap contract (`donna-tools.cjs init`) instead of the old pattern (`config/donna/config.md` references and `check-pending-migrations` steps).

## Task Commits

1. **Task 1: Add donna-tools.cjs copy step to installer** — `e8da836` (feat)
2. **Task 2: Replace bootstrap and git-commit blocks in all 9 workflows** — `72de170` (feat)

## Files Created/Modified

- `src/installer.cjs` — donna-tools.cjs copy step added
- `workflows/begin-the-day.md` — init, daily-path, donna-tools commit
- `workflows/add-task.md` — init, daily-path, donna-tools commit
- `workflows/done.md` — init, daily-path, donna-tools commit
- `workflows/run-tools.md` — init, daily-path, donna-tools commit
- `workflows/focus.md` — init, daily-path, donna-tools commit
- `workflows/set-role.md` — init, donna-tools commit
- `workflows/add-tool.md` — init, donna-tools commit
- `workflows/relearn-tools.md` — init, donna-tools commit
- `workflows/adjust-tool.md` — init, donna-tools commit
- `test/stubs.test.cjs` — updated assertions for new bootstrap contract

## Decisions Made

- `setup.md`, `help.md`, and `contribute-idea.md` were explicitly excluded from the refactor:
  - `setup.md` creates the config file, so `donna-tools init` would fail (config does not exist yet)
  - `help.md` and `contribute-idea.md` are read-only workflows that don't need bootstrap
- Tests were updated from checking `config/donna/config.md` presence to checking `donna-tools.cjs init` — this verifies the refactored bootstrap contract
- The installer guard (`if (fs.existsSync(donnaToolsSource))`) enables safe upgrades from older Donna versions that don't have `donna-tools.cjs` in their package

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] stubs.test.cjs tests checked for old bootstrap patterns**
- **Found during:** Task 2 verification
- **Issue:** 12 tests in `test/stubs.test.cjs` checked for `config/donna/config.md` references, `check-pending-migrations` step presence, and `step name="read-config"` — all of which were removed by this refactor
- **Fix:** Updated 12 test assertions to check for `donna-tools.cjs init` and `step name="init"` instead
- **Files modified:** test/stubs.test.cjs
- **Commit:** 72de170 (included in task 2 commit)

## Known Stubs

None — all 9 workflows are fully wired to donna-tools.cjs.

## Self-Check: PASSED

- [x] `src/installer.cjs` contains `donna-tools.cjs`: FOUND (4 occurrences)
- [x] `src/installer.cjs` contains `copyFileSync`: FOUND
- [x] `src/installer.cjs` contains "Installed donna-tools.cjs": FOUND
- [x] All 9 workflows contain `donna-tools.cjs init`: CONFIRMED (grep -rL returns empty)
- [x] None of the 9 workflows contain `read-config`: CONFIRMED (only help.md contains it)
- [x] None of the 9 workflows contain `check-pending-migrations`: CONFIRMED
- [x] `workflows/setup.md` does NOT contain `donna-tools.cjs`: CONFIRMED
- [x] `workflows/help.md` does NOT contain `donna-tools.cjs`: CONFIRMED
- [x] 5 daily-path workflows contain `donna-tools.cjs daily-path`: CONFIRMED
- [x] All 9 workflows contain `update_available`: CONFIRMED
- [x] `npm test` exits 0: CONFIRMED (314/314 pass)
- [x] `npm run lint` exits 0: CONFIRMED (no errors)
- [x] commit e8da836 exists: CONFIRMED
- [x] commit 72de170 exists: CONFIRMED
