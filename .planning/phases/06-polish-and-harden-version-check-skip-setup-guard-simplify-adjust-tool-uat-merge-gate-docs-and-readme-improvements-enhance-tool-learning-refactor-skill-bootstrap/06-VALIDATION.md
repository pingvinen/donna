---
phase: 6
slug: polish-and-harden-version-check-skip-setup-guard-simplify-adjust-tool-uat-merge-gate-docs-and-readme-improvements-enhance-tool-learning-refactor-skill-bootstrap
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-27
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in) |
| **Config file** | none — test files discovered via `node --test 'test/*.test.cjs'` |
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
| 06-01-01 | 01 | 0 | D-10/D-11 | unit | `npm test` (donna-tools.test.cjs) | No — Wave 0 | ⬜ pending |
| 06-01-02 | 01 | 0 | D-04 | unit | `npm test` (installer.test.cjs) | Yes (add cases) | ⬜ pending |
| 06-02-01 | 02 | 1 | D-01/D-02/D-03 | unit | `npm test` | No — Wave 0 | ⬜ pending |
| 06-03-01 | 03 | 1 | D-05 | unit | `npm test` | No — Wave 0 | ⬜ pending |
| 06-04-01 | 04 | 1 | D-06 | integration | `gh workflow view` | N/A (CI) | ⬜ pending |
| 06-05-01 | 05 | 1 | D-07/D-08 | manual | `grep` checks | N/A (docs) | ⬜ pending |
| 06-06-01 | 06 | 2 | D-09 | unit | `npm test` | No — Wave 0 | ⬜ pending |
| 06-07-01 | 07 | 2 | D-12 | unit | `npm test` | No — Wave 0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/donna-tools.test.cjs` — stubs for donna-tools subcommands (init, commit, daily-path, resolve-secret)
- [ ] Additional cases in `test/installer.test.cjs` — covers D-04 skip-setup guard (suppress message when config exists)

*Existing test infrastructure covers installer and version utilities.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| README grouping is readable | D-07 | Subjective layout quality | Review rendered README.md in GitHub |
| UAT merge gate blocks PR | D-06 | Requires live GitHub PR | Open PR without `uat:pass` label, verify merge blocked |
| Version check hint displays | D-02 | Requires outdated version scenario | Manually set lower cached version, invoke a skill |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
