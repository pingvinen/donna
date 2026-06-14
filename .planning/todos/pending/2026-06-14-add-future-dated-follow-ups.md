---
created: 2026-06-14T12:00:00.000Z
title: Add list of future-dated follow-ups / scheduled reminders (ref: #37)
area: general
github_issue: 37
files: []
---

## Problem

Following up on things in the future is a real weakness — e.g. suggesting something to the company and needing to circle back weeks or months later. Donna currently has no way to schedule a task for a future date. Recurring tasks cover repeating cadence, but there is no concept of a one-off future reminder.

## Solution

Add support for future-dated follow-ups. Users should be able to tell Donna to remind them of X on a specific date or after a relative interval (e.g. "in 2 months", "in 3 weeks"). When `begin-the-day` runs, surface any future todos whose due date is today or in the past so they land on the daily brief.

Open design questions:
- New file (e.g. `donna/follow-ups.md`) vs. refactoring `recurring.md` into a unified "recurring + future" file.
- Frontmatter shape (`due:` date field?) and how to differentiate one-off future todos from recurring ones.
- Whether to drop a stale follow-up after N days or keep surfacing it until marked done.
