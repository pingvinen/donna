---
phase: 3
slug: role-awareness-and-daily-rhythm
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | None — uses `npm test` script: `node --test 'test/*.test.cjs'` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | ROLE-01 | unit | `npm test -- --test-name-pattern "stub: stubs/claude-code/donna/set-role"` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | ROLE-01 | unit | `npm test -- --test-name-pattern "workflow: workflows/set-role"` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | ROLE-02 | unit | `npm test -- --test-name-pattern "set-role.*WebSearch"` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | ROLE-03 | unit | `npm test -- --test-name-pattern "set-role.*AskUserQuestion"` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | ROLE-04 | unit | `npm test -- --test-name-pattern "set-role.*role\.md"` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | DAILY-01 | unit | `npm test -- --test-name-pattern "stub.*begin-the-day"` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | DAILY-01 | unit | `npm test -- --test-name-pattern "begin-the-day.*carry"` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | DAILY-02 | unit | `npm test -- --test-name-pattern "begin-the-day.*recurring"` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | DAILY-04 | unit | `npm test -- --test-name-pattern "begin-the-day.*dedup"` | ❌ W0 | ⬜ pending |
| 03-02-05 | 02 | 1 | STORE-03 | unit | `npm test -- --test-name-pattern "targeted file reads"` | ❌ W0 | ⬜ pending |
| 03-cross-01 | 01 | 1 | (cross-cut) | unit | Extend `installer.test.cjs` | ✅ existing | ⬜ pending |
| 03-cross-02 | 02 | 1 | (cross-cut) | unit | Extend `stubs.test.cjs` | ✅ existing | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/set-role-workflow.test.cjs` — stubs for ROLE-01 through ROLE-04
- [ ] `test/begin-the-day-workflow.test.cjs` — stubs for DAILY-01, DAILY-02, DAILY-04, STORE-03
- [ ] Extend `test/installer.test.cjs` — verify new stubs are copied (set-role.md, begin-the-day.md)
- [ ] Extend `test/stubs.test.cjs` — verify done.md contains counter-strip logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WebSearch returns useful role research | ROLE-02 | Requires live API call | Run `/donna:set-role`, verify research output is relevant to stated role |
| AskUserQuestion approval flow works interactively | ROLE-03 | Requires human interaction | Run `/donna:set-role`, verify user can approve/reject/modify suggestions |
| Daily brief is concise (~40 lines) | DAILY-01 | Output length varies by data | Run `/donna:begin-the-day` with known test data, count output lines |

*All other behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
