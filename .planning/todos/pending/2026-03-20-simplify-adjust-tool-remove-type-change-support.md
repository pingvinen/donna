---
created: 2026-03-20T21:52:35.430Z
title: Simplify adjust-tool — remove type change support
area: tooling
files:
  - workflows/adjust-tool.md
---

## Problem

adjust-tool currently supports changing a tool's type (e.g., CLI to GraphQL) with capability format repair offering 3 options. This creates 12 possible type migration paths, each with its own edge cases. The complexity isn't justified — changing a tool's fundamental type is rare and the repair logic is fragile.

## Solution

Remove type change support from adjust-tool. When a user attempts to change the type, detect the mismatch and inform them to drop the tool and re-add it via `/donna:add-tool`. This eliminates the capability format repair code entirely while still guiding the user to the right outcome.
