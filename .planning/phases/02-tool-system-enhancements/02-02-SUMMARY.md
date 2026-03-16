---
phase: 02-tool-system-enhancements
plan: "02"
subsystem: tool-system
tags: [adjust-tool, skill, workflow, installer]
dependency_graph:
  requires: []
  provides: [donna:adjust-tool-skill, adjust-tool-workflow]
  affects: [stubs/claude-code/donna/adjust-tool.md, workflows/adjust-tool.md, src/installer.cjs]
tech_stack:
  added: []
  patterns: [menu-driven-editing, skill-stub-pattern, workflow-step-pattern]
key_files:
  created:
    - stubs/claude-code/donna/adjust-tool.md
    - workflows/adjust-tool.md
  modified:
    - src/installer.cjs
    - test/stubs.test.cjs
    - test/installer.test.cjs
decisions:
  - "adjust-tool workflow includes both move-standing-files and backfill-tool-type migration handlers to stay in sync with all other tool workflows"
  - "Capabilities editing loop uses open-ended AskUserQuestion allowing remove/add/edit commands until user says done, consistent with other multi-step editing patterns in Donna workflows"
metrics:
  duration_seconds: 600
  completed_date: "2026-03-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 3
---

# Phase 2 Plan 02: Adjust-Tool Skill Summary

donna:adjust-tool skill created with stub, full menu-driven workflow for editing all tool fields (scope, capabilities, command, auth, type), installer registration, and test coverage.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create adjust-tool stub and workflow | f477fa6 | stubs/claude-code/donna/adjust-tool.md, workflows/adjust-tool.md |
| 2 | Register adjust-tool in installer and add test assertions | 82ca666 | src/installer.cjs, test/stubs.test.cjs, test/installer.test.cjs |

## What Was Built

**Stub** (`stubs/claude-code/donna/adjust-tool.md`):
- Frontmatter: `name: donna:adjust-tool`, description, `allowed-tools` (Read, Write, Bash, AskUserQuestion)
- References `@~/.donna/workflows/adjust-tool.md`

**Workflow** (`workflows/adjust-tool.md`):
- `read-config` step: reads config, Obsidian sync (copied verbatim from add-tool.md)
- `check-pending-migrations` step: handles both `move-standing-files` and `backfill-tool-type` (copied verbatim)
- `read-tools-md` step: reads tools.md, parses all tool fields including `type` (defaults to "cli" if absent)
- `select-tool` step: accepts argument or lists tools for selection via AskUserQuestion
- `show-current-config` step: displays all current tool fields
- `ask-what-to-change` step: menu of 5 options (scope, capabilities, command, auth, type)
- `apply-change` step: field-specific logic including re-learn prompt for scope changes, loop for capability edits
- `write-tools-md` step: targeted update of selected tool section only
- `git-commit` step: commits changed tools.md with conditional push
- `confirm` step: shows old → new summary

**Installer** (`src/installer.cjs`):
- Success message updated to include `adjust-tool` in the skill list string

**Tests**:
- `test/stubs.test.cjs`: Path constants for stub and workflow, describe blocks testing existence, frontmatter, and workflow reference
- `test/installer.test.cjs`: Assertion that skill copy success line mentions `adjust-tool`

## Decisions Made

1. **Migration handlers copied verbatim**: Both `move-standing-files` and `backfill-tool-type` handlers are included in the `check-pending-migrations` step. Plan 01 had not yet been executed when Plan 02 began, but per plan instructions, both handlers are included so adjust-tool stays in sync with all other tool workflows.

2. **Capability editing as open-ended loop**: Rather than a fixed add/remove/edit one-shot interaction, the capabilities step loops via AskUserQuestion until user types "done". This matches the user need to review changes incrementally without restarting the workflow.

## Deviations from Plan

None — plan executed exactly as written.

## Test Results

```
stubs.test.cjs: 166 tests pass, 0 failures
installer.test.cjs (adjust-tool test): PASS
Note: 9 pre-existing installer test failures due to migration 003 changing
lastMigration count from 2 to 3 (introduced in Plan 01, out of scope for this plan)
```

## Self-Check: PASSED

- [x] `stubs/claude-code/donna/adjust-tool.md` exists
- [x] `stubs/claude-code/donna/adjust-tool.md` contains `name: donna:adjust-tool`
- [x] `workflows/adjust-tool.md` exists with all required steps
- [x] `workflows/adjust-tool.md` contains `treat as "cli"` (defensive type parsing)
- [x] `src/installer.cjs` contains `adjust-tool` in skill list string
- [x] `test/stubs.test.cjs` contains `adjustToolStubPath` and `adjustToolWorkflowPath`
- [x] `test/installer.test.cjs` contains `adjust-tool` assertion
- [x] `node --test 'test/stubs.test.cjs'` exits 0 (166 pass)
- [x] Commit f477fa6 exists (Task 1)
- [x] Commit 82ca666 includes Task 2 changes (installer.cjs, test files)
