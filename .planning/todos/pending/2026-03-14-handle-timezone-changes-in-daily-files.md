---
created: 2026-03-14T22:10:44.475Z
title: Handle timezone changes in daily files
area: general
files: []
---

## Problem

When traveling across timezones, the concept of "today" can shift backward. If I'm in UTC+2 and it's March 15, then fly to UTC-5 where it's still March 14, Donna could get into messy states — a daily file for March 15 already exists but "today" is now March 14 again. This could cause duplicate entries, missed journals, or confusion about which file is current.

## Solution

Store the timezone in the frontmatter of daily files (e.g., `timezone: Europe/Copenhagen`). On each session start, detect timezone mismatches using one of two strategies (evaluate which is faster/cheaper):

1. **Check if tomorrow's file exists** — if a file for today+1 exists, we've likely traveled backward in time
2. **Compare current timezone to the timezone in today's file frontmatter** — if they differ, handle the transition

Once detected, handle gracefully — potentially by merging entries, annotating the timezone shift, or treating the "future" file as still valid for continuity.
