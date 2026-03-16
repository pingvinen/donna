---
created: 2026-03-16T21:58:46.148Z
title: Skip setup prompt when Donna is already configured
area: tooling
files:
  - src/installer.cjs
---

## Problem

After running `donna:setup`, the installer still prints "run /donna:setup to get started" as its success message. This is confusing for returning users who have already completed setup — it implies they need to do it again.

## Solution

Detect whether setup has previously been run (e.g., check for existence of `~/.donna/` or the storage repo config). If already configured, replace the setup prompt with a positive "go get em" style message instead. The check should be lightweight since it runs on every install/upgrade.
