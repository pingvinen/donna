---
status: complete
phase: 06-polish-and-harden-version-check-skip-setup-guard-simplify-adjust-tool-uat-merge-gate-docs-and-readme-improvements-enhance-tool-learning-refactor-skill-bootstrap
source: [06-HUMAN-UAT.md gaps, commits 78eda1e, 42fc7ab, b3cd89d]
started: 2026-04-03T14:00:00Z
updated: 2026-04-03T14:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Installer copies all donna-tools dependencies
expected: Run `npm install -g @pingvinen/donna-assistant` (or `npm link`). Check `~/.donna/` — it should contain donna-tools.cjs AND its dependencies (version.cjs, migrator.cjs, changelog.cjs). Run `node ~/.donna/donna-tools.cjs init` — no "Cannot find module" errors.
result: pass

### 2. Workflows bootstrap after fresh install
expected: After install, run a workflow that uses donna-tools.cjs init (e.g., `/donna:add-task`). It should bootstrap successfully without module errors — confirming the blocker from Test 5/6 in the original UAT is fixed.
result: pass

### 3. UAT gate checks GSD state files
expected: Review `.github/workflows/uat-gate.yml`. The gate should find all UAT file types, use the latest per phase, and require both status: complete and issues: 0.
result: pass
note: Fixed in b7efaf4 — gate now checks issues: 0 and finds both HUMAN-UAT and RETEST-UAT files. Confirmed blocking PR in GitHub.

### 4. README tool grouping
expected: Open README.md. All tool commands (add-tool, adjust-tool, remove-tool, run-tools, relearn-tools) should be grouped together under "Tool management" — not split across categories.
result: pass

### 5. Cascading tool learning reads deeper
expected: Review `workflows/add-tool.md` cascade stages. The source code stage (Stage 4) should follow imports/links from the entry point to discover capabilities — not just read a fixed 500-line chunk.
result: pass

### 6. Adjust-tool blocks type change
expected: Review `workflows/adjust-tool.md`. Attempting to change a tool's type should be blocked with guidance to use remove-tool + re-add instead.
result: pass

### 7. Remove-tool skill works
expected: Review `workflows/remove-tool.md` and `stubs/claude-code/donna/remove-tool.md`. The skill should exist, have a proper stub, and the workflow should cleanly remove a tool entry from tools.md with confirmation.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none]
