---
phase: 06-polish-and-harden
plan: 02
subsystem: ci, installer, workflows
tags: [github-actions, uat-gate, installer, adjust-tool]

requires: []
provides:
  - "GitHub Actions UAT merge gate workflow that blocks PRs without uat:pass label"
  - "Installer skip-setup guard that suppresses setup prompt for already-configured installs"
  - "Simplified adjust-tool workflow with type as read-only (4 options instead of 5)"
affects: [ci, installer, adjust-tool]

tech-stack:
  added: []
  patterns:
    - "UAT label gate: event payload label check without API call — no token needed"
    - "Skip-setup guard: existsSync + includes pattern for lightweight config check"

key-files:
  created:
    - ".github/workflows/uat-gate.yml"
  modified:
    - "src/installer.cjs"
    - "test/installer.test.cjs"
    - "workflows/adjust-tool.md"
    - "README.md"

key-decisions:
  - "UAT gate uses event payload labels (github.event.pull_request.labels.*.name) — no API call or token required"
  - "Installer config check uses existsSync + readFileSync.includes('storage_repo:') — lightweight, no YAML parse"
  - "adjust-tool type field retained as read-only display in show-current-config, removed only from editable options"

patterns-established:
  - "UAT gate pattern: label-based PR gating using shell grep on event payload JSON"

requirements-completed: [D-04, D-05, D-06]

duration: 15min
completed: 2026-03-27
---

# Phase 06 Plan 02: UAT Gate, Skip-Setup Guard, Simplify Adjust-Tool Summary

**UAT merge gate blocks PRs without uat:pass label; installer skips setup prompt for existing users; adjust-tool simplified to 4 editable fields.**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-27T00:00:00Z
- **Completed:** 2026-03-27T00:15:00Z
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments

- Created `.github/workflows/uat-gate.yml` — triggers on label events, checks for uat:pass label, fails with exit 1 when absent; uses event payload (no API call)
- Added skip-setup guard to `installer.cjs` — suppresses "Run /donna:setup" message when config.md with storage_repo already exists
- Simplified `adjust-tool.md` — removed type change option (option 5) and all associated format-mismatch detection logic; type remains visible in read-only display
- Updated README.md to drop "type" from adjust-tool description in two places
- Added 2 tests for the skip-setup guard (fresh install shows message, configured install suppresses it)

## Task Commits

1. **Task 1: Add GitHub Actions UAT merge gate** - `56958d0` (feat)
2. **Task 2: Add skip-setup guard and simplify adjust-tool** - `ce46002` (feat)

**Plan metadata:** (docs commit added below)

## Files Created/Modified

- `.github/workflows/uat-gate.yml` — UAT merge gate workflow; checks uat:pass label on PRs to main
- `src/installer.cjs` — Added isConfigured check to suppress setup prompt for existing users
- `test/installer.test.cjs` — Added skip-setup guard test suite (2 tests)
- `workflows/adjust-tool.md` — Removed type change option; objective and menu updated
- `README.md` — Removed "type" from adjust-tool description in prose and commands table

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `.github/workflows/uat-gate.yml` — FOUND
- `src/installer.cjs` contains `isConfigured` — FOUND
- `workflows/adjust-tool.md` does not contain `5. type` — CONFIRMED
- All 289 tests pass — CONFIRMED
- Lint clean — CONFIRMED
