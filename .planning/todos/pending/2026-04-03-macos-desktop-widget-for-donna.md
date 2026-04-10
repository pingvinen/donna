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

A **macOS menu bar app** is the best fit — always visible, lightweight, and can use its icon to nudge the user (e.g. dot/color change when data is stale).

### Approach: Menu Bar App

- **Tech stack:** SwiftUI `MenuBarExtra` (macOS 13+) gives native menu bar presence with minimal code. Alternatives: Rumps (Python), Electron tray — but Swift gives best native feel and icon control.
- **Data source:** Reads the daily markdown file directly from the storage repo. Focus list, task counts, and file timestamps are all available without an API.
- **Staleness signal:** Compare daily file date or `mtime` against current time. If no file for today or last `run-tools` was hours ago, change the icon appearance to signal "hey, run an update."
- **Triggering skills:** Opens a terminal session to run skills (same constraint as #23 — headless invocation blocked by SSH signing/auth). Could use `open -a Terminal "donna run-tools"` or iTerm2/Warp integration.
- **Distribution:** Separate repo, distributed as `.dmg` or Homebrew cask. Not part of the npm package.

### Alternatives Considered

- **WidgetKit:** Requires a full native app bundle to host the widget. Too heavyweight for what's needed.
- **Raycast extension:** React-based, low barrier, but not "always visible" — still requires invoking Raycast.
- **Übersicht:** Desktop widgets via JS/HTML/CSS. Niche audience, no icon badge capability.
- **Terminal dashboard (`donna watch`):** Ships via npm but too "out of the way" — user wants something that's right there without opening a terminal.
