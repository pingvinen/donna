---
created: 2026-03-14T14:36:46.703Z
title: Make changelog more compact and human friendly
area: tooling
files:
  - scripts/generate-changelog.cjs
---

## Problem

The generated changelog (used in GitHub releases via `scripts/generate-changelog.cjs`) is not compact or human-friendly enough. Release notes should be easy to scan and highlight what matters to users.

## Solution

Review `scripts/generate-changelog.cjs` output format. Consider grouping by category (features, fixes, chores), using concise bullet points, dropping noise like commit hashes or bot commits, and focusing on user-facing impact.
