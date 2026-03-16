---
created: 2026-03-16T13:27:20.221Z
title: Generate user-facing pending TODOs list after phase execution
area: tooling
files: []
---

## Problem

When a phase finishes executing, users (and external observers on GitHub) have no visibility into what ideas and issues are already under consideration. The pending TODOs live in `.planning/todos/pending/` which is useful for Claude but not easily discoverable for humans browsing the repo.

## Solution

After a phase completes execution, generate a markdown file (e.g., `TODOS.md` or `.planning/PENDING.md`) that lists all pending TODOs in a human-readable format — title, area, and a brief summary. This file should be committed alongside the phase completion so it stays up to date. The finish-execution or execute-phase workflow would trigger the generation. This makes it possible for users and contributors to see on GitHub which things are already being tracked without needing to dig into individual todo files.
