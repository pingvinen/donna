---
phase: 02-tool-system-enhancements
plan: "07"
subsystem: workflows
tags: [add-tool, relearn-tools, graphql, ux-fix, picker-menu-fix]
dependency_graph:
  requires: []
  provides: [clean-capability-prompts, auth-optional-graphql-introspection]
  affects: [workflows/add-tool.md, workflows/relearn-tools.md]
tech_stack:
  added: []
  patterns: [conditional-curl-auth, print-before-ask]
key_files:
  created: []
  modified:
    - workflows/add-tool.md
    - workflows/relearn-tools.md
decisions:
  - "Capability examples moved outside AskUserQuestion as 'Print to user' prose blocks to avoid Claude Code picker menu rendering"
  - "GraphQL introspection proceeds unconditionally; auth header included only when a real (non-placeholder) secret is resolved"
metrics:
  duration_seconds: 101
  completed_date: "2026-03-20"
  tasks_completed: 2
  files_modified: 2
---

# Phase 02 Plan 07: UAT Gap Fixes — Picker Menu and Public GraphQL Summary

## One-liner

Fixed two UAT-identified UX gaps: moved REST/GraphQL/MCP capability examples outside AskUserQuestion to prevent picker menu rendering, and removed the auth hard gate so public GraphQL APIs can be introspected without secrets.

## What Was Built

### Task 1: Move capability examples out of AskUserQuestion prompts (commit: 3e7481a)

In `workflows/add-tool.md`, the `learn-capabilities` step had three AskUserQuestion blocks (for rest, graphql, mcp tool types) that embedded "Examples:" sections with hyphenated bullet lines. Claude Code parses those bullets as picker menu options, breaking free-text input.

Each block was restructured to:
- Print format and examples as plain text above the AskUserQuestion (using "Print to user:" blocks)
- Keep the AskUserQuestion prompt as a single clean question with no bullets, no "Examples:" heading, no hyphens

This matches the established pattern already used for the URL prompt.

### Task 2: Make GraphQL introspection auth-optional (commit: ac1057f)

In `workflows/relearn-tools.md`, the `check-versions` step's GraphQL branch had two issues:

1. A hard gate: if auth_secret was missing or a placeholder, the tool was added to `<unchanged_tools>` with "skipped — no secret configured" and processing stopped. This prevented public GraphQL APIs (e.g., GitHub's public GraphQL) from being introspected.

2. An unconditional auth header in the curl command, which sent garbage headers to public APIs.

Fix: Removed the hard gate. Now introspection always proceeds. The auth header is conditionally included: only when secrets.md contains a real (non-placeholder, not containing "REPLACE_WITH") value for the tool's auth_secret. Public APIs proceed without auth headers.

Also cleaned up the `report-unchanged` step to remove the stale "skipped — no secret configured" skip reason from the list of possible skip messages.

## Verification

1. No AskUserQuestion block in add-tool.md contains hyphenated bullet lines — PASS
2. relearn-tools.md does not contain "skipped -- no secret configured" as a hard gate — PASS
3. relearn-tools.md curl command conditionally includes auth header — PASS
4. `npm run lint:fix` passes with no errors — PASS

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- workflows/add-tool.md modified: FOUND
- workflows/relearn-tools.md modified: FOUND
- Task 1 commit 3e7481a: FOUND
- Task 2 commit ac1057f: FOUND
