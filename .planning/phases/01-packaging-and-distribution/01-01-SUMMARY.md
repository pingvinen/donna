---
phase: 01-packaging-and-distribution
plan: 01
subsystem: packaging
tags: [npm, nodejs, cjs, biome, migration, provider-detection]

# Dependency graph
requires:
  - phase: none
    provides: greenfield project
provides:
  - npm package definition with correct name, bin, files, engines, publishConfig
  - version file read/write module (readVersion, writeVersion)
  - migration runner module (runMigrations) with stop-on-failure semantics
  - provider detection module (detectProviders) with Claude Code support
  - output helpers module (banner, success, fail, info, upgradeHeader, migrationLine)
  - donna:setup stub with YAML frontmatter and @-path workflow reference
  - setup workflow with DONNA banner and version display
  - 001-initial migration creating directory structure
  - 26 passing unit tests covering all modules
affects: [01-02-PLAN, 01-03-PLAN]

# Tech tracking
tech-stack:
  added: ["@biomejs/biome (dev)", "node:test", "node:assert"]
  patterns: [CommonJS modules (.cjs), TDD red-green-refactor, temp directory test isolation]

key-files:
  created:
    - package.json
    - biome.json
    - src/output.cjs
    - src/version.cjs
    - src/migrator.cjs
    - src/providers/claude-code.cjs
    - src/providers/index.cjs
    - migrations/001-initial.cjs
    - stubs/claude-code/donna/setup.md
    - workflows/setup.md
    - test/version.test.cjs
    - test/package.test.cjs
    - test/migrator.test.cjs
    - test/stubs.test.cjs
  modified: []

key-decisions:
  - "Used double quotes per biome formatter default (consistent style)"
  - "Fixed npm test script to use glob pattern 'test/*.test.cjs' for Node v24 compatibility"
  - "Added .planning/ and node_modules/ to biome ignore list"

patterns-established:
  - "TDD with node:test: write failing tests first, then implement, then format"
  - "Temp directory isolation: all tests use fs.mkdtempSync for clean test environments"
  - "Markdown version file format: # Donna header with bold-labeled fields"
  - "Migration file format: numbered .cjs with { version, description, up(ctx) } exports"
  - "Provider detection pattern: detect(homeDir) checks directory existence"

requirements-completed: [DIST-02, DIST-03, DIST-05, DIST-06]

# Metrics
duration: 4min
completed: 2026-03-14
---

# Phase 1 Plan 01: Package Foundation Summary

**npm package structure with version tracking, migration runner, provider detection, donna:setup stub/workflow, and 26 passing TDD tests using node:test**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-14T11:22:01Z
- **Completed:** 2026-03-14T11:25:58Z
- **Tasks:** 3
- **Files modified:** 14

## Accomplishments
- Created npm package with correct name (@pingvinen/donna-assistant), bin mapping, files array, engines, and publishConfig
- Built version.cjs with markdown read/write that preserves install timestamps on upgrade
- Built migrator.cjs that runs numbered .cjs migrations in order with stop-on-failure
- Built provider detection that finds Claude Code by ~/.claude/ directory existence
- Created donna:setup stub with proper YAML frontmatter and @~/.donna/workflows/setup.md reference
- Created setup workflow with DONNA banner, version display, and stub messaging
- All 26 tests pass, biome lint passes, npm pack shows correct package contents

## Task Commits

Tasks were staged (not committed) per orchestrator protocol. All files staged with `git add`.

1. **Task 1: Package config, output helpers, version module, and their tests** - TDD (9 tests)
2. **Task 2: Migrator, provider detection, and their tests** - TDD (9 tests)
3. **Task 3: Stub and workflow content files with tests** - TDD (8 tests)

## Files Created/Modified
- `package.json` - npm package definition with all required fields
- `biome.json` - Biome linter/formatter config with .planning/ ignore
- `src/output.cjs` - Console output helpers (banner, success, fail, info, upgradeHeader, migrationLine)
- `src/version.cjs` - readVersion/writeVersion for ~/.donna/version.md
- `src/migrator.cjs` - runMigrations with numbered file execution and stop-on-failure
- `src/providers/claude-code.cjs` - Claude Code provider detection and stub paths
- `src/providers/index.cjs` - detectProviders aggregator
- `migrations/001-initial.cjs` - Initial migration creating workflows/, templates/, references/
- `stubs/claude-code/donna/setup.md` - donna:setup stub with YAML frontmatter
- `workflows/setup.md` - Setup workflow with DONNA banner and version display
- `templates/.gitkeep` - Empty directory placeholder for Phase 1
- `references/.gitkeep` - Empty directory placeholder for Phase 1
- `test/version.test.cjs` - 4 tests for version read/write
- `test/package.test.cjs` - 5 tests for package.json fields
- `test/migrator.test.cjs` - 9 tests for migrator and provider detection
- `test/stubs.test.cjs` - 8 tests for stub and workflow content

## Decisions Made
- Used double quotes consistently per biome formatter default
- Fixed npm test script to use glob pattern `test/*.test.cjs` instead of `test/` directory path, which fails on Node v24
- Added `.planning/` and `node_modules/` to biome ignore list to avoid formatting non-source files

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed npm test script glob pattern**
- **Found during:** Task 1 verification
- **Issue:** `node --test test/` fails on Node v24 with MODULE_NOT_FOUND; needs explicit glob
- **Fix:** Changed test script to `node --test 'test/*.test.cjs'`
- **Files modified:** package.json
- **Verification:** `npm test` runs all 26 tests successfully

**2. [Rule 3 - Blocking] Applied biome formatting and lint fixes**
- **Found during:** Overall verification
- **Issue:** Biome check failed on single-quote strings, optional chain lint, and array formatting
- **Fix:** Ran `npx biome check --write .` and manually fixed optional chain in version.cjs
- **Files modified:** All .cjs source and test files
- **Verification:** `npx biome check .` passes with no issues

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All independent modules are built and tested, ready for Plan 02 to wire them into the installer (bin/install.cjs)
- Package structure verified with npm pack --dry-run
- bin/ directory will be created in Plan 02 when the installer entry point is built

---
*Phase: 01-packaging-and-distribution*
*Completed: 2026-03-14*
