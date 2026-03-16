---
phase: 04-external-tool-enrichment
plan: 01
subsystem: workflows
tags: [cli-tools, tools-registry, add-tool, donna-workflow, stub]

# Dependency graph
requires:
  - phase: 03-daily-rhythm
    provides: begin-the-day workflow and stub patterns used as template
  - phase: 03.1-standing-files-subfolder
    provides: check-pending-migrations block pattern (character-for-character identical)
provides:
  - donna:add-tool stub at stubs/claude-code/donna/add-tool.md
  - add-tool workflow at workflows/add-tool.md with 11 steps
  - tools.md data schema for tool capability storage
  - Training data baseline for gh/jira/kubectl capabilities
affects: [04-02, 04-03, 04-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "add-tool workflow: read-config + check-pending-migrations + tool-specific steps + git-commit + confirm"
    - "Upsert pattern: read tools.md, replace matching section, write full file back"
    - "Training data baseline for well-known tools (gh/jira/kubectl) instead of --help parsing"
    - "Batch mode via AskUserQuestion when set-role noted multiple tools"

key-files:
  created:
    - stubs/claude-code/donna/add-tool.md
    - workflows/add-tool.md
  modified:
    - test/stubs.test.cjs

key-decisions:
  - "add-tool stub has no WebSearch — it is a configuration skill not a research skill"
  - "check-pending-migrations step is character-for-character identical to begin-the-day.md and set-role.md versions"
  - "Training data used as capability baseline for gh/jira/kubectl — no --help parsing for known tools (TOOL-02)"
  - "tools.md upsert replaces individual tool sections; all other sections preserved"
  - "Batch mode offered when set-role has noted multiple tools and no specific tool arg provided"
  - "auth-test warns on failure but does not stop — user may want to pre-configure before installing tools"

patterns-established:
  - "New workflow files follow: read-config → check-pending-migrations (identical) → domain steps → git-commit → confirm"
  - "tools.md format: YAML header, ## tool sections with command/version/learned/auth_test, ### Capabilities subsection"

requirements-completed: [TOOL-01, TOOL-02]

# Metrics
duration: 2min
completed: 2026-03-16
---

# Phase 04 Plan 01: Add-Tool Stub and Workflow Summary

**donna:add-tool stub and 11-step workflow that verifies installation, tests auth, synthesizes capabilities from training data for gh/jira/kubectl, and persists to tools.md with upsert logic**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-15T23:06:44Z
- **Completed:** 2026-03-15T23:08:44Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created donna:add-tool stub with correct allowed-tools (Read/Write/Bash/AskUserQuestion, no WebSearch)
- Created 11-step add-tool workflow covering the full tool declaration lifecycle
- check-pending-migrations step is character-for-character identical to begin-the-day.md (requirement met)
- Training data baseline for gh/jira/kubectl satisfies TOOL-02 requirement
- Added 20 test assertions covering stub frontmatter, workflow structure, and capability logic
- All 161 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create add-tool stub and workflow** - `855639f` (feat)
2. **Task 2: Add test assertions for add-tool stub and workflow** - `76bfe07` (test)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `stubs/claude-code/donna/add-tool.md` - Thin stub referencing @~/.donna/workflows/add-tool.md
- `workflows/add-tool.md` - 11-step workflow: read-config, check-pending-migrations, detect-noted-tools, ask-tool-name, verify-installation, auth-test, learn-capabilities, select-capabilities, write-tools-md, git-commit, confirm
- `test/stubs.test.cjs` - Added describe blocks for add-tool stub (9 assertions) and add-tool workflow (10 assertions)

## Decisions Made
- add-tool has no WebSearch because it is a configuration tool, not a research tool — capabilities come from training data (known tools) or --help (unknown tools)
- check-pending-migrations block copied character-for-character from begin-the-day.md per the established project pattern
- Training data used as capability baseline for gh/jira/kubectl to avoid fragile --help parsing
- Upsert logic replaces individual tool sections to avoid losing other tools on re-configure

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## Next Phase Readiness
- tools.md data schema established — ready for begin-the-day integration (04-02) and relearn-tools (04-03)
- add-tool workflow is the data producer; subsequent plans are consumers

---
*Phase: 04-external-tool-enrichment*
*Completed: 2026-03-16*
