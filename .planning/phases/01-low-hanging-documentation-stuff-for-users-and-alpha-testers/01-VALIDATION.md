---
phase: 1
slug: low-hanging-documentation-stuff-for-users-and-alpha-testers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` |
| **Config file** | none — test runner invoked directly |
| **Quick run command** | `node --test 'test/*.test.cjs'` |
| **Full suite command** | `node --test 'test/*.test.cjs'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test 'test/installer.test.cjs'`
- **After every plan wave:** Run `node --test 'test/*.test.cjs'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | CONTRIBUTING.md | smoke | `node --test 'test/package.test.cjs'` | ✅ | ⬜ pending |
| 1-02-01 | 02 | 1 | Changelog on upgrade | unit | `node --test 'test/installer.test.cjs'` | ✅ | ⬜ pending |
| 1-02-02 | 02 | 1 | No changelog on fresh install | unit | `node --test 'test/installer.test.cjs'` | ✅ | ⬜ pending |
| 1-02-03 | 02 | 1 | No changelog when up to date | unit | `node --test 'test/installer.test.cjs'` | ✅ | ⬜ pending |
| 1-03-01 | 03 | 1 | help skill stub deployed | unit | `node --test 'test/stubs.test.cjs'` | ✅ | ⬜ pending |
| 1-03-02 | 03 | 1 | help skill workflow deployed | unit | `node --test 'test/workflows.test.cjs'` | ✅ | ⬜ pending |
| 1-04-01 | 04 | 1 | contribute-idea stub deployed | unit | `node --test 'test/stubs.test.cjs'` | ✅ | ⬜ pending |
| 1-04-02 | 04 | 1 | contribute-idea workflow deployed | unit | `node --test 'test/workflows.test.cjs'` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Skill workflow tests are manual-only by nature (LLM-executed prompts, not unit-testable).

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/donna:help` interactive diagnostic flow | help skill | LLM workflow — requires conversational interaction | Run `/donna:help`, describe a problem, verify it inspects config and offers diagnostic steps |
| `/donna:contribute-idea` duplicate check + issue creation | contribute-idea skill | Requires `gh` CLI auth + GitHub API interaction | Run `/donna:contribute-idea`, submit a known existing idea, verify duplicate detection; submit new idea, verify issue created |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
