---
created: 2026-03-14T12:19:32.677Z
title: Clean up removed files on upgrade
area: tooling
files:
  - src/installer.cjs:84-88
---

## Problem

The installer uses `fs.cpSync` to copy workflows to `~/.donna/workflows/` and stubs to provider targets (e.g., `~/.claude/commands/donna/`). This only adds or overwrites files — it never removes files that were present in a previous version but deleted in the current one.

If a workflow, template, or stub is renamed or removed in a future package version, the old file remains on the user's machine after upgrade, potentially causing confusion or stale behavior.

## Solution

On upgrade, diff the set of files in the source directories against what's already installed and remove files that no longer exist in the package. Needs care to avoid deleting user-created files — could use a manifest (e.g., `.donna/.installed-files.json`) that tracks what the installer placed, so only installer-managed files get cleaned up.
