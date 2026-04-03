---
phase: 06-polish-and-harden
plan: "04"
subsystem: tooling
tags: [tool-learning, add-tool, relearn-tools, cascading-docs, source-code-analysis]

# Dependency graph
requires:
  - phase: 06-02
    provides: adjust-tool simplification (type change removed)
provides:
  - Cascading tool capability learning in add-tool (local docs, CLI help, web docs, source code opt-in)
  - Cascading tool capability learning in relearn-tools (same cascade, invocation-update focus)
affects: [add-tool, relearn-tools, tool-management, capability-discovery]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Cascading capability discovery: local docs -> CLI help -> web docs -> source code (user opt-in)"
    - "AskUserQuestion for opt-in analysis to keep source code inspection user-controlled"

key-files:
  created: []
  modified:
    - workflows/add-tool.md
    - workflows/relearn-tools.md

key-decisions:
  - "4-stage cascade for unknown CLI tools: local docs (Stage 1), --help baseline (Stage 2), web docs if < 3 capabilities (Stage 3), source code with user opt-in (Stage 4)"
  - "Source code analysis always requires user consent via AskUserQuestion — never automatic"
  - "Well-known tool baselines (gh, jira, kubectl) unchanged — cascade only applies to unknown tools"
  - "In relearn-tools, new capabilities only via Stage 4 (user opt-in) — Stages 1-3 update invocations only"

patterns-established:
  - "Unknown CLI tool learning: attempt local docs first, fall back to --help, then web, then source"
  - "User opt-in pattern for potentially expensive/intrusive operations (source code reading)"

requirements-completed: [D-09]

# Metrics
duration: 2min
completed: 2026-03-27
---

# Phase 06 Plan 04: Enhance Tool Learning — Cascading Sources Summary

**4-stage cascading capability discovery for unknown CLI tools in add-tool and relearn-tools: local docs, --help, web docs, and user-opt-in source code analysis**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-03-27T19:25:01Z
- **Completed:** 2026-03-27T19:27:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Enhanced `add-tool` learn-capabilities step with 4-stage cascade for unknown CLI tools
- Enhanced `relearn-tools` relearn-changed step with the same cascade adapted for re-learning (invocation updates, not re-selection)
- Both workflows preserve well-known tool baselines (gh, jira, kubectl), GraphQL introspection, and REST/MCP learning paths unchanged

## Task Commits

Each task was committed atomically:

1. **Task 1: Add cascading learning to add-tool learn-capabilities step** - `cf06623` (feat)
2. **Task 2: Add cascading learning to relearn-tools relearn-changed step** - `8eeac4a` (feat)

## Files Created/Modified

- `workflows/add-tool.md` - Unknown tool learning block replaced with 4-stage cascade (Stages 1-4 with local docs, CLI help, web docs, source code opt-in)
- `workflows/relearn-tools.md` - Unknown tool re-learning block replaced with same cascade adapted for invocation-update focus

## Decisions Made

- Stage 4 (source code analysis) is always user-opt-in via AskUserQuestion — never automatic. This respects user control over potentially slow or expensive operations.
- In `relearn-tools`, the cascade goal is invocation update (not capability discovery). Only Stage 4 can add new capabilities, and only with user permission.
- The cascade only applies to unknown CLI tools. Well-known baselines and non-CLI tool types are untouched.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 04 complete. The enhanced tool learning cascade is ready.
- Remaining wave 2 plan: 06-05 (refactor skill bootstrap into donna-tools.cjs module).

## Self-Check: PASSED

- workflows/add-tool.md: FOUND
- workflows/relearn-tools.md: FOUND
- 06-04-SUMMARY.md: FOUND
- Commit cf06623 (Task 1): FOUND
- Commit 8eeac4a (Task 2): FOUND

---
*Phase: 06-polish-and-harden*
*Completed: 2026-03-27*
