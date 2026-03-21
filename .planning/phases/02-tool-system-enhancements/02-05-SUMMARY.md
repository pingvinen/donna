---
phase: 02-tool-system-enhancements
plan: "05"
status: complete
started: 2026-03-20
completed: 2026-03-20
gap_closure: true
---

## Summary

Fixed two UAT gaps: (1) replaced blind `type: cli` backfill with heuristic type detection that correctly identifies MCP, REST, and GraphQL tools; (2) removed inline `(e.g., ...)` examples from AskUserQuestion prompts that Claude Code rendered as picker menu options.

## Self-Check: PASSED

- [x] All 5 workflow files have identical heuristic backfill logic
- [x] MCP tools detected by `mcp:` prefix in command field
- [x] REST/GraphQL tools detected by `base_url` field presence
- [x] CLI remains the default only when no non-CLI indicators found
- [x] No AskUserQuestion prompt contains `(e.g., ...)` for URL, auth header, or secret key
- [x] `npm run lint:fix` passes

## Key Files

### Modified
- `workflows/add-tool.md` — heuristic backfill + clean URL/auth/secret prompts
- `workflows/run-tools.md` — heuristic backfill
- `workflows/begin-the-day.md` — heuristic backfill
- `workflows/relearn-tools.md` — heuristic backfill
- `workflows/adjust-tool.md` — heuristic backfill

## Deviations

None.

## Commit Log

- `44c6d16` — fix(02): smart backfill type detection + clean URL prompts
