---
status: complete
phase: 03-prioritized-now-view-distill-daily-file-to-focus-items
source: [03-01-SUMMARY.md, 03-02-SUMMARY.md]
started: 2026-03-21T21:00:00Z
updated: 2026-03-21T21:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Invoke donna:focus skill
expected: Running `/donna:focus` in Claude Code reads today's daily file and produces output. No arguments needed, no prompts asked — just runs and shows results.
result: pass

### 2. Focus list written to daily/focus.md
expected: After running `/donna:focus`, a file `daily/focus.md` exists in your storage repo. It contains YAML frontmatter with `date` and `generated` fields, followed by a numbered list of prioritized items.
result: pass

### 3. Focus list printed to terminal
expected: The focus list is printed to the terminal with a Donna banner, numbered items with reason tags (e.g. "due today", "carried 5 times"), and a footer showing how many other items are in today's file.
result: pass

### 4. Only open tasks included
expected: The focus list only includes items from `- [ ]` lines in the daily file. Completed tasks (`- [x]`) and other content are excluded.
result: pass

### 5. Dynamic item count
expected: The focus list shows between 3-8 items depending on urgency. On a quiet day fewer items, on a busy day more. The footer shows "N other items in today's file".
result: pass

### 6. Tool enrichment queries relevant tools
expected: If the daily file has items tagged with tool prefixes like `(gh)` or `(jira)`, the skill re-queries those tools for richer context (PR review status, Jira status, etc.). Items from tools not in the daily file are not queried.
result: skipped
reason: User unsure how to test tool enrichment in isolation

### 7. Graceful fallback on tool failure
expected: If a tool query fails (e.g. network error, bad credentials), the skill still produces a focus list using text-only signals for that tool's items. No crash or empty output.
result: pass

### 8. Obsidian compatibility
expected: Opening `daily/focus.md` in Obsidian renders cleanly — YAML frontmatter is hidden, numbered list displays properly, no rendering artifacts.
result: pass

## Summary

total: 8
passed: 7
issues: 0
pending: 0
skipped: 1
skipped: 0
blocked: 0

## Gaps

[none yet]
