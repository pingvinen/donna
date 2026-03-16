---
created: 2026-03-14T22:12:37.461Z
title: Prevent duplicate tasks when carrying over or adding recurring items
area: general
files: []
---

## Problem

When Donna carries over incomplete items from yesterday's journal or adds recurring tasks to today's file, there's no deduplication check. This can result in the same task appearing multiple times — e.g., a recurring task gets added but the same task was already carried over as incomplete, or a task is carried over that was already manually added to today.

## Solution

Before adding a task (whether from carryover or recurring schedule), compare against existing tasks in today's daily file. Match on normalized title text (case-insensitive, trimmed). If a match is found, skip the duplicate. Consider fuzzy matching or keyword overlap for near-duplicates (e.g., "Review PRs" vs "Review open PRs").
