---
phase: 4
slug: ingest-github-issues-into-gsd
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-26
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | jest 29.x |
| **Config file** | `jest.config.cjs` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | TBD | unit | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/ingest-issues.test.cjs` — test stubs for issue ingestion skill
- [ ] `test/post-release-comments.test.cjs` — test stubs for release-time closure script

*Existing test infrastructure (jest, test runner) covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Labels created on GitHub repo | D-06 | Requires live GitHub API | Run skill against test repo, verify labels exist |
| Comments posted on issues | D-07 | Requires live GitHub API | Run skill, check issue comments |
| Release workflow step runs | D-08 | Requires GitHub Actions trigger | Trigger release, verify issue comments and closures |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
