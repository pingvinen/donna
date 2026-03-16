---
phase: 2
slug: tool-system-enhancements
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-16
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | node:test (built-in, v18+) |
| **Config file** | none — invoked directly |
| **Quick run command** | `node --test 'test/*.test.cjs'` |
| **Full suite command** | `node --test 'test/*.test.cjs'` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node --test 'test/*.test.cjs'`
- **After every plan wave:** Run `node --test 'test/*.test.cjs'`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | adjust-tool stub | unit | `node --test 'test/stubs.test.cjs'` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | adjust-tool workflow | unit | `node --test 'test/stubs.test.cjs'` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | installer mentions adjust-tool | unit | `node --test 'test/installer.test.cjs'` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | migration 003 exists | unit | `node --test 'test/migrator.test.cjs'` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | tools.md type field parse | unit | `node --test 'test/tools-parser.test.cjs'` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | secrets.md placeholder substitution | unit | `node --test 'test/tools-parser.test.cjs'` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `test/stubs.test.cjs` — add describe block for `donna:adjust-tool` stub assertions
- [ ] `test/installer.test.cjs` — add assertion that installer success message includes `adjust-tool`
- [ ] `test/migrator.test.cjs` — add assertion that migration 003 exists and exports `version`, `description`, `up`
- [ ] `test/tools-parser.test.cjs` — new file for tools.md type-aware parsing and secrets.md substitution logic

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Parallel tool data pull completes within 2min | parallelization | Workflow logic in markdown, not code | Run `donna:run-tools` with 2+ tools, verify parallel execution |
| API tool data pull with secret substitution | non-CLI tools | Requires real API credentials | Configure a REST API tool in tools.md, add secret, run refresh |
| MCP tool invocation | non-CLI tools | Requires MCP server running | Add MCP tool, verify `mcp:<server>/<tool>` capability invocation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
