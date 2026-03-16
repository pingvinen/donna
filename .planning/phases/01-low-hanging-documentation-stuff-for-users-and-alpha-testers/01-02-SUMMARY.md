---
phase: 01-low-hanging-documentation-stuff-for-users-and-alpha-testers
plan: "02"
subsystem: skills
tags: [skills, workflows, help, contribute-idea, user-experience]
dependency_graph:
  requires: []
  provides:
    - donna:help skill (stub + workflow)
    - donna:contribute-idea skill (stub + workflow)
  affects:
    - stubs/claude-code/donna/
    - workflows/
tech_stack:
  added: []
  patterns:
    - stub + workflow pair (established pattern)
    - AskUserQuestion conversational loop
    - gh CLI for GitHub API interaction
    - @base64d jq decode for cross-platform base64 handling
key_files:
  created:
    - stubs/claude-code/donna/help.md
    - workflows/help.md
    - stubs/claude-code/donna/contribute-idea.md
    - workflows/contribute-idea.md
  modified: []
decisions:
  - help skill is strictly read-only — no Write in allowed-tools, no git commit steps
  - contribute-idea uses gh api with @base64d jq decode instead of platform base64 for cross-platform safety
  - contribute-idea does not require a read-config step — it interacts with GitHub only, not the storage repo
  - duplicate checking uses semantic similarity via Claude judgment rather than brittle substring matching
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-16"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 1 Plan 02: donna:help and donna:contribute-idea Skills Summary

**One-liner:** Conversational troubleshooting skill (donna:help) and guided GitHub Issue submission with duplicate detection (donna:contribute-idea), both using stub + workflow pairs.

## What Was Built

Two new skill pairs following the established stub + workflow pattern:

**donna:help** — Interactive diagnostic skill. Reads Donna config, inspects storage repo state, checks installed stubs and workflows, and checks configured tools. Uses AskUserQuestion for a conversational troubleshooting loop with follow-up options. Strictly read-only (no Write tool, no git commits).

**donna:contribute-idea** — Issue submission skill. Checks gh auth, collects idea from user, searches for duplicates in two sources (open GitHub Issues + STATE.md pending todos fetched via gh api), presents matches for user confirmation, then drafts and creates a GitHub Issue via gh issue create. Strictly read-only with respect to local files.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create donna:help stub and workflow | 58a5bf8 | stubs/claude-code/donna/help.md, workflows/help.md |
| 2 | Create donna:contribute-idea stub and workflow | 6bd3241 | stubs/claude-code/donna/contribute-idea.md, workflows/contribute-idea.md |

## Deviations from Plan

None — plan executed exactly as written.

Note: Task 1 files were committed in commit 58a5bf8 alongside CONTRIBUTING.md from plan 01 (both were staged together). The files are present and verified correct.

## Self-Check: PASSED

Files exist:
- FOUND: stubs/claude-code/donna/help.md
- FOUND: workflows/help.md
- FOUND: stubs/claude-code/donna/contribute-idea.md
- FOUND: workflows/contribute-idea.md

Commits exist:
- FOUND: 58a5bf8 (Task 1 files)
- FOUND: 6bd3241 (Task 2 files)
