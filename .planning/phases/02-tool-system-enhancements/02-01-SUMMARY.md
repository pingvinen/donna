---
phase: 02-tool-system-enhancements
plan: "01"
subsystem: tool-system
tags: [migration, tool-schema, pending-migrations, backfill]
dependency_graph:
  requires: []
  provides: [migration-003, backfill-tool-type-handler]
  affects: [workflows/add-tool.md, workflows/run-tools.md, workflows/begin-the-day.md, workflows/relearn-tools.md]
tech_stack:
  added: []
  patterns: [pending-migrations-flag, idempotent-migration, defensive-field-parsing]
key_files:
  created:
    - migrations/003-tool-type-backfill.cjs
  modified:
    - workflows/add-tool.md
    - workflows/run-tools.md
    - workflows/begin-the-day.md
    - workflows/relearn-tools.md
    - test/migrator.test.cjs
decisions:
  - "Migration 003 writes pending_migrations flag to ~/.donna/state.md; workflows execute the actual tools.md update on next run — same pattern as migration 002 for standing files"
  - "type field defaults to cli when absent, ensuring all 4 tool-reading workflows are defensively backward-compatible with existing tools.md files"
metrics:
  duration_seconds: 186
  completed_date: "2026-03-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 5
---

# Phase 2 Plan 01: Tool Type Schema Migration Summary

Migration 003 queues backfill-tool-type flag to state.md and all 4 tool workflows handle the pending migration plus parse the `type` field defensively (missing = cli).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create migration 003-tool-type-backfill.cjs | cd7bfd6 | migrations/003-tool-type-backfill.cjs, test/migrator.test.cjs |
| 2 | Add backfill-tool-type handler to all 4 tool workflows | dc1602a | workflows/add-tool.md, workflows/run-tools.md, workflows/begin-the-day.md, workflows/relearn-tools.md |

## What Was Built

**Migration 003** (`migrations/003-tool-type-backfill.cjs`):
- Version: `0.7.0`, description: "Backfill type: cli on existing tool sections in tools.md"
- Writes `backfill-tool-type` entry to `~/.donna/state.md` pending_migrations
- Idempotent: skips if flag already present (same pattern as migration 002)

**Workflow updates** (all 4 tool workflows):
- `check-pending-migrations` step extended with `backfill-tool-type` handler
- Handler reads tools.md, inserts `- type: cli` after each `- command:` line if missing
- Commits the updated tools.md to storage repo
- `read-tools-md` / `pull-tool-data` steps updated to extract `type` field, defaulting to `"cli"` when absent

**add-tool.md write-tools-md step**: New tool sections now include `- type: cli` field between `command` and `version`.

## Decisions Made

1. **Pending-flag pattern for tools.md backfill**: Migration 003 follows the exact same pattern as migration 002 (standing-files-subfolder) — write a pending flag to `~/.donna/state.md` rather than attempting direct file access from the migration context. The storage repo is not accessible from migration context (it requires config reading), so workflows execute the actual backfill on next run.

2. **Defensive default for type field**: All tool-reading code treats missing `type` field as `"cli"`. This ensures zero breaking changes for existing tools.md files and users who haven't run the backfill yet.

## Deviations from Plan

None — plan executed exactly as written.

## Test Results

```
✔ migrator (7 tests pass)
✔ provider detection (3 tests pass)
10 tests total, 0 failures
```

## Self-Check: PASSED

- [x] `migrations/003-tool-type-backfill.cjs` exists
- [x] `test/migrator.test.cjs` contains `003-tool-type-backfill`
- [x] All 4 workflows contain `backfill-tool-type`
- [x] `workflows/add-tool.md` contains `- type: cli` in write-tools-md (4 matches)
- [x] `workflows/run-tools.md` contains `treat as "cli"`
- [x] `workflows/begin-the-day.md` contains `treat as "cli"` and type field parsing
- [x] Commits cd7bfd6 and dc1602a exist
- [x] `node --test 'test/migrator.test.cjs'` exits 0
