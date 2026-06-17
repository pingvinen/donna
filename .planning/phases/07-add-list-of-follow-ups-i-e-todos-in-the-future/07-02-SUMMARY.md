---
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
plan: "02"
subsystem: begin-the-day workflow
tags: [follow-up, surfacing, dedup, daily-brief, overdue]
requires: []
provides: [check-follow-ups-step, follow-up-dedup, follow-up-commit, follow-up-brief]
affects: [workflows/begin-the-day.md]
tech-stack:
  added: []
  patterns: [line-oriented-parsing, dedup-normalization, conditional-git-commit]
key-files:
  created: []
  modified: [workflows/begin-the-day.md]
decisions: []
metrics:
  duration: ~2m
  completed_date: 2026-06-17
status: complete
---

# Phase 07 Plan 02: Integrate Follow-up Surfacing into Begin-the-Day Summary

Integrated follow-up surfacing into the begin-the-day workflow: check-follow-ups step reads `donna/follow-ups.md`, surfaces due and past-due items into the daily Tasks section, annotates overdue items with `(overdue N days)`, removes surfaced lines from the standing file, feeds into dedup at the correct priority position, conditionally includes follow-ups.md in git commits, and prints surfaced follow-ups in the daily brief.

## Tasks Completed

| # | Task | Status | Commit | Files |
|---|------|--------|--------|-------|
| 1 | Add check-follow-ups step to begin-the-day | ✓ | `b1c7515` | `workflows/begin-the-day.md` (+29) |
| 2 | Wire follow-ups into dedup, commit, and print-brief | ✓ | `5cd164f` | `workflows/begin-the-day.md` (+22/-5) |

## Implementation Details

### check-follow-ups step (Task 1)
- Inserted between `check-recurring` and `pull-tool-data` in `workflows/begin-the-day.md`
- Reads `donna/follow-ups.md` via Read tool; gracefully handles missing file (empty list, continue)
- Parses entries matching `- [ ] <description> | due: YYYY-MM-DD`
- Filters by `due <= today`, annotates past-due items with `(overdue N days)` using macOS `date -j` arithmetic
- Removes surfaced lines from follow-ups.md (not checked off, not left with marker — per D-03)
- Sets `<follow_ups_modified>` flag for downstream conditional git commit
- Invalid date strings caught by `date -j`; entry skipped (not surfaced, not removed) — per threat model T-07-04
- No glob or ls — reads only the specific named file

### Dedup, write, commit, print-brief (Task 2)

**deduplicate step:**
- Follow-up tasks inserted between recurring_tasks (step 3) and tool_tasks (step 5) — per RESEARCH.md pitfall 3
- Normalization updated to strip `(overdue N days)` suffix so overdue follow-ups deduplicate against manually-added tasks

**write-daily-file step:**
- Follow-up tasks placed in `## Tasks` section after recurring tasks and before tool tasks
- Task ordering description updated: existing → carried → recurring → follow-up

**git-commit step:**
- Conditional: if `<follow_ups_modified>` is `true`, commits both `daily_folder/<today>.md` and `donna/follow-ups.md`
- Otherwise commits only the daily file as before (per D-07)

**print-brief step:**
- New `## Follow-ups` section inserted between `## Due Today` and `## From Tools`
- Omitted when no follow-up tasks were surfaced
- Empty-state prose updated to include follow-up tasks

## Deviations from Plan

None — plan executed exactly as written.

## Verification

All automated checks passed:
- `grep -q 'step name="check-follow-ups"' && grep -q "donna/follow-ups.md" && grep -q 'overdue'` — ✓
- `grep -q "follow_up_tasks" && grep -q "overdue" && grep -q "follow-ups.md"` — ✓
- Step ordering: check-follow-ups at line 97, between check-recurring (76) and pull-tool-data (126) — ✓
- `npm run lint:fix` — ✓ (no fixes applied)

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes beyond what was specified in the plan's `<threat_model>`.

## Self-Check: PASSED

- `workflows/begin-the-day.md` — exists and contains all required patterns
- Commit `b1c7515` — exists in git log
- Commit `5cd164f` — exists in git log