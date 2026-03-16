---
phase: 1
slug: packaging-and-distribution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-14
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in test runner (`node:test`) + `node:assert` |
| **Config file** | none — Wave 0 creates test files |
| **Quick run command** | `node --test test/` |
| **Full suite command** | `node --test test/` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test test/`
- **After every plan wave:** Run `node --test test/`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 0 | DIST-01, DIST-04 | integration | `node --test test/installer.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 0 | DIST-02 | unit | `node --test test/version.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-03 | 01 | 0 | DIST-03 | unit | `node --test test/migrator.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-04 | 01 | 0 | DIST-05 | unit | `node --test test/package.test.cjs` | ❌ W0 | ⬜ pending |
| 01-01-05 | 01 | 0 | DIST-06 | unit | `node --test test/stubs.test.cjs` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | DIST-07 | unit | `node --test test/workflows.test.cjs` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 2 | DIST-08 | unit | `node --test test/determine-bump.test.cjs` | ❌ W0 | ⬜ pending |
| 01-03-03 | 03 | 2 | DIST-09 | unit | `node --test test/workflows.test.cjs` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/installer.test.cjs` — integration tests for DIST-01, DIST-04 (uses temp dirs)
- [ ] `test/version.test.cjs` — unit tests for DIST-02 (version file read/write)
- [ ] `test/migrator.test.cjs` — unit tests for DIST-03 (migration runner logic)
- [ ] `test/package.test.cjs` — unit tests for DIST-05 (validates package.json files field)
- [ ] `test/stubs.test.cjs` — unit tests for DIST-06 (stub format validation)
- [ ] `test/workflows.test.cjs` — unit tests for DIST-07, DIST-09 (workflow YAML validation)
- [ ] `test/determine-bump.test.cjs` — unit tests for DIST-08 (version bump determination)

*All tests operate on temp directories to avoid touching real `~/.donna/` or `~/.claude/`.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `npx @pingvinen/donna-assistant` runs on fresh machine | DIST-01 | Requires real npm registry + clean machine | 1. Publish to npm 2. Run npx on clean machine 3. Verify ~/.donna/ and ~/.claude/commands/donna/ exist |
| `/donna:setup` produces hello-world in Claude Code | DIST-06 | Requires running Claude Code | 1. Install donna 2. Open Claude Code 3. Run `/donna:setup` 4. Verify hello-world response |
| PR validation workflow runs on PR | DIST-07 | Requires real GitHub PR | 1. Open PR 2. Verify lint + build check runs |
| Release workflow creates GitHub release | DIST-08 | Requires manual workflow trigger | 1. Trigger release workflow 2. Verify release + changelog created |
| Deploy workflow publishes to npm | DIST-09 | Requires npm registry + OIDC | 1. Create GitHub release 2. Verify package published to npm |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
