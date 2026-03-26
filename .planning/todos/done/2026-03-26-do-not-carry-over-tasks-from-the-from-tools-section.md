---
created: 2026-03-26T17:01:09.972Z
title: Do not carry-over tasks from the From Tools section
area: general
files: []
---

## Problem

When Donna pulls tasks from external tools on day 1, they appear in a "From tools" section in the daily file. On carry-over to the next day, these tasks get moved into the regular "Tasks" section instead of being left behind. This is a bug — tool-sourced tasks should be re-pulled fresh by the tools each day, not carried forward as regular tasks.

GitHub issue: #17

## Solution

Modify the carry-over logic to skip/ignore tasks that are in the "From tools" section of the daily file. Those items will be re-pulled by the tools on the new day if they are still relevant.
