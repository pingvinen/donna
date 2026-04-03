---
status: complete
phase: 06-polish-and-harden-version-check-skip-setup-guard-simplify-adjust-tool-uat-merge-gate-docs-and-readme-improvements-enhance-tool-learning-refactor-skill-bootstrap
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md, 06-04-SUMMARY.md, 06-05-SUMMARY.md]
started: 2026-04-03T12:05:00Z
updated: 2026-04-03T12:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. UAT merge gate checks actual state
expected: The UAT gate workflow should verify UAT completion by checking GSD state files (e.g., *-UAT.md status), not just a label.
result: issue
reported: "NO! Check the actual GSD state files etc. to see if UAT has been completed."
severity: major

### 2. donna-tools init on configured system
expected: Run `node src/donna-tools.cjs init` on your configured machine. Returns JSON with your real storage_repo path, daily_folder, auto_push setting. No errors.
result: pass

### 3. Installer upgrade preserves config
expected: Run `npm install -g @pingvinen/donna-assistant` (or link). No "Run /donna:setup" prompt appears since you're already configured. donna-tools.cjs is copied to ~/.donna/.
result: pass

### 4. README readability
expected: Open README.md. Skills are grouped into 4 logical categories. The "Why not automate tool pulls?" section makes sense and answers the question clearly.
result: issue
reported: "Setup and configuration has add-tool and adjust-tool, while Tool management has run-tools and relearn-tools. The tool stuff should be in the Tool management section — tools are not actually required."
severity: minor

### 5. Adjust-tool workflow feel
expected: Review `workflows/adjust-tool.md` — type is visible as read-only context but NOT an editable option. Menu has 4 choices.
result: issue
reported: "donna-tools.cjs crashes with Cannot find module './version.cjs' when run from ~/.donna/ — installer copies donna-tools.cjs but not its dependencies (version.cjs, migrator.cjs, changelog.cjs)"
severity: blocker

### 6. Workflow bootstrap consistency
expected: Spot-check 2-3 workflows (e.g., begin-the-day, add-task, run-tools). Each starts with donna-tools.cjs init and shows version update hint when available.
result: issue
reported: "Also broken — same root cause as Test 5, all workflows fail because donna-tools.cjs dependencies are missing in ~/.donna/"
severity: blocker

### 7. Cascading tool learning UX
expected: Review the add-tool cascade in `workflows/add-tool.md`. The 4-stage fallback (local docs -> CLI help -> web docs -> source code opt-in) makes sense. Source code stage properly asks for user consent.
result: issue
reported: "The cascade reads too little context — 200 lines from a readme/docs or 500 lines from source entry point. It should follow links/imports from the entry point to get to the juicy parts, not just read a fixed chunk."
severity: minor

## Summary

total: 7
passed: 2
issues: 5
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "UAT gate should verify actual UAT completion via GSD state files, not just check for a label"
  status: failed
  reason: "User reported: NO! Check the actual GSD state files etc. to see if UAT has been completed."
  severity: major
  test: 1
  root_cause: ""
  artifacts:
    - path: ".github/workflows/uat-gate.yml"
      issue: "Only checks for uat:pass label, does not inspect GSD state files"
  missing:
    - "Gate should read *-UAT.md or *-HUMAN-UAT.md files and verify status is complete"
  debug_session: ""

- truth: "README skills should group tool-related commands (add-tool, adjust-tool, run-tools, relearn-tools) together under Tool management"
  status: failed
  reason: "User reported: add-tool and adjust-tool are in Setup and configuration, but should be in Tool management since tools are optional"
  severity: minor
  test: 4
  root_cause: ""
  artifacts:
    - path: "README.md"
      issue: "add-tool and adjust-tool miscategorized under Setup and configuration"
  missing:
    - "Move add-tool and adjust-tool from Setup and configuration to Tool management"
  debug_session: ""

- truth: "donna-tools.cjs must work when installed to ~/.donna/ — all required modules must be co-located"
  status: failed
  reason: "User reported: donna-tools.cjs crashes with Cannot find module './version.cjs' — installer copies donna-tools.cjs but not version.cjs, migrator.cjs, changelog.cjs"
  severity: blocker
  test: 5
  root_cause: ""
  artifacts:
    - path: "src/installer.cjs"
      issue: "Only copies donna-tools.cjs, not its require'd dependencies"
    - path: "src/donna-tools.cjs"
      issue: "Uses relative require('./version.cjs') etc. which fails outside src/"
  missing:
    - "Installer must also copy version.cjs, migrator.cjs, changelog.cjs to ~/.donna/"
    - "Or bundle donna-tools.cjs as a single self-contained file"
  debug_session: ""

- truth: "All 9 refactored workflows must bootstrap successfully in a real install"
  status: failed
  reason: "User reported: Also broken — same root cause as Test 5"
  severity: blocker
  test: 6
  root_cause: "Same as Test 5 — donna-tools.cjs dependencies missing in ~/.donna/"
  artifacts: []
  missing: []
  debug_session: ""

- truth: "Cascading tool learning should follow links/imports from entry points rather than reading fixed-size chunks"
  status: failed
  reason: "User reported: 200 lines from readme/docs or 500 lines from source is too shallow — should follow links/imports to discover capabilities"
  severity: minor
  test: 7
  root_cause: ""
  artifacts:
    - path: "workflows/add-tool.md"
      issue: "Fixed-line limits (200 docs, 500 source) too shallow for real discovery"
  missing:
    - "Read entry point then follow references/imports to relevant sections"
  debug_session: ""
