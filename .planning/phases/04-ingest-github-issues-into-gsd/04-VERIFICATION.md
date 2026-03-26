---
phase: 04-ingest-github-issues-into-gsd
verified: 2026-03-26T22:00:00Z
status: human_needed
score: 12/12 must-haves verified
re_verification: false
gaps:
  - truth: "ROADMAP.md accurately reflects phase completion status"
    status: resolved
    reason: "ROADMAP.md updated via roadmap update-plan-progress after verification"
human_verification:
  - test: "Run gsd-custom:ingest-issues on a repo with open, unlabelled issues"
    expected: "Issues are classified, TODO files created with github_issue frontmatter and (ref: #N) in title, ingested label applied last, comment posted on each issue"
    why_human: "Requires live GitHub authentication and open test issues; cannot simulate gh issue list response in a unit test"
  - test: "Run release workflow on a branch with done/ TODOs that have github_issue fields"
    expected: "post-release-comments.cjs closes matching issues with 'Resolved in vX.Y.Z' and comments on merged PRs with 'Released in vX.Y.Z'"
    why_human: "Requires a real GitHub release and live gh CLI environment; cannot run the full CI workflow locally without triggering an actual release"
---

# Phase 4: Ingest GitHub Issues into GSD — Verification Report

**Phase Goal:** Ingest open GitHub issues into GSD as TODOs with provenance tracking; close resolved issues and comment on PRs at release time.
**Verified:** 2026-03-26T22:00:00Z
**Status:** human_needed (all automated checks pass, 2 items need live environment testing)
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Developer can invoke /gsd-custom:ingest-issues in Claude Code | VERIFIED | `.claude/commands/gsd-custom/ingest-issues.md` exists with correct `name: gsd-custom:ingest-issues` frontmatter |
| 2 | Skill processes all open issues without ingested or not-for-ingestion labels | VERIFIED | Step `list-issues` fetches with `gh issue list --repo pingvinen/donna --state open --json ... --limit 100` and filters out labelled issues |
| 3 | Each ingested issue produces one or more TODO files in .planning/todos/pending/ | VERIFIED | Step `process-issues` writes to `.planning/todos/pending/<date>-<slug>.md` using Write tool |
| 4 | TODO files have github_issue frontmatter field and (ref: #N) in title | VERIFIED | Template in skill file includes `github_issue: <issue_number as integer>` and `(ref: #<issue_number>)` in title field |
| 5 | Ingested issues get the ingested label applied as last step | VERIFIED | Step 5f explicitly states "MUST be the last step" and calls `gh issue edit <number> --add-label "ingested"` |
| 6 | Non-bug/non-feature issues get the not-for-ingestion label | VERIFIED | Step 5b applies `not-for-ingestion` label and skips to next issue for neither-classified issues |
| 7 | A comment is posted on each ingested issue listing the TODOs created | VERIFIED | Step 5e runs `gh issue comment <number> --repo pingvinen/donna --body "Ingested into GSD: ..."` |
| 8 | Duplicate issues prompt the developer via AskUserQuestion | VERIFIED | Step 5c invokes AskUserQuestion with skip/merge/create-anyway options |
| 9 | Release workflow runs post-release-comments script after creating the GitHub release | VERIFIED | `release.yml` step "Post release comments and close resolved issues" follows "Create GitHub release" step |
| 10 | Script scans .planning/todos/done/ for TODO files with github_issue frontmatter | VERIFIED | `scanDoneTodos()` uses `fs.readdirSync(doneDir).filter(f => f.endsWith('.md'))` + regex `/^github_issue:\s*(\d+)/m` |
| 11 | Script posts 'Resolved in vX.Y.Z' comment and closes issues with --reason completed | VERIFIED | `gh issue close ${issueNum} --repo pingvinen/donna --reason "completed" --comment "Resolved in v${version}"` |
| 12 | ROADMAP.md accurately reflects phase completion status | FAILED | Line 76 shows "1/2 plans executed" and line 80 shows `[ ] 04-02-PLAN.md` — all 04-02 deliverables exist and tests pass (287 pass, 0 fail) |

**Score:** 11/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.claude/commands/gsd-custom/ingest-issues.md` | Batch ingestion skill (min 80 lines) | VERIFIED | 173 lines; correct frontmatter, all 6 process steps, full inline workflow logic |
| `test/gsd-custom.test.cjs` | Tests for skill file existence and frontmatter (min 20 lines) | VERIFIED | 81 lines; 16 `it()` assertions covering all key content patterns |
| `scripts/post-release-comments.cjs` | Release-time issue closure and PR commenting script (min 60 lines) | VERIFIED | 208 lines; exports `scanDoneTodos` and `findMergedPRs`; full CLI entry point |
| `.github/workflows/release.yml` | Release workflow with post-release-comments step | VERIFIED | Step present at line 57; uses `RELEASE_PAT`; passes `new_version` argument |
| `test/post-release-comments.test.cjs` | Unit tests for release script logic (min 40 lines) | VERIFIED | 73 lines; 6 `it()` blocks covering all edge cases |
| `.planning/ROADMAP.md` | Phase 4 status marks both plans complete | STUB | Line 80 still shows `[ ] 04-02-PLAN.md`; line 76 shows "1/2 plans executed" |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `.claude/commands/gsd-custom/ingest-issues.md` | `.planning/todos/pending/` | Write tool creates TODO files | WIRED | Skill references path `todos/pending/<date>-<slug>.md` in step 5d |
| `.claude/commands/gsd-custom/ingest-issues.md` | GitHub Issues API | `gh issue list`, `gh issue view`, `gh issue edit`, `gh issue comment` | WIRED | All four `gh issue` commands present in the skill steps |
| `scripts/post-release-comments.cjs` | `.planning/todos/done/` | `fs.readdirSync` + `readFileSync` scanning for `github_issue` frontmatter | WIRED | `scanDoneTodos(doneDir)` on line 48; regex `/^github_issue:\s*(\d+)/m` on line 69 |
| `.github/workflows/release.yml` | `scripts/post-release-comments.cjs` | `node scripts/post-release-comments.cjs` step | WIRED | Step at line 57-60 runs `node scripts/post-release-comments.cjs ${{ steps.bump.outputs.new_version }}` |
| `scripts/post-release-comments.cjs` | GitHub API | `gh issue close`, `gh issue view`, `gh pr comment`, `gh pr list` | WIRED | All four `gh` commands confirmed in script lines 161, 171, 195, and `findMergedPRs` |

### Data-Flow Trace (Level 4)

Not applicable — no React components or UI rendering. All artifacts are Node.js CLI scripts and a markdown skill file.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `scanDoneTodos` returns `{}` for non-existent directory | `node -e "const m = require('./scripts/post-release-comments.cjs'); console.log(JSON.stringify(m.scanDoneTodos('/non/existent')))"` | `{}` | PASS |
| Both functions exported from script | `node -e "const m = require('./scripts/post-release-comments.cjs'); console.log(typeof m.scanDoneTodos, typeof m.findMergedPRs)"` | `function function` | PASS |
| Full test suite passes | `npm test` | 287 tests, 0 failures | PASS |
| Linter clean | `npm run lint:fix` | "No fixes applied" | PASS |
| Skill has no `git commit` string | `grep "git commit" .claude/commands/gsd-custom/ingest-issues.md` | (no output) | PASS |
| Script does not exit when no TODOs found | Code inspection line 148-151 | `if (issueNumbers.length === 0) { console.log(...); }` — no `process.exit` | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| INGEST-01 | 04-01-PLAN.md | Skill file at `.claude/commands/gsd-custom/ingest-issues.md` | SATISFIED | File exists, 173 lines, correct name and frontmatter |
| INGEST-02 | 04-01-PLAN.md | Batch ingestion flow with classification, dedup, TODO creation, commenting, labeling | SATISFIED | All sub-steps 5a-5f implemented inline; AskUserQuestion for ambiguous and duplicate cases |
| INGEST-03 | 04-02-PLAN.md | Release-time script scanning done/ for github_issue frontmatter | SATISFIED | `scanDoneTodos()` exported and functional |
| INGEST-04 | 04-02-PLAN.md | PR commenting with "Released in vX.Y.Z" | SATISFIED | `findMergedPRs()` + `gh pr comment` loop in CLI entry point |
| INGEST-05 | 04-02-PLAN.md | release.yml integration | SATISFIED | New step after "Create GitHub release" using `RELEASE_PAT` and passing version |
| INGEST-06 | 04-02-PLAN.md | Test coverage | SATISFIED | `test/gsd-custom.test.cjs` (16 assertions) + `test/post-release-comments.test.cjs` (6 assertions) + 2 new assertions in `test/workflows.test.cjs`; all 287 tests pass |

No orphaned requirements — all 6 INGEST IDs from the ROADMAP are claimed by plans and verified in the codebase.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/ROADMAP.md` | 76, 80 | Phase 4 plans count and checkbox not updated after 04-02 completion | Warning | Does not affect functionality; state tracking is inaccurate |

The `return {}`, `return []`, and `return null` patterns in `scripts/post-release-comments.cjs` are intentional graceful-degradation returns in error handlers and edge-case guards — they are not stubs.

### Human Verification Required

#### 1. Live Issue Ingestion End-to-End

**Test:** On a repo with at least one open, unlabelled issue, invoke `/gsd-custom:ingest-issues` in Claude Code.
**Expected:** Claude fetches issues, classifies each, asks about ambiguous ones via AskUserQuestion, creates TODO files in `.planning/todos/pending/` with `github_issue:` frontmatter and `(ref: #N)` in title, posts a comment on each ingested issue, and applies the `ingested` label as the final action per issue.
**Why human:** Requires live GitHub authentication and real open issues. The skill is executed by Claude's reasoning engine — unit tests can only verify the skill file's content patterns, not Claude's runtime behavior when following the instructions.

#### 2. Release-Time Script Integration

**Test:** Trigger the "Create Release" GitHub Actions workflow with at least one done TODO that has `github_issue:` frontmatter.
**Expected:** After the release is created, `post-release-comments.cjs` runs, closes matching GitHub issues with "Resolved in vX.Y.Z" and reason "completed", comments on merged PRs with "Released in vX.Y.Z", and exits 0.
**Why human:** Requires a real GitHub release environment and live `gh` CLI. The script's GitHub API calls (`gh issue close`, `gh pr comment`) cannot be verified without triggering actual API calls against real issues and PRs.

### Gaps Summary

One documentation gap was found: ROADMAP.md was not updated after Plan 04-02 completed. The plan checkbox on line 80 still reads `[ ] 04-02-PLAN.md` and line 76 shows "1/2 plans executed" — both should reflect that 04-02 is done.

All functional deliverables are fully implemented and verified:
- `ingest-issues.md` skill is substantive (173 lines), correctly structured, and implements all locked decisions D-01 through D-07, D-13-D-15
- `post-release-comments.cjs` exports `scanDoneTodos` and `findMergedPRs`, handles all edge cases, and is wired into `release.yml`
- Test suite is comprehensive: 287 tests pass, 0 failures, linter clean

The ROADMAP documentation gap is a blocker only in the sense that the project's state tracking is inaccurate — it does not prevent the code from working.

---

_Verified: 2026-03-26T22:00:00Z_
_Verifier: Claude (gsd-verifier)_
