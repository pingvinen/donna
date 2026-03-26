---
created: 2026-03-21T19:41:11.276Z
title: "Prioritized now view — distill daily file to focus items"
area: general
source: https://github.com/pingvinen/donna/issues/16
files: []
---

## Problem

Daily files grow large quickly — dozens of Jira tickets, PRs, mail follow-ups, recurring tasks, and tool items. It's overwhelming to scan 100+ lines and figure out what to actually focus on right now. The daily file is a great **record** of everything, but it's a poor **action plan**.

## Solution

Add a new skill (e.g. `/donna:focus` or `/donna:now`) that reads today's daily file and produces a short, prioritized summary of the most burning items to deal with **right now**.

### Prioritization signals

- **Urgency keywords** in task text ("due today", "due tomorrow", "blocking", "urgent")
- **Calendar proximity** — meetings coming up in the next few hours
- **Unread mail** from real people (not automated notifications)
- **Jira status** — "In Progress" or "Waiting for customer" trump Backlog items
- **PR review requests** — someone is blocked waiting for your review
- **Recency** — newly appeared items (first time in today's file)
- **User-marked priority** — manually reordered or tagged items

### Output options

1. A new `## Focus` section at the top of the daily file
2. Ephemeral terminal output (not persisted)
3. A companion file (e.g. `daily/2026-03-17-focus.md`)

### Open questions

- Persistent (written to file) or ephemeral (terminal only)?
- Calendar integration for "what's next in 2 hours"?
- Configurable item count for the focus list?
- Support a "done with this, what's next?" flow?

### Not in scope

- Not a replacement for the daily file
- Not automatic sorting of the daily file
- Complementary to the existing "Add task priority and sorting" todo
