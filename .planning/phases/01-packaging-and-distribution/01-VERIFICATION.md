---
phase: 01-packaging-and-distribution
verified: 2026-03-14T12:00:00Z
status: passed
score: 14/14 must-haves verified
re_verification: false
human_verification:
  - test: "Run /donna:setup in Claude Code after installing"
    expected: "Banner prints, version.md is read and displayed, stub message shows"
    why_human: "Requires Claude Code running with ~/.donna/ installed — cannot verify programmatically"
  - test: "Run node bin/install.cjs on a fresh machine (no ~/.donna/) and then re-run"
    expected: "First run installs; second run prints 'already up to date'"
    why_human: "Integration smoke-test against real filesystem (not test temp dir)"
---

# Phase 1: Packaging and Distribution Verification Report

**Phase Goal:** Anyone can run `npx @pingvinen/donna-assistant` and get a working (stub) donna:setup skill in Claude Code, with version tracking and a migration system that handles upgrades from any previous version
**Verified:** 2026-03-14T12:00:00Z
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Package.json has correct name, bin, files, engines, publishConfig, and scripts | VERIFIED | `@pingvinen/donna-assistant`, bin `donna-assistant -> ./bin/install.cjs`, files array covers all dirs, node>=18, publishConfig public+provenance |
| 2 | Version file can be read and written in the documented markdown format | VERIFIED | `src/version.cjs` exports `readVersion`/`writeVersion`; parses bold-label markdown; preserves Installed timestamp on update |
| 3 | Migrator runs numbered .cjs files in order, stops on failure, reports results | VERIFIED | `src/migrator.cjs` sorts by parseInt prefix, filters pending, calls `up(ctx)`, stops on first throw, returns `{num, description, ok, error?}` |
| 4 | Provider detection finds Claude Code when ~/.claude/ exists | VERIFIED | `src/providers/index.cjs` + `src/providers/claude-code.cjs`: detect() checks fs.existsSync on `.claude/` dir |
| 5 | Stub file has correct YAML frontmatter and @ path reference to workflow | VERIFIED | `stubs/claude-code/donna/setup.md` has `name: donna:setup`, description, allowed-tools, and `@~/.donna/workflows/setup.md` |
| 6 | Workflow file produces hello-world output with version display | VERIFIED | `workflows/setup.md` has DONNA banner, reads version.md, prints stub message and next steps using `<step>` tags |
| 7 | Running the installer on a fresh machine creates ~/.donna/, copies stubs, copies workflows, runs migrations, writes version.md | VERIFIED | `src/installer.cjs` orchestrates all steps; 6 integration tests pass covering each step |
| 8 | Running the installer again on an already-current machine is a safe no-op | VERIFIED | Idempotent path: version == packageVersion + no pending migrations → prints "Already up to date"; 2 tests pass |
| 9 | Running the installer on a machine with older version upgrades correctly, showing changelog | VERIFIED | upgradeHeader printed, migrations run, migration descriptions output as changelog; 4 upgrade tests pass |
| 10 | When no providers detected, installer still creates ~/.donna/ and warns user | VERIFIED | No-provider path: still creates donnaDir and runs migrations, prints "No supported AI providers detected" |
| 11 | PR validation workflow runs lint, tests, and build check on every pull request | VERIFIED | `.github/workflows/validate.yml` triggers on pull_request to main; has lint-pr-title job and validate job (npm run lint, npm test, npm pack --dry-run) |
| 12 | Release workflow is manually triggered and determines version bump from commit history | VERIFIED | `.github/workflows/release.yml` triggers on workflow_dispatch; runs `node scripts/determine-bump.cjs` and `node scripts/generate-changelog.cjs` |
| 13 | Deploy workflow triggers on release publication and publishes to npm with OIDC | VERIFIED | `.github/workflows/deploy.yml` triggers on `release: [published]`; has `id-token: write`; runs `npm publish --provenance --access public` |
| 14 | Version bump script correctly identifies patch/minor/major from conventional commit prefixes and treats breaking changes as minor while on 0.x.y | VERIFIED | `scripts/determine-bump.cjs` exports `determineBump(messages, currentVersion)`; pre-1.0 downgrade logic present; 12 tests pass |

**Score:** 14/14 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `package.json` | npm package definition | VERIFIED | name, bin, files, engines, publishConfig all correct |
| `src/version.cjs` | Version file read/write — exports readVersion, writeVersion | VERIFIED | Both functions exported, substantive implementation |
| `src/migrator.cjs` | Migration runner — exports runMigrations | VERIFIED | Exported, sorts+filters+executes migrations, stop-on-failure |
| `src/providers/index.cjs` | Provider aggregator — exports detectProviders | VERIFIED | Exported, delegates to claude-code provider |
| `src/providers/claude-code.cjs` | Claude Code provider | VERIFIED | detect(), stubSource, getStubTarget() all implemented |
| `src/output.cjs` | Console output helpers | VERIFIED | banner, success, fail, info, upgradeHeader, migrationLine all present |
| `stubs/claude-code/donna/setup.md` | donna:setup stub | VERIFIED | YAML frontmatter with `name: donna:setup` and `@~/.donna/workflows/setup.md` |
| `workflows/setup.md` | Setup workflow | VERIFIED | DONNA banner, version display step, stub message, next steps |
| `migrations/001-initial.cjs` | Initial migration | VERIFIED | Creates workflows/, templates/, references/ via ctx.fs.mkdirSync |
| `bin/install.cjs` | npx entry point with shebang | VERIFIED | Has `#!/usr/bin/env node`, requires installer, calls run().catch() |
| `src/installer.cjs` | Main installer orchestration — exports run | VERIFIED | Full orchestration: banner → mkdir → version check → migrations → providers → workflows → writeVersion |
| `.github/workflows/validate.yml` | PR validation CI | VERIFIED | pull_request trigger, lint-pr-title job, validate job |
| `.github/workflows/release.yml` | Release creation workflow | VERIFIED | workflow_dispatch trigger, contents: write permission, runs both scripts |
| `.github/workflows/deploy.yml` | npm publish workflow | VERIFIED | release trigger, id-token: write, npm publish --provenance --access public |
| `scripts/determine-bump.cjs` | Version bump determination | VERIFIED | GITHUB_OUTPUT write, pure function export, pre-1.0 convention |
| `scripts/generate-changelog.cjs` | Changelog generation | VERIFIED | GITHUB_OUTPUT write with EOF delimiter, pure function export, grouped markdown |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `stubs/claude-code/donna/setup.md` | `workflows/setup.md` | `@~/.donna/workflows/setup.md` reference | VERIFIED | Line 14: `@~/.donna/workflows/setup.md` present |
| `migrations/001-initial.cjs` | `src/migrator.cjs` | migrator requires and executes migration files | VERIFIED | `module.exports = { version, description, up(ctx) }` shape matches migrator's require+call pattern |
| `bin/install.cjs` | `src/installer.cjs` | require and call run() | VERIFIED | Line 4: `const { run } = require("../src/installer.cjs")` |
| `src/installer.cjs` | `src/version.cjs` | reads/writes version file | VERIFIED | Line 8: `const version = require("./version.cjs")` |
| `src/installer.cjs` | `src/migrator.cjs` | runs pending migrations | VERIFIED | Line 9: `const migrator = require("./migrator.cjs")` |
| `src/installer.cjs` | `src/providers/index.cjs` | detects and installs to providers | VERIFIED | Line 10: `const providers = require("./providers/index.cjs")` |
| `src/installer.cjs` | `src/output.cjs` | formatted console output | VERIFIED | Line 7: `const output = require("./output.cjs")` |
| `.github/workflows/release.yml` | `scripts/determine-bump.cjs` | workflow step runs node script | VERIFIED | Line 24: `run: node scripts/determine-bump.cjs` |
| `.github/workflows/release.yml` | `scripts/generate-changelog.cjs` | workflow step runs node script | VERIFIED | Line 31: `run: node scripts/generate-changelog.cjs` |
| `.github/workflows/deploy.yml` | `package.json` | npm publish uses publishConfig | VERIFIED | Line 29: `run: npm publish --provenance --access public`; publishConfig in package.json |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DIST-01 | 01-02 | Installer available as `npx donna-install` — detects providers, copies stubs and runtime | SATISFIED* | `bin/install.cjs` wired to `src/installer.cjs`; detects providers, copies stubs to `~/.claude/commands/`, copies workflows to `~/.donna/`. Note: bin name is `donna-assistant` not `donna-install` — functional goal met but name differs from requirement text |
| DIST-02 | 01-01 | `~/.donna/version.md` tracks installed version; installer shows changelog when upgrading | SATISFIED | `src/version.cjs` writes version.md; installer prints upgradeHeader + migrationLine on upgrade |
| DIST-03 | 01-01 | Migration system handles upgrades from any previous version — cumulative | SATISFIED | `src/migrator.cjs` skips migrations <= lastMigration, runs remaining in order |
| DIST-04 | 01-02 | Installer is idempotent and safe to re-run | SATISFIED | Idempotent check in installer.cjs lines 38-46; version.md not rewritten on no-op run |
| DIST-05 | 01-01 | npm package contains stubs, workflows, templates, references, and installer script | SATISFIED | `files` field in package.json includes bin/, src/, stubs/, workflows/, migrations/, templates/, references/ — confirmed by npm pack --dry-run |
| DIST-06 | 01-01 | `donna:setup` skill exists as stub + workflow with hello-world implementation | SATISFIED | `stubs/claude-code/donna/setup.md` + `workflows/setup.md` with DONNA banner, version display, and stub message |
| DIST-07 | 01-03 | PR validation workflow — lint and build check on every pull request | SATISFIED | `.github/workflows/validate.yml` with pull_request trigger, lint-pr-title, lint code, test, build check |
| DIST-08 | 01-03 | Release creation workflow — manual trigger, version bump, changelog, GitHub release | SATISFIED | `.github/workflows/release.yml` with workflow_dispatch, determine-bump, generate-changelog, gh release create |
| DIST-09 | 01-03 | Deployment workflow — reacts to GitHub release, publishes to npm | SATISFIED | `.github/workflows/deploy.yml` with release published trigger, OIDC id-token, npm publish --provenance |

*DIST-01 note: The requirement text says `npx donna-install` but the implementation uses `npx @pingvinen/donna-assistant`. The functional behavior (install via npx, detect providers, copy stubs, copy runtime) is fully implemented. The invocation command differs from the requirement text — this is a known naming decision and the phase goal statement uses `npx @pingvinen/donna-assistant`.

---

## Anti-Patterns Found

No blockers or stubs found. All implementations are substantive.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/installer.cjs` | 39-46 | Idempotent check calls `runMigrations` (executes nothing but reads fs) | Info | Not a bug — pending filter returns empty array when caught-up, so no up() calls occur. Tests confirm behavior. |

---

## Test Suite Results

- **Total tests:** 71 passing, 0 failing
- **Coverage:** version (4), package (5), migrator+provider (9), stubs+workflow (8), installer integration (18), determine-bump+changelog (12), workflows validation (15)
- **Lint:** biome check passes (exit 0)
- **npm pack:** All expected directories included (bin/, src/, stubs/, workflows/, migrations/, templates/, references/)

---

## Human Verification Required

### 1. End-to-end stub execution in Claude Code

**Test:** Run `node bin/install.cjs` locally (will install to real `~/.donna/` and `~/.claude/commands/donna/`), then open Claude Code and run `/donna:setup`
**Expected:** DONNA banner prints, version from `~/.donna/version.md` is displayed, stub message "This is a stub -- real setup coming in Phase 2" appears, next steps are listed
**Why human:** Requires Claude Code running with the installed stub. The `@~/.donna/workflows/setup.md` path resolution and Claude Code's `@` reference loading behavior cannot be verified programmatically.

### 2. npm pack / publish readiness

**Test:** Review that `npm publish --access public` would succeed (requires npm login and package not yet claimed on npm)
**Expected:** Package publishes successfully under `@pingvinen/donna-assistant`
**Why human:** Cannot publish to npm in automated verification. First publish must be manual per PLAN.md user_setup instructions.

---

## Gaps Summary

No gaps found. All 14 observable truths are verified, all artifacts exist with substantive implementations, all key links are wired. The test suite (71 tests, 0 failures) and lint check provide strong automated coverage.

The only item requiring attention is the DIST-01 naming discrepancy (`npx donna-install` in requirements vs `npx @pingvinen/donna-assistant` in implementation) — this is a cosmetic requirements text issue, not a functional gap. The phase goal statement itself uses the correct invocation.

---

_Verified: 2026-03-14T12:00:00Z_
_Verifier: Claude (gsd-verifier)_
