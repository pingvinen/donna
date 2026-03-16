---
phase: 02-foundation-and-capture
plan: 01
subsystem: skills
tags: [donna, setup, workflow, markdown, claude-code, stub, tdd]

# Dependency graph
requires:
  - phase: 01-packaging-and-distribution
    provides: stub-workflow split pattern, installer, test framework
provides:
  - Real donna:setup stub with Write and AskUserQuestion in allowed-tools
  - Interactive setup workflow with 8-step guided flow
  - Bootstrap config at ~/.config/donna/config.md
  - Storage repo initialization with daily/ directory
  - TDD test anchor (setup-workflow.test.cjs)
affects:
  - 02-02 (add-task uses bootstrap config pattern established here)
  - 02-03 (done uses bootstrap config pattern established here)
  - all future skills that read ~/.config/donna/config.md

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Bootstrap config: ~/.config/donna/config.md with YAML frontmatter (storage_repo, auto_push)"
    - "Re-run detection: setup reads config first, offers update/view/reset/cancel menu"
    - "git -C <repo>: all git operations use -C flag, no cd side effects"
    - "XDG config dir: mkdir -p ~/.config/donna before writing config"

key-files:
  created:
    - test/setup-workflow.test.cjs
  modified:
    - stubs/claude-code/donna/setup.md
    - workflows/setup.md
    - test/stubs.test.cjs

key-decisions:
  - "Bootstrap config uses YAML frontmatter with storage_repo and auto_push fields"
  - "Setup workflow has 8 named steps using <step> tags matching established pattern"
  - "Replaced obsolete version.md test with AskUserQuestion test in stubs.test.cjs (Rule 1 auto-fix)"

patterns-established:
  - "Bootstrap config pattern: all skills read ~/.config/donna/config.md first"
  - "Re-run detection: detect existing config, offer menu instead of silently overwriting"
  - "Daily structure: only daily/ created in setup — other dirs belong to later phases"

requirements-completed: [SETUP-01, SETUP-02, STORE-01]

# Metrics
duration: 12min
completed: 2026-03-14
---

# Phase 2 Plan 01: Setup Workflow Summary

**Interactive donna:setup workflow with 8-step guided flow creating ~/.config/donna/config.md and daily/ storage structure via AskUserQuestion prompts**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-14T00:00:00Z
- **Completed:** 2026-03-14T00:12:00Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 4

## Accomplishments

- Replaced hello-world setup stub and workflow with real interactive setup
- Setup stub now declares all 4 required tools: Read, Write, Bash, AskUserQuestion
- Workflow guides user through 8 steps: banner, config detection, repo path prompt, path expansion and validation, daily/ creation, bootstrap config write, initial git commit, summary
- Re-run detection offers update/view/reset/cancel menu when config already exists
- TDD: created failing structural invariant tests first (RED), then made them pass (GREEN)
- 84 tests passing, biome lint clean

## Task Commits

Each task was committed atomically:

1. **Task 1: Update setup stub and create tests (TDD RED)** - `83d42fa` (test)
2. **Task 2: Replace setup workflow with real interactive setup logic (TDD GREEN)** - `4c05ad4` (feat)

**Plan metadata:** _(pending — created in final commit)_

_Note: TDD tasks have two commits (test RED → feat GREEN)_

## Files Created/Modified

- `stubs/claude-code/donna/setup.md` - Updated allowed-tools (added Write, AskUserQuestion), updated description
- `workflows/setup.md` - Replaced stub placeholder with real 8-step interactive setup workflow
- `test/stubs.test.cjs` - Added Write/AskUserQuestion tests, updated obsolete version.md test, added config.md test
- `test/setup-workflow.test.cjs` - New TDD anchor file with 5 structural invariant tests for the setup workflow

## Decisions Made

- Bootstrap config stored at `~/.config/donna/config.md` with YAML frontmatter (`storage_repo`, `auto_push: false`)
- Only `daily/` directory created in setup — standing files (role.md, recurring.md, etc.) belong to later phases per locked decisions
- Setup workflow detects existing config and offers 4-option menu (change path / view / reset / cancel) instead of silently overwriting
- All git operations use `git -C <repo>` to avoid cd side effects

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced obsolete version.md test with AskUserQuestion test**
- **Found during:** Task 2 (setup workflow implementation)
- **Issue:** `stubs.test.cjs` had a test "references version.md for version display" that checked old stub behavior (the hello-world stub showed installed version from version.md). The real setup workflow has no version.md step, so this test was outdated and failing.
- **Fix:** Replaced with "contains AskUserQuestion step for interactive prompts" — a test that validates real setup workflow behavior
- **Files modified:** `test/stubs.test.cjs`
- **Verification:** All 84 tests pass, biome clean
- **Committed in:** `4c05ad4` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - outdated test for replaced behavior)
**Impact on plan:** Required fix — the test was asserting the exact thing being replaced. No scope creep.

## Issues Encountered

None — plan executed cleanly. The only issue was the pre-existing test asserting old stub behavior that was being intentionally replaced, caught immediately during GREEN phase.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Bootstrap config pattern established — add-task and done can now follow Pattern 2 (read-config step first)
- Setup workflow ready to ship in next package release
- Plans 02-02 (add-task) and 02-03 (done) can proceed immediately

## Self-Check: PASSED

- FOUND: stubs/claude-code/donna/setup.md
- FOUND: workflows/setup.md
- FOUND: test/stubs.test.cjs
- FOUND: test/setup-workflow.test.cjs
- FOUND: 02-01-SUMMARY.md
- FOUND: commit 83d42fa (TDD RED)
- FOUND: commit 4c05ad4 (TDD GREEN)

---
*Phase: 02-foundation-and-capture*
*Completed: 2026-03-14*
