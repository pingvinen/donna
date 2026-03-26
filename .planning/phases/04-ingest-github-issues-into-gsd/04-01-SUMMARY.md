---
phase: 04-ingest-github-issues-into-gsd
plan: 01
subsystem: tooling
tags: [gh-cli, gsd-custom, issue-ingestion, developer-tooling, todos]

# Dependency graph
requires: []
provides:
  - gsd-custom:ingest-issues skill at .claude/commands/gsd-custom/ingest-issues.md
  - Batch GitHub issue ingestion into .planning/todos/pending/ with github_issue frontmatter
  - test/gsd-custom.test.cjs validating skill file structure and content
affects:
  - 04-02 (release-time closure step in release.yml — reads github_issue frontmatter from done TODOs)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "gsd-custom: skill inline logic — no @~/.donna/workflows/ references, all steps inline in command file"
    - "github_issue: frontmatter field for machine-readable provenance in TODO files"
    - "(ref: #N) title pattern for human-readable issue provenance"
    - "ingested label as last step per issue for atomicity (retry safety)"

key-files:
  created:
    - .claude/commands/gsd-custom/ingest-issues.md
    - test/gsd-custom.test.cjs
  modified: []

key-decisions:
  - "ingest-issues skill uses gsd-custom: prefix and inline workflow logic — not installed via Donna installer (D-13, D-14)"
  - "ingested label applied as LAST step per issue to ensure atomicity and safe retry on failure (D-05/pitfall 2)"
  - "Skill stages TODO files with git add but does not commit — developer commits in main context (CLAUDE.md SSH signing constraint)"
  - "AskUserQuestion used for both unclear issue classification (D-01) and duplicate TODO detection (D-02)"

patterns-established:
  - "gsd-custom skill: markdown command file at .claude/commands/gsd-custom/<name>.md with inline process steps"
  - "Ingested TODO format: standard GSD frontmatter + github_issue: integer field + (ref: #N) in title"

requirements-completed: [INGEST-01, INGEST-02]

# Metrics
duration: 15min
completed: 2026-03-26
---

# Phase 4 Plan 01: Ingest Issues Skill Summary

**gsd-custom:ingest-issues skill — batch GitHub issue ingestion into GSD TODOs with classification, dedup, provenance, and idempotent labeling**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-26T19:10:00Z
- **Completed:** 2026-03-26T19:25:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `.claude/commands/gsd-custom/ingest-issues.md` (173 lines) implementing the full batch ingestion flow with all locked decisions (D-01 through D-07, D-13 through D-15)
- Skill classifies issues as bug/feature/neither, asks developer for unclear cases, checks semantic duplicates against pending TODOs, creates TODO files with `github_issue:` frontmatter and `(ref: #N)` title, comments on issues, and applies labels atomically
- Created `test/gsd-custom.test.cjs` with 16 assertions covering file existence, frontmatter fields, allowed-tools, and all key content patterns — all 263 tests pass

## Task Commits

Each task was committed atomically:

1. **Task 1: Create gsd-custom:ingest-issues skill file** - `54a9a43` (feat)
2. **Task 2: Create tests for gsd-custom skill** - `ed05802` (test)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `.claude/commands/gsd-custom/ingest-issues.md` — Batch GitHub issue ingestion skill for `pingvinen/donna`
- `test/gsd-custom.test.cjs` — Tests for skill file structure, frontmatter, and content patterns

## Decisions Made

- Skill avoids "git commit" string entirely (not just avoiding execution) to satisfy test assertion — explanatory text uses "VCS commit" instead
- Biome linter auto-fixed one quote normalization in the test file; tests continued passing after the fix
- Skill is 173 lines (min required was 80) — longer due to inline step documentation following gsd-custom: pattern

## Deviations from Plan

**1. [Rule 1 - Bug] Removed "git commit" string from explanatory text**
- **Found during:** Task 1 verification (acceptance criteria check)
- **Issue:** Acceptance criteria requires `! grep -q "git commit"` — the initial draft included the phrase "run git commit to save" in the stage-and-summarize step summary
- **Fix:** Replaced "run git commit to save" with "Create a commit in your main terminal" and replaced "Do NOT run git commit" with "Do NOT invoke a VCS commit from this skill"
- **Files modified:** .claude/commands/gsd-custom/ingest-issues.md
- **Verification:** `! grep -q "git commit"` passes
- **Committed in:** 54a9a43 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug — acceptance criteria string match)
**Impact on plan:** Minor wording change, no functional impact. The constraint is preserved — skill never attempts to run a commit.

## Issues Encountered

None beyond the deviation documented above.

## User Setup Required

None — no external service configuration required. The `gh` CLI must be authenticated (`gh auth login`) before using the skill, but that is a prerequisite check inside the skill itself (step 1).

## Next Phase Readiness

- Task 1 (ingest-issues skill) is complete and ready for real use
- Phase 4 Plan 02 (release-time closure) can proceed: will add `scripts/post-release-comments.cjs` and a step in `release.yml` that reads `github_issue:` frontmatter from done TODOs — this frontmatter field is now established by this plan

## Self-Check: PASSED

- FOUND: .claude/commands/gsd-custom/ingest-issues.md
- FOUND: test/gsd-custom.test.cjs
- FOUND: 04-01-SUMMARY.md
- FOUND: commit 54a9a43 (feat: skill file)
- FOUND: commit ed05802 (test: test file)

---
*Phase: 04-ingest-github-issues-into-gsd*
*Completed: 2026-03-26*
