---
created: 2026-03-16T13:27:20.221Z
title: Add adjust-tool skill for iterative tool configuration refinement
area: tooling
files:
  - skills/donna/add-tool.md
  - storage-template/donna/tools.md
---

## Problem

After initial tool setup via `donna:add-tool`, users inevitably want to refine what data gets fetched — different JQL filters, additional fields, new queries, or removing noisy output. Currently the only options are re-running `add-tool` (which is geared toward first-time discovery) or manually editing `tools.md` (which requires knowing the format).

Tool configurations are refined iteratively: the first setup is a guess, and after a week of daily briefs the user knows exactly what's missing or noisy. There's no dedicated skill for this refinement loop.

## Solution

Create a `donna:adjust-tool` skill that:

1. Lists configured tools and lets the user pick one
2. Shows current capability commands and a sample of their output
3. Asks targeted questions about what to change (filter, fields, add/remove commands)
4. Updates the tool's section in `tools.md` with the new configuration
5. Optionally runs a test pull to preview the new output

The key advantage over `add-tool` is context density — starting with full knowledge of the current config enables surgical questions rather than broad discovery.
