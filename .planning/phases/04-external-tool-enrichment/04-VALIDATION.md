---
phase: 4
slug: external-tool-enrichment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) |
| **Config file** | none — invoked via `node --test 'test/*.test.cjs'` |
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
| 04-01-01 | 01 | 0 | TOOL-01 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 0 | TOOL-01 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 0 | TOOL-02 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 0 | TOOL-03 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-05 | 01 | 0 | TOOL-03 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-06 | 01 | 0 | DAILY-03 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-07 | 01 | 0 | DAILY-03 | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-08 | 01 | 0 | cross-cut | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |
| 04-01-09 | 01 | 0 | cross-cut | unit | `npm test` (stubs.test.cjs) | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/stubs.test.cjs` — new describe blocks for add-tool stub and workflow
- [ ] `test/stubs.test.cjs` — new describe blocks for relearn-tools stub and workflow
- [ ] `test/stubs.test.cjs` — new describe blocks for refresh-tools stub and workflow
- [ ] `test/stubs.test.cjs` — extended assertions in begin-the-day describe for pull-tool-data step
- [ ] `test/stubs.test.cjs` — extended assertions in installer describe for new skill names
- [ ] `test/stubs.test.cjs` — new assertion for done.md `[tool](url)` suffix stripping

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| add-tool interactive AskUserQuestion flow works end-to-end | TOOL-01 | Requires live Claude session with user interaction | Run `/donna:add-tool`, declare gh, verify tools.md created |
| relearn-tools skips unchanged versions | TOOL-03 | Requires tool installed with known version | Run `/donna:relearn-tools` twice, verify second run skips |
| begin-the-day surfaces tool data in brief | DAILY-03 | Requires external tool auth and live CLI | Configure gh via add-tool, run `/donna:begin-the-day`, verify "From Tools" section |
| begin-the-day works without tools configured | DAILY-03 | Requires clean state without tools.md | Run `/donna:begin-the-day` without tools.md, verify no errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
