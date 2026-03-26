---
created: 2026-03-26T22:30:00.000Z
title: Add GitHub workflow that blocks merging if UAT not finalized (ref: #27)
area: ci
github_issue: 27
files: []
---

## Problem

Currently there are no checks validating a PR before merge. PRs can be merged even if the UAT process has not been finalized and problems remain unsolved.

## Solution

Create a GitHub workflow that checks for a finalized UAT file (status: complete, no unresolved issues) and blocks the PR from merging if UAT has not passed. Problems that are explicitly deferred to later phases should not block.
