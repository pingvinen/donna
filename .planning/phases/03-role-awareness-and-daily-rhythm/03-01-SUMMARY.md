---
phase: 03-role-awareness-and-daily-rhythm
plan: 01
subsystem: skills
tags: [set-role, role-awareness, websearch, recurring-tasks, workflow]
dependency_graph:
  requires: [donna:setup (02-01)]
  provides: [role.md, role-research.md, recurring.md in storage repo]
  affects: [03-02-begin-the-day (consumes recurring.md)]
tech_stack:
  added: []
  patterns: [stub+workflow pair, TDD red-green, WebSearch in allowed-tools, rerun-detection]
key_files:
  created:
    - stubs/claude-code/donna/set-role.md
    - workflows/set-role.md
  modified:
    - test/stubs.test.cjs
decisions:
  - WebSearch included in allowed-tools stub frontmatter to avoid per-call permission prompts during research step
  - Recurring tasks format uses "- Task: interval" with optional "| last_run: date" suffix for biweekly/every-other intervals
  - diff-update mode preserves manually-added tasks from existing recurring.md before merging new research suggestions
  - Tool suggestions noted only — no tools.md written (Phase 4 concern)
metrics:
  duration: "~2 min"
  completed: "2026-03-15"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 3 Plan 1: donna:set-role Stub and Workflow Summary

**One-liner:** Two-stage role definition workflow using WebSearch for role research, AskUserQuestion for approval, and structured persistence to role.md, role-research.md, and recurring.md.

## What Was Built

The `donna:set-role` skill — stub and workflow — enabling users to define their job role through an interactive two-stage flow.

**Stub** (`stubs/claude-code/donna/set-role.md`): YAML frontmatter with `name: donna:set-role`, `description`, and `allowed-tools` including WebSearch (critical for research step), AskUserQuestion, Read, Write, Bash. References `@~/.donna/workflows/set-role.md`.

**Workflow** (`workflows/set-role.md`): 12-step workflow covering:
1. read-config — reads `~/.config/donna/config.md`, stops if missing
2. check-existing-role — detects if role.md exists in storage repo
3. rerun-menu — offers reset/diff-update/re-research/cancel options
4. ask-role — collects job title, team size, direct reports, key responsibilities
5. research — runs 2–3 WebSearch queries using full role context
6. present-summary — prints research overview, asks which category to review
7. approve-recurring — per-task approve/reject/modify with natural language interval parsing
8. approve-tools — notes tool interest, reminds about /donna:add-tool (future)
9. save-role — writes role.md with YAML frontmatter and prose summary
10. save-recurring — writes recurring.md with "- Task: interval" format
11. git-commit — commits to storage repo, pushes if auto_push
12. confirm — prints success summary

**Tests** (`test/stubs.test.cjs`): 15 new tests across 2 new describe blocks validating stub frontmatter, workflow structure, file references, and STORE-03 compliance (no full-repo glob/ls).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create set-role stub and workflow | 1d9a336 | stubs/claude-code/donna/set-role.md, workflows/set-role.md |
| 2 (RED) | Add failing set-role tests | c2c42a6 | test/stubs.test.cjs |
| 2 (GREEN) | Tests pass with Task 1 artifacts | 1d9a336 | — |

## Verification

- `npm test` passes: 124/124 tests
- `stubs/claude-code/donna/set-role.md` has WebSearch in allowed-tools
- `workflows/set-role.md` has all 12 steps with proper `<step name="...">` tags
- Workflow reads config.md first, detects existing role, presents rerun menu
- Workflow writes role.md, role-research.md, recurring.md (no tools.md — Phase 4)
- TDD: RED committed (c2c42a6) before GREEN (1d9a336)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- stubs/claude-code/donna/set-role.md: FOUND
- workflows/set-role.md: FOUND
- test/stubs.test.cjs: FOUND (modified)
- Commit c2c42a6: FOUND (TDD RED)
- Commit 1d9a336: FOUND (feat + TDD GREEN)
- npm test: 124/124 PASS
