---
phase: 06-polish-and-harden
plan: 01
subsystem: donna-tools
tags: [cli, bootstrap, version-check, refactoring]
dependency_graph:
  requires: [version.cjs, migrator.cjs, changelog.cjs]
  provides: [donna-tools init, donna-tools commit, donna-tools daily-path, donna-tools resolve-secret]
  affects: [all workflows calling bootstrap]
tech_stack:
  added: [donna-tools.cjs CLI router]
  patterns: [subcommand router, injectable fetch, JSON output protocol]
key_files:
  created:
    - src/donna-tools.cjs
    - test/donna-tools.test.cjs
  modified: []
decisions:
  - donna-tools.cjs exports named subcommand handlers (runInit, runCommit, runDailyPath, runResolveSecret) alongside main() so tests can call them directly without spawning a subprocess
  - fetchLatestVersion is an injectable parameter in runInit for deterministic unit testing without hitting the npm registry
  - Biome linter requires template literals — applied --unsafe fix for err.message concatenation pattern
metrics:
  duration: 185s
  completed: 2026-03-27
  tasks_completed: 1
  tasks_total: 1
  files_created: 2
  files_modified: 0
---

# Phase 06 Plan 01: donna-tools.cjs Foundation Summary

donna-tools.cjs CLI entry point with 4 subcommands (init, commit, daily-path, resolve-secret), once-per-day version check with file cache, and full unit test coverage.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for all subcommands | 3c30186 | test/donna-tools.test.cjs |
| 1 (GREEN) | donna-tools.cjs implementation | 5cbd334 | src/donna-tools.cjs |

## What Was Built

`src/donna-tools.cjs` is a CJS CLI module following the gsd-tools.cjs pattern. It:

1. **`init` subcommand** — reads `~/.config/donna/config.md` (YAML frontmatter), runs migrations via migrator.cjs, syncs Obsidian daily-notes.json, performs a once-per-day npm registry version check (3s timeout, cached in `~/.donna/version-check.md`). Returns a single JSON object with `storage_repo`, `daily_folder`, `auto_push`, `update_available`, `migrations_applied`, `error`.

2. **`commit` subcommand** — stages files via `git add`, checks porcelain status, commits with provided message, conditionally pushes if `auto_push: true`. Returns `{"committed": true/false}`.

3. **`daily-path` subcommand** — computes `<storage_repo>/<daily_folder>/YYYY-MM-DD.md`, creates the directory if missing. Returns `{"path": "..."}`.

4. **`resolve-secret` subcommand** — parses `<storage_repo>/donna/secrets.md` for `- KEY: value` entries, validates against placeholder patterns (`your-*-here`, `TODO`, `PLACEHOLDER`, `xxx`, `<...>`). Returns `{"key", "value"}` or `{"error": "placeholder_value"|"key_not_found"}`.

The version check uses Node.js `https.get` directly (no npm CLI subprocess) with a 3000ms socket timeout and never throws — any network failure returns `update_available: null`.

## Test Coverage

`test/donna-tools.test.cjs` — 21 test cases across 8 describe blocks:
- init: no config → error, valid config → fields, cache hit → no network call, cache miss → writes cache, error handling
- commit: nothing to commit → false, staged files → committed true, unchanged files → false
- daily-path: date format, .md extension, directory creation, path structure
- resolve-secret: known key, unknown key, placeholder patterns, missing file
- CLI: main export, all subcommand exports

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Biome linter requires template literals for string concatenation**
- **Found during:** Task 1 GREEN, lint:fix phase
- **Issue:** `err.message + "\n"` fails biome `useLiteralKeys` / template literal rule
- **Fix:** Applied `biome check --fix --unsafe` to convert to `\`${err.message}\n\``
- **Files modified:** src/donna-tools.cjs
- **Commit:** 5cbd334 (included in implementation commit)

## Known Stubs

None — all subcommands are fully wired and functional.

## Self-Check: PASSED

- [x] `src/donna-tools.cjs` exists: FOUND
- [x] `test/donna-tools.test.cjs` exists: FOUND
- [x] commit 3c30186 exists: FOUND
- [x] commit 5cbd334 exists: FOUND
- [x] `npm test` exits 0: CONFIRMED (312/312 pass)
- [x] `npm run lint` exits 0: CONFIRMED (no errors)
- [x] `node src/donna-tools.cjs init` produces valid JSON: CONFIRMED
- [x] `node src/donna-tools.cjs unknown-cmd` exits non-zero: CONFIRMED
