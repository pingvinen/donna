---
created: 2026-03-16T01:14:39.065Z
title: Interactive help skill with troubleshooting and issue reporting
area: general
files: []
---

## Problem

Users have no built-in way to get help when they're stuck. There's no guidance system for discovering commands, troubleshooting problems, or reporting issues. When something goes wrong, users have to manually navigate to GitHub, figure out the right repo, and write up the issue themselves.

## Solution

Create a `donna:help` skill that operates interactively:

1. **Discover commands** — list available slash commands with brief descriptions
2. **Troubleshoot** — attempt to diagnose and solve the user's problem through conversation, checking config, logs, and known issues
3. **Report issues** — when the problem can't be solved, help the user report it to `pingvinen/donna` via one of:
   - Using `gh issue create` if they have GitHub CLI installed
   - Generating a suggested issue title and body they can copy
   - Opening their browser to the new issue page (`open https://github.com/pingvinen/donna/issues/new`)

The skill should gather enough context (error messages, config state, steps to reproduce) to produce a useful issue report without burdening the user.
