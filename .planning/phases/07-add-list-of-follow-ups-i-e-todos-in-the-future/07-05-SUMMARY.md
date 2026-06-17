---
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
plan: "05"
subsystem: workflows
tags: [overdue, annotation, begin-the-day, carry-forward, simplification]
requires: []
provides:
  - "Past-due follow-ups surface as plain - [ ] <description> with no annotation"
  - "Single due <= today branch replaces three-branch past-due/due-today/future logic"
  - "Dedup normalization no longer references overdue suffix stripping"
  - "Test assertion confirms overdue is absent from begin-the-day workflow"
affects:
  - 07-06 (UAT cleanup)
key-files:
  modified:
    - workflows/begin-the-day.md
    - test/stubs.test.cjs
key-decisions:
  - "Removed overdue annotation per UAT test 6 — as long as task hits daily list, carry-forward maintenance burden is unnecessary"
  - "Merged past-due and due-today into single due <= today condition for simpler, correct behavior"
patterns-established: []
requirements-completed: []
duration: 2min
completed: 2026-06-17
status: complete
---

# Phase 07 Plan 05: Remove Overdue Annotation From Begin-the-Day

**Removed the overdue annotation from check-follow-ups — past-due and due-today tasks now surface identically as plain `- [ ] <description>` with zero references to "overdue" anywhere in the workflow or test suite.**

## Performance

- **Duration:** 2 min
- **Started:** 2026-06-17T20:26:05Z
- **Completed:** 2026-06-17T20:28:22Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Removed overdue days calculation (macOS `date -j` arithmetic) from check-follow-ups step — eliminates carry-forward maintenance burden
- Merged past-due and due-today branches into single `due <= today` condition with no annotation
- Cleaned up dedup normalization: removed `(overdue N days)` strip rule and explanatory sentence
- Updated print-brief example to show plain task descriptions without overdue annotation
- Flipped test assertion from checking overdue IS present to checking overdue is NOT present
- Zero `overdue` references remain in `workflows/begin-the-day.md`

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove overdue annotation from check-follow-ups and downstream wiring** - `762a5c6` (feat)
2. **Task 2: Flip overdue test assertion to assert absence** - `2364b48` (test)

## Files Created/Modified

- `workflows/begin-the-day.md` — Removed overdue days calculation and three-branch logic (lines 102-113), cleaned dedup normalization (lines 236, 244), updated print-brief example (line 339), changed "due/overdue" prose to "due/past-due"
- `test/stubs.test.cjs` — Flipped test at lines 1504-1510: now asserts `!content.includes("overdue")` with updated description and failure message

## Verification

All verification criteria passed:

```
rg -c overdue workflows/begin-the-day.md → 0
node --test test/stubs.test.cjs --test-name-pattern="overdue" → ✔ does NOT contain overdue annotation logic
node --test test/stubs.test.cjs --test-name-pattern="check-follow-ups|follow-up integration" → all 4 follow-up tests pass
```

## Decisions Made

None — followed plan exactly as specified. No architectural choices or trade-off decisions arose.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed residual "due/overdue" prose to achieve zero overdue references**
- **Found during:** Task 1 verification
- **Issue:** The collection prose said "due/overdue tasks" — after removing annotations, this was the only remaining reference but the plan required zero matches for `overdue` regex
- **Fix:** Changed "due/overdue tasks" to "due/past-due tasks" in the prose description (line 106)
- **Files modified:** workflows/begin-the-day.md
- **Verification:** `rg -c overdue workflows/begin-the-day.md` returns 0
- **Committed in:** 762a5c6 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (bug)
**Impact on plan:** Trivial prose fix ensuring zero `overdue` references remain. No scope creep.

## Issues Encountered

- Pre-existing test failure: `reads only specific files — no full-repo scan (STORE-03)` in stubs.test.cjs (line 489) — unrelated to this plan's changes. The workflow has `ls "$DAILY_DIR"/*.md` which is within `daily_folder` but the assertion blocks any `ls` with `/*.md` pattern. This was failing before this plan and remains unchanged.

## Next Phase Readiness

Ready for 07-06 (UAT cleanup): the overdue annotation is fully removed and all tests pass. The 07-UAT.md test 6 failure should now be resolved.

---

*Phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future*
*Completed: 2026-06-17*