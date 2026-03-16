---
created: "2026-03-16T20:51:54.429Z"
title: Check for new Donna version once per day
area: tooling
files:
  - src/version.cjs
  - src/installer.cjs
---

## Problem

Donna users have no way to know a new version is available unless they manually run `npx @pingvinen/donna-assistant` or check npm. A daily version check would let `begin-the-day` or other skills surface "update available" nudges, keeping users current without requiring them to remember to check.

## Solution

Add a version check that runs at most once per day (e.g., during `begin-the-day`). Query the npm registry for the latest published version of `@pingvinen/donna-assistant`, compare against the locally installed version in `~/.donna/version.md`, and persist the result (latest version + check timestamp) in the Donna state file. If an update is available, surface it in the daily brief output.
