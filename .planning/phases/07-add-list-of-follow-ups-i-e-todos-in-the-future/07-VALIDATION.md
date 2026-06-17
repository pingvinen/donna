---
phase: 07
slug: add-list-of-follow-ups-i-e-todos-in-the-future
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-06-17
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none — inline `describe`/`it` in `test/*.test.cjs` |
| **Quick run command** | `node --test test/stubs.test.cjs` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint:fix && node --test test/stubs.test.cjs`
- **After every plan wave:** Run `npm test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | — | — | D-01 | — | N/A | unit | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-02 | T-07-01 | Validate YYYY-MM-DD format; fallback to today if invalid | unit | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-03 | — | N/A | integration | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-04 | — | N/A | unit | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-05 | — | N/A | unit | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-06 | — | N/A | integration | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-07 | — | N/A | unit | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| TBD | — | — | D-08 | T-07-01 | All date-related tests pass | unit+integration | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/stubs.test.cjs` — new test blocks for `stubs/claude-code/donna/follow-up.md` stub + `workflows/follow-up.md` workflow
- [ ] `test/stubs.test.cjs` — cross-cutting tests for installer skill list update, begin-the-day check-follow-ups step, begin-the-day git-commit files
- [ ] No new test files needed — existing test infrastructure covers this pattern

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| begin-the-day surfaces follow-ups in terminal output | D-03 | Terminal output formatting is verified by human review during UAT | Run begin-the-day with due follow-up items; verify they appear under Tasks section, overdue items have `(overdue N days)` annotation |
| `/donna:follow-up` interactive mode | D-04 | Claude Code AskUserQuestion interaction is verified end-to-end during UAT | Run `/donna:follow-up` without arguments; verify Donna asks for task description and due date |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending