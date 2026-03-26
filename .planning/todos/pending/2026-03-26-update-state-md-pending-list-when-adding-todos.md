---
created: 2026-03-26T21:22:42.477Z
title: Update STATE.md pending list when adding TODOs
area: planning
files:
  - .planning/STATE.md
  - .claude/get-shit-done/workflows/add-todo.md
---

## Problem

When new TODOs are created (e.g., via `/gsd:add-todo` or ingested from GitHub issues), the "Pending Todos" section in STATE.md can become stale — it doesn't always reflect the actual list of files in `todos/pending/`. The quick task just completed (260326-ux1) had to clean up phantom entries and add missing ones. The add-todo workflow should ensure STATE.md stays in sync whenever a TODO is added.

## Solution

Ensure the add-todo workflow (and any other TODO-creating workflow like ingest-issues) appends the new entry to STATE.md's "Pending Todos" list as part of the commit. The current workflow already has an `update_state` step but it may not be fully wiring the new entry into the list.
