---
status: diagnosed
phase: 01-low-hanging-documentation-stuff-for-users-and-alpha-testers
source: 01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md
started: 2026-03-16T17:00:00Z
updated: 2026-03-16T17:10:00Z
---

## Current Test

[testing complete]

## Tests

### 1. CONTRIBUTING.md Developer Guide
expected: Open CONTRIBUTING.md at the repo root. It should contain sections for: prerequisites, local dev setup, project structure, running tests, adding a new skill, conventions, and submitting changes.
result: issue
reported: "It looks good, but it completely ignores GSD, which is kind of a core tool for this project. It should cover that this project makes heavy use of GSD and that we do not use milestones."
severity: major

### 2. README Skills Table Lists All Skills
expected: Open README.md. The "All commands" table should include rows for donna:help (conversational troubleshooting) and donna:contribute-idea (GitHub Issue submission), totalling 10 skills.
result: pass

### 3. Installer Success Message Includes New Skills
expected: Check src/installer.cjs success message. It should mention "help" and "contribute-idea" in the skill list shown to users after install/upgrade.
result: issue
reported: "Did not do what you said it should: upgrade output shows skill list but no 'What's new:' changelog section on upgrade from 0.4.0 → 0.5.0"
severity: major

### 4. donna:help Skill
expected: Run /donna:help in Claude Code. It should read your Donna config, inspect storage repo state, check installed stubs/workflows, and provide interactive troubleshooting guidance. It should be strictly read-only (no file writes or git commits).
result: pass

### 5. donna:contribute-idea Skill
expected: Run /donna:contribute-idea in Claude Code. It should check gh auth, ask you to describe your idea, search for duplicates in GitHub Issues and STATE.md todos, present any matches, then draft and create a GitHub Issue via gh issue create.
result: pass

### 6. Test Suite Passes
expected: Run `node --test 'test/*.test.cjs'` from the repo root. All 245+ tests should pass with 0 failures.
result: pass

## Summary

total: 6
passed: 4
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "CONTRIBUTING.md covers all aspects of contributing including GSD workflow and no-milestones approach"
  status: failed
  reason: "User reported: It looks good, but it completely ignores GSD, which is kind of a core tool for this project. It should cover that this project makes heavy use of GSD and that we do not use milestones."
  severity: major
  test: 1
  root_cause: "CONTRIBUTING.md has no mention of GSD workflow or backlog-driven development. Conventions section cherry-picks naming/git rules from CLAUDE.md but skips the entire Development Approach section (lines 13-16)."
  artifacts:
    - path: "CONTRIBUTING.md"
      issue: "Missing Development Workflow section explaining GSD phases and no-milestones approach"
  missing:
    - "Add a Development Workflow section explaining GSD phases and backlog-driven approach"
    - "Surface Development Approach conventions from CLAUDE.md (deployment first, real skills, no formal milestones)"
  debug_session: ".planning/debug/contributing-missing-gsd.md"

- truth: "Installer upgrade path shows 'What's new:' changelog section when upgrading between versions"
  status: failed
  reason: "User reported: Did not do what you said it should: upgrade output shows skill list but no 'What's new:' changelog section on upgrade from 0.4.0 → 0.5.0"
  severity: major
  test: 3
  root_cause: "CHANGELOG object in src/changelog.cjs is empty ({}). displayChangelog is called correctly from installer but returns silently because Object.keys(CHANGELOG) is empty. No 0.5.0 entry exists."
  artifacts:
    - path: "src/changelog.cjs"
      issue: "CHANGELOG object has no entries for version 0.5.0 or any version"
  missing:
    - "Add a '0.5.0' entry to CHANGELOG with relevant changes (new skills, improvements)"
  debug_session: ".planning/debug/installer-changelog-missing.md"
