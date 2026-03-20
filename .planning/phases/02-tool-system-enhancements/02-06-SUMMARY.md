---
phase: 02-tool-system-enhancements
plan: "06"
status: complete
started: 2026-03-20
completed: 2026-03-20
gap_closure: true
---

## Summary

Closed two remaining UAT gaps: (1) relearn-tools now introspects GraphQL APIs via `__schema` query to detect schema changes instead of blanket-skipping all non-CLI tools; (2) adjust-tool detects capability format mismatches when type is changed and offers repair options (re-enter, clear, or keep as-is).

## Self-Check: PASSED

- [x] relearn-tools contains GraphQL introspection query with `__schema`
- [x] relearn-tools still skips REST and MCP tools (not applicable)
- [x] GraphQL tools with no secret are gracefully skipped
- [x] GraphQL tools with failed introspection are gracefully skipped
- [x] New `relearn-graphql` step added between report-unchanged and relearn-changed
- [x] adjust-tool detects capability format mismatches on type change
- [x] adjust-tool offers 3 repair options (re-enter, clear, keep)
- [x] adjust-tool handles structural field changes between types
- [x] `npm run lint:fix` passes

## Key Files

### Modified
- `workflows/relearn-tools.md` — GraphQL schema introspection in check-versions, new relearn-graphql step
- `workflows/adjust-tool.md` — capability format mismatch detection and repair in type change handler

## Deviations

None.

## Commit Log

- `1ae3530` — feat(02): GraphQL introspection in relearn-tools + format repair in adjust-tool
