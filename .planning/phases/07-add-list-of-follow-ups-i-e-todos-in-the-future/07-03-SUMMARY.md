---
phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future
plan: "03"
subsystem: installer, documentation, testing
status: complete
tags: [follow-up, installer, README, tests]
requires:
  - 07-01
  - 07-02
provides:
  - follow-up skill registered in installer success message
  - /donna:follow-up documented in README commands table
  - follow-ups.md documented in README directory tree
  - test coverage for follow-up stub, workflow, installer integration, and begin-the-day integration
affects:
  - installer success message
  - README commands table
  - README directory tree
  - test suite (stubs.test.cjs)
tech-stack:
  added: []
  patterns:
    - Installer skill registration (success message string)
    - README commands table row addition
    - Node.js built-in test runner (describe/it blocks)
key-files:
  created: []
  modified:
    - src/installer.cjs
    - README.md
    - test/stubs.test.cjs
decisions:
  - D-08/Pitfall 4: Installer success message, README, and tests updated to include follow-up skill
metrics:
  duration_seconds: 140
  completed_date: "2026-06-17T17:58:33+02:00"
---

# Phase 07 Plan 03: Register follow-up and add test coverage Summary

Registered the follow-up skill in the installer success message, documented it in README.md, and added comprehensive test coverage for the stub, workflow, installer registration, and begin-the-day integration.

## Implementation

### Task 1: Register follow-up in installer and README
- **src/installer.cjs:** Added "follow-up" to the comma-separated skills list in the `output.success` call (after "focus")
- **README.md:** Added `/donna:follow-up` row to Daily workflow commands table between `/donna:done` and `/donna:focus`
- **README.md:** Added `follow-ups.md` to directory tree between `recurring.md` and `tools.md`

### Task 2: Add test coverage for follow-up skill
- **Path variables:** Added `followUpStubPath` and `followUpWorkflowPath` after the focus path declarations
- **Stub tests (8):** exists, name: "donna:follow-up", description field, Read/Write/Bash/AskUserQuestion in allowed-tools, workflow ref
- **Workflow tests (4):** exists, donna-tools.cjs init, references donna/follow-ups.md, git commit step
- **Installer cross-cutting (1):** success message includes "follow-up" — added to existing `cross-cutting: installer skill list` describe block
- **Begin-the-day integration (4):** check-follow-ups step exists, references donna/follow-ups.md, overdue annotation logic, git-commit references follow-ups.md

## Verification

- `grep -q "follow-up" src/installer.cjs` — PASSED
- `grep -q "/donna:follow-up" README.md` — PASSED
- `grep -q "follow-ups.md" README.md` — PASSED
- `node --test test/stubs.test.cjs` — 198/199 passing (1 pre-existing STORE-03 failure unrelated to this plan)
- All 16 new test assertions pass

## Deviations from Plan

None — plan executed exactly as written. The 1 test failure (`reads only specific files — no full-repo scan (STORE-03)`) is a pre-existing issue in begin-the-day.md workflow unrelated to follow-up changes. Verified by stashing changes and running tests on clean branch — failure present before any modifications.

## Deferred Items

- STORE-03 test failure (`test/stubs.test.cjs:489`): begin-the-day workflow contains `find <storage_repo>` pattern that triggers the assertion. Pre-existing, not caused by this plan. Logged to `deferred-items.md` for a future fix.

## Threat Flags

None — no new trust boundaries. Installer string and README are static text. Test assertions verify file existence and content patterns only.

## Self-Check: PASSED

All modified files exist and commits are present:
- `2b94aaf` — feat(07-03): register follow-up skill in installer and README
- `cf8e8c5` — test(07-03): add follow-up skill test coverage

## Known Stubs

None — all data wired from existing stub/workflow files created in plans 07-01 and 07-02.