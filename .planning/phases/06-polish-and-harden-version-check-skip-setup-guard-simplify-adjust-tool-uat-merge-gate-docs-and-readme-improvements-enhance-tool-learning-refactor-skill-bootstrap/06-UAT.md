---
status: complete
phase: 06-polish-and-harden-version-check-skip-setup-guard-simplify-adjust-tool-uat-merge-gate-docs-and-readme-improvements-enhance-tool-learning-refactor-skill-bootstrap
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-04-03T12:00:00Z
updated: 2026-04-03T12:01:00Z
---

## Current Test

[testing complete]

## Tests

### 1. donna-tools init returns valid JSON
expected: Run `node src/donna-tools.cjs init`. Output is a single JSON object with fields: storage_repo, daily_folder, auto_push, update_available, migrations_applied, error. No error field value.
result: pass

### 2. donna-tools daily-path returns today's date path
expected: Run `node src/donna-tools.cjs daily-path`. Output is JSON with a `path` field ending in `daily/2026-04-03.md` pointing to your storage repo.
result: pass

### 3. donna-tools resolve-secret handles missing key gracefully
expected: Run `node src/donna-tools.cjs resolve-secret NONEXISTENT_KEY`. Output is JSON with `{"error":"key_not_found","key":"NONEXISTENT_KEY"}` — no crash, no stack trace.
result: pass

### 4. README skills grouped into 4 categories
expected: Open README.md. The skills/commands section is organized into 4 groups: Setup and configuration, Daily workflow, Tool management, Help and feedback. All 12 commands are listed.
result: pass

### 5. README "Why not automate tool pulls?" section
expected: README.md contains a section titled "Why not automate tool pulls?" explaining cost, context, and conflict reasons. Located before the "All commands" section.
result: pass

### 6. UAT merge gate workflow
expected: File `.github/workflows/uat-gate.yml` exists. It triggers on PRs to main and checks for the `uat:pass` label. PRs without the label are blocked from merging.
result: pass

### 7. Skip-setup guard for existing users
expected: The installer (`src/installer.cjs`) suppresses the "Run /donna:setup" message when `~/.config/donna/config.md` already contains `storage_repo:`. Existing users don't see the setup prompt on upgrade.
result: pass

### 8. Adjust-tool has 4 editable fields (no type change)
expected: Review `workflows/adjust-tool.md`. The edit menu offers 4 options (scope, capabilities, auth, command) — type is shown as read-only but is NOT editable.
result: pass

### 9. Workflows use donna-tools init bootstrap
expected: Spot-check any workflow (e.g., `workflows/begin-the-day.md`). It starts with a `<step name="init">` that calls `donna-tools.cjs init` — no more inline config reading or migration checking.
result: pass

### 10. Cascading tool learning for unknown CLI tools
expected: Review `workflows/add-tool.md`. The learn-capabilities step for unknown CLI tools has a 4-stage cascade: local docs (Stage 1), CLI --help (Stage 2), web docs if < 3 capabilities (Stage 3), source code with user opt-in (Stage 4).
result: pass

## Summary

total: 10
passed: 10
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

[none yet]
