---
created: 2026-03-16T00:27:59.947Z
title: Parallelize tool capability commands for faster data pulls
area: tooling
files:
  - workflows/begin-the-day.md:130-165
  - workflows/run-tools.md:103-136
---

## Problem

Tool capability commands run sequentially — each waits for the previous to finish before starting. With a single tool (gh) this already takes multiple minutes at times. Adding jira (notoriously slow Atlassian API) and other tools will make begin-the-day and run-tools painfully slow, especially in real work scenarios with many items to fetch.

## Solution

Run all tool capability commands in parallel (e.g., `bash &` background jobs or parallel subshells) and collect results after all complete. Each command already has a 10-second timeout, so the total wall time becomes max(individual times) instead of sum(individual times). Need to handle per-command success/failure independently, which is already the case — just needs parallel execution.
