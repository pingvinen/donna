---
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
plan: "06"
subsystem: naming, discoverability
status: complete
tags: [follow-up, rename, stub, discoverability]
requires:
  - 07-04
  - 07-05
provides:
  - donna:add-follow-up-task skill (renamed from donna:follow-up)
  - Discoverability alongside add-task when typing /add
affects:
  - stubs/claude-code/donna/add-follow-up-task.md (renamed from follow-up.md)
  - workflows/follow-up.md (inline examples)
  - src/installer.cjs (success message)
  - README.md (command table)
  - test/stubs.test.cjs (14 assertions)
tech-stack:
  added: []
  patterns:
    - stub-workflow-split (unchanged — only stub name and frontmatter changed)
key-files:
  created:
    - stubs/claude-code/donna/add-follow-up-task.md
  modified:
    - workflows/follow-up.md
    - src/installer.cjs
    - README.md
    - test/stubs.test.cjs
  deleted:
    - stubs/claude-code/donna/follow-up.md
decisions:
  - "Skill renamed to donna:add-follow-up-task for discoverability — surfaced alongside add-task when typing /add"
  - "Workflow file name (workflows/follow-up.md) kept unchanged — only stub file renamed"
  - "@~/.donna/workflows/follow-up.md reference preserved in stub execution_context"
  - "README directory tree reference to follow-ups.md (storage file) preserved"
  - "git-commit prefix donna(follow-up) in workflow preserved — describes workflow, not slash command"
metrics:
  duration_seconds: 214
  completed_date: "2026-06-17T20:35:07Z"
  task_count: 3
  file_count: 5
---

# Phase 07 Plan 06: Rename follow-up skill to add-follow-up-task for discoverability

**One-liner:** Renamed the follow-up skill stub from `donna:follow-up` to `donna:add-follow-up-task` — typing `/add` in Claude Code now surfaces both `add-task` and `add-follow-up-task` side by side.

## Summary

User testing revealed that `donna:follow-up` didn't appear alongside `donna:add-task` when typing `/add`. By renaming the skill to `donna:add-follow-up-task` and renaming the stub file from `follow-up.md` to `add-follow-up-task.md`, the skill now surfaces naturally when a user thinks "I need to add something."

The rename was propagated through 5 files: the stub (rename + frontmatter), workflow inline examples, installer success message, README command table, and 14 test assertions. The workflow file name (`workflows/follow-up.md`), its `@~/.donna/` reference, the storage file (`donna/follow-ups.md`), and the git-commit prefix were intentionally left unchanged — only the user-facing skill name changed.

## Tasks Completed

| # | Name | Type | Commit | Files |
|---|------|------|--------|-------|
| 1 | Rename stub file and update frontmatter name | auto | `0dc6622` | `stubs/claude-code/donna/add-follow-up-task.md` |
| 2 | Update workflow inline examples to new skill name | auto | `297e346` | `workflows/follow-up.md` |
| 3 | Update installer, README, and tests for renamed skill | auto | `6e532a8` | `src/installer.cjs`, `README.md`, `test/stubs.test.cjs` |

## Deviations from Plan

None — plan executed exactly as written.

## Success Criteria Verification

1. ✅ Stub file renamed from `follow-up.md` to `add-follow-up-task.md` with frontmatter `name: donna:add-follow-up-task`
2. ✅ Workflow inline examples updated from `/donna:follow-up` to `/donna:add-follow-up-task`
3. ✅ Installer success message lists `add-follow-up-task`
4. ✅ README command table shows `/donna:add-follow-up-task`
5. ✅ All follow-up-related test assertions pass (16 tests across 4 describe blocks)
6. ✅ Old name `/donna:follow-up` / `donna:follow-up` no longer appears in any source file

## Self-Check: PASSED

- `stubs/claude-code/donna/add-follow-up-task.md` — EXISTS
- `stubs/claude-code/donna/follow-up.md` — DELETED (expected)
- Commit `0dc6622` — EXISTS
- Commit `297e346` — EXISTS
- Commit `6e532a8` — EXISTS
- `grep -r "donna:follow-up" stubs/ src/ README.md test/ workflows/` — 0 matches