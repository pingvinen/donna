---
created: 2026-03-16T13:32:00.000Z
title: Add task priority and sorting configuration for daily briefs
area: general
files:
  - storage-template/donna/tools.md
  - skills/donna/begin-the-day.md
---

## Problem

All tasks in the daily brief are presented equally, but in practice users have strong opinions about relative importance. A Jira ticket from a critical project should appear above a GitHub notification from a low-priority repo. Currently there's no way to express that some tools, repos, or projects matter more than others, so the user has to mentally re-sort every morning.

## Solution

Add a priority/sorting configuration that lets users influence task ordering in the daily brief. Possible approaches:

- **Tool-level priority**: rank entire tools against each other (e.g., Jira > GitHub > Slack)
- **Source-level priority**: within a tool, rank specific sources (e.g., `pingvinen/donna` repo is high priority, `pingvinen/dotfiles` is low)
- **Project-level priority**: Jira project "PLATFORM" is critical, "BACKLOG" is low

Configuration could live in `tools.md` as a priority field per tool/source, or as a separate sorting config. The daily brief's task assembly step would then sort by priority tier before presenting.

Consider whether this is better handled by `donna:adjust-tool` (per-tool config) or a dedicated sorting config that spans all tools.
