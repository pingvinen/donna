---
created: 2026-04-03T12:00:00.000Z
title: MacOS desktop widget for Donna (ref: #34)
area: tooling
github_issue: 34
files: []
---

## Problem

There is no visual, always-on-screen way to interact with Donna outside the terminal. A macOS widget or control center item could show basic stats, the focused task list, and provide buttons to trigger `begin-the-day` and `run-tools` — reducing the need to open a terminal for routine actions.

## Solution

Investigate macOS WidgetKit (for widgets) or Control Center extensions. The widget should display the focused list and basic stats from the current daily file, with buttons to invoke key Donna skills. Needs research into distribution (standalone app wrapper vs. CLI companion) and whether headless invocation is feasible given signing/auth constraints.
