---
status: complete
phase: 04-external-tool-enrichment
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: 2026-03-16T12:00:00Z
updated: 2026-03-16T12:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. donna:add-tool Interactive Flow
expected: Running `/donna:add-tool` starts the workflow. It reads config.md, checks for pending migrations, then either detects tools noted during set-role (batch mode) or asks for a tool name. After naming a tool, it verifies installation (`which <tool>`), tests auth, synthesizes capabilities from training data (for gh/jira/kubectl) or --help (unknown tools), lets you select which capabilities to keep, and writes to tools.md.
result: pass

### 2. tools.md Upsert Persistence
expected: After add-tool completes, `<storage_repo>/donna/tools.md` contains a `## <tool-name>` section with command, version, auth_test, learned date, and a `### Capabilities` subsection listing the selected capabilities. Re-running add-tool for the same tool replaces only that tool's section, preserving other tools.
result: pass

### 3. donna:relearn-tools Version Detection
expected: Running `/donna:relearn-tools` reads tools.md, checks each tool's installed version against the stored version. If versions match, it reports "no changes". If a version differs, it re-learns capabilities for that tool and updates tools.md with the new version and capabilities.
result: pass

### 4. donna:refresh-tools Daily Data Pull
expected: Running `/donna:refresh-tools` reads tools.md capabilities, runs each capability command (with 10s timeout), pulls fresh data, and smart-merges results into today's daily file. Smart merge rules: user-checked items win, open items kept, closed/removed items resolved, new items added. A single slow/failing tool warns but doesn't block others.
result: pass

### 5. begin-the-day Tool Data Integration
expected: Running `/donna:begin-the-day` now includes a pull-tool-data step (after recurring tasks, before reading existing daily file). If tools.md exists with capabilities, tool data appears in the daily brief under "From Tools". If tools.md is absent, begin-the-day works exactly as before with no errors.
result: pass

### 6. done.md Tool Tag Handling
expected: When marking a task as done that has a `[tool-name](url)` suffix (e.g. `- [ ] Fix bug #123 [gh](https://...)`), the fuzzy matching strips the tool tag for matching purposes but preserves it on the completed line for provenance.
result: pass

### 7. Installer Lists 8 Skills
expected: Running the installer (fresh install or upgrade) shows a success message listing all 8 skills: setup, add-task, done, set-role, begin-the-day, add-tool, relearn-tools, refresh-tools.
result: pass

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0

## Gaps

- truth: "Tool warnings (e.g. jira not installed) should be persisted in the daily file, not just printed"
  status: enhancement
  reason: "User reported: warning about jira not installed only shows in begin-the-day output but not written to daily file — loses historical record of why tool data is missing"
  severity: minor
  test: 5

- truth: "tools.md should capture per-tool scope/context (e.g. which GitHub orgs to pull from, which Jira projects)"
  status: enhancement
  reason: "User reported: need to include information about which github orgs to make tasks from, and similar scoping for other tools"
  severity: minor
  test: 2

- truth: "Tool task links should use descriptive labels like [repo#123](url) instead of [gh](url)"
  status: enhancement
  reason: "User reported: [gh](url) collides with markdown link syntax — gh becomes the link text instead of a meaningful identifier"
  severity: minor
  test: 4

- truth: "refresh-tools should be renamed to clearly indicate it runs tools and pulls data"
  status: enhancement
  reason: "User reported: refresh-tools sounds too similar to relearn-tools — name should make it clear this one actually executes the tools"
  severity: minor
  test: 7
