---
phase: 01-packaging-and-distribution
plan: 03
subsystem: ci-cd
tags: [github-actions, conventional-commits, semver, npm-publish, oidc]

# Dependency graph
requires:
  - phase: 01-01
    provides: package.json, biome config, test infrastructure
provides:
  - PR validation workflow (lint PR title, lint code, test, build check)
  - Release creation workflow (manual trigger, version bump from conventional commits, changelog, GitHub release)
  - Deploy workflow (release trigger, OIDC npm publish with provenance)
  - Version bump script with pre-1.0 semver convention
  - Changelog generation script with grouped markdown output
  - 27 new tests (12 bump/changelog + 15 workflow validation)
affects: []

# Tech tracking
tech-stack:
  added: ["amannn/action-semantic-pull-request@v6", "actions/checkout@v5", "actions/setup-node@v4"]
  patterns: [Three-workflow CI/CD (validate/release/deploy), conventional commit PR titles with squash merge, OIDC trusted publishing, pure function exports with CLI wrapper]

key-files:
  created:
    - scripts/determine-bump.cjs
    - scripts/generate-changelog.cjs
    - .github/workflows/validate.yml
    - .github/workflows/release.yml
    - .github/workflows/deploy.yml
    - test/determine-bump.test.cjs
    - test/workflows.test.cjs
  modified: []

key-decisions:
  - "Separated pure functions from CLI wrappers for testability (determineBump and generateChangelog exported as pure functions)"
  - "Used multiline GITHUB_OUTPUT delimiter (EOF) for changelog to handle newlines correctly"

patterns-established:
  - "Pure function + CLI wrapper: export testable pure functions, run git commands only in CLI mode (require.main === module)"
  - "Workflow validation via string matching: validate YAML workflow files by checking for key strings rather than adding a YAML parser dependency"

requirements-completed: [DIST-07, DIST-08, DIST-09]

# Metrics
duration: 3min
completed: 2026-03-14
---

# Phase 1 Plan 03: CI/CD Pipeline Summary

**Three GitHub Actions workflows (validate/release/deploy) with version bump and changelog scripts, all tested with 27 new tests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-14T11:29:30Z
- **Completed:** 2026-03-14T11:33:00Z
- **Tasks:** 3 of 3 (Task 3 checkpoint resolved with feedback)
- **Files created:** 7

## Accomplishments
- Created determine-bump.cjs that parses conventional commit prefixes and respects pre-1.0 semver (breaking = minor, not major)
- Created generate-changelog.cjs that groups commits into Features/Fixes/Other markdown sections
- Both scripts export pure functions for testing and run as CLI with git log reading when executed directly
- Created validate.yml: PR trigger, lint PR title via semantic-pull-request action, lint code, test, build check
- Created release.yml: manual trigger, version bump determination, changelog generation, GitHub release creation
- Created deploy.yml: release trigger, OIDC id-token permission, npm publish with provenance
- All 71 tests pass (26 existing + 18 installer + 12 bump/changelog + 15 workflow)

## Task Commits

Tasks were staged (not committed) per orchestrator protocol. All files staged with `git add`.

1. **Task 1: Version bump and changelog scripts with tests** - TDD (12 tests)
2. **Task 2: GitHub Actions workflow files with validation tests** - 15 tests
3. **Task 3: Human verification checkpoint** - PENDING (not yet executed)

## Files Created/Modified
- `scripts/determine-bump.cjs` - Version bump determination from conventional commit messages
- `scripts/generate-changelog.cjs` - Changelog generation grouped by commit type
- `.github/workflows/validate.yml` - PR validation (lint PR title, lint code, test, build check)
- `.github/workflows/release.yml` - Manual release creation (version bump, changelog, GitHub release)
- `.github/workflows/deploy.yml` - npm publish on release (OIDC, provenance)
- `test/determine-bump.test.cjs` - 12 tests for bump determination and changelog generation
- `test/workflows.test.cjs` - 15 tests validating workflow file structure

## Decisions Made
- Separated pure functions from CLI wrappers: `determineBump(messages, currentVersion)` and `generateChangelog(messages)` are exported for testing while git log reading only happens in CLI mode
- Used multiline GITHUB_OUTPUT delimiter (EOF pattern) for changelog output to handle newlines correctly
- Workflow tests use string matching rather than YAML parsing to avoid adding a dependency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Applied biome formatting to new files**
- **Found during:** Task 1 verification
- **Issue:** Biome check found tab/space formatting inconsistencies in new scripts
- **Fix:** Ran `npx biome check --write .` to auto-format
- **Files modified:** scripts/determine-bump.cjs, scripts/generate-changelog.cjs, test/determine-bump.test.cjs
- **Verification:** `npx biome check .` passes with no issues

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Formatting fix necessary for lint compliance. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviation above.

## User Setup Required

External services require manual configuration before CI/CD works:

**npm (one-time):**
1. First manual publish: `npm login && npm publish --access public`
2. Configure OIDC trusted publishing on npmjs.com: package settings -> Publishing access -> Add trusted publisher (GitHub repo: pingvinen/donna, workflow: deploy.yml)

**GitHub repository:**
1. Enable squash merging with PR title as default commit message: Settings -> General -> Pull Requests -> Allow squash merging (checked), Default to pull request title

## Checkpoint Resolved

Task 3 (checkpoint:human-verify) — user reviewed and provided feedback:
- Restricted PR title types to feat, fix, docs, chore (validate.yml)
- Updated all workflows to node 24
- Removed redundant npm test from deploy.yml
- Added npm pack + tgz artifact upload to release.yml
- Converted workflows/setup.md to use `<step>` tags
- Confirmed manual dispatch release flow is correct for per-phase branching strategy
- Confirmed OIDC handles npm auth (no NPM_TOKEN needed)

## Next Phase Readiness
- All Phase 1 code is complete (plans 01, 02, 03)
- CI/CD pipeline ready to activate once repo is configured and first publish done
- After checkpoint approval, Phase 1 is complete and Phase 2 can begin

---
*Phase: 01-packaging-and-distribution*
*Completed: 2026-03-14 (pending checkpoint)*
