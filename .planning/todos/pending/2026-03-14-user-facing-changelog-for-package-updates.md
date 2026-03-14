---
created: 2026-03-14T15:00:30.307Z
title: User-facing changelog for package updates
area: tooling
files:
  - scripts/generate-changelog.cjs
---

## Problem

When a user updates the donna package, they should see what changed that's relevant to them. The release changelog includes internal changes (ci, deps, build) that users don't care about.

## Solution

Add a `userFacing` filter mode to the existing `generateChangelog` function. When enabled, drop entries with internal scopes (ci, deps, build, etc.). Unscoped feat/fix commits pass through as likely user-facing. The installer/updater calls `generateChangelog(messages, { userFacing: true })` while the release workflow continues using the unfiltered version.
