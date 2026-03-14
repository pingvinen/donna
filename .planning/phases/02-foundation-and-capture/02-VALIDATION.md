---
phase: 2
slug: foundation-and-capture
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` (v18+) |
| **Config file** | None — test script in package.json: `"test": "node --test 'test/*.test.cjs'"` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~2 seconds |

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
| 02-01-01 | 01 | 0 | SETUP-01 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 0 | SETUP-01 | unit | `npm test` (setup-workflow.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 0 | SETUP-02 | unit | `npm test` (setup-workflow.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 0 | TASK-01 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 0 | TASK-01 | unit | `npm test` (add-task-workflow.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 0 | TASK-02 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-07 | 01 | 0 | TASK-02 | unit | `npm test` (done-workflow.test.cjs) | ❌ W0 | ⬜ pending |
| 02-01-08 | 01 | 0 | STORE-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 02-01-09 | 01 | 0 | STORE-02 | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/stubs.test.cjs` — extend to cover add-task and done stubs
- [ ] `test/setup-workflow.test.cjs` — verify setup.md contains real logic, XDG config path reference, git init step
- [ ] `test/add-task-workflow.test.cjs` — verify add-task.md structure and required step references
- [ ] `test/done-workflow.test.cjs` — verify done.md structure and required step references

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Setup interactive flow works end-to-end | SETUP-01 | Requires Claude Code runtime + AskUserQuestion | Run `/donna:setup`, provide repo path, verify output |
| add-task writes to daily file and commits | TASK-01 | Requires Claude Code runtime + real git repo | Run `/donna:add-task buy milk`, check daily file |
| done marks task complete and commits | TASK-02 | Requires Claude Code runtime + AskUserQuestion | Run `/donna:done buy milk`, check daily file |
| Auto-push when configured | STORE-02 | Requires 1Password SSH + remote repo | Enable auto_push in config, run add-task, check remote |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
