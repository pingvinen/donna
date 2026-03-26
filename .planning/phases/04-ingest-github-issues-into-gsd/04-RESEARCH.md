# Phase 4: Ingest GitHub Issues into GSD - Research

**Researched:** 2026-03-26
**Domain:** GSD internal skill authoring — GitHub CLI interaction, TODO file creation, release workflow integration
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Ingestion flow**
- D-01: When an unclear issue is encountered, use AskUserQuestion to ask the developer inline — no need to post clarification comments on the issue since the developer is the primary audience
- D-02: Semantic match against all pending TODOs in `.planning/todos/pending/` to detect duplicates — if a match is found, ask the developer whether to skip or merge
- D-03: One issue can produce multiple TODOs — split issues describing several pieces of work into separate TODOs, each referencing the source issue
- D-04: TODO provenance uses both: `github_issue: <number>` field in YAML frontmatter (machine-readable for release-time flow) AND `(ref: #<number>)` inline mention (human-readable)

**Labeling & commenting**
- D-05: Two labels managed: `ingested` (applied after successful processing) and `not-for-ingestion` (applied to non-bug/non-feature issues that are skipped)
- D-06: Auto-create missing labels on the repo using `gh label create` before processing
- D-07: Comment on ingested issues lists each TODO created, e.g. "Ingested into GSD:\n- TODO title 1\n- TODO title 2"

**Release-time closure**
- D-08: Release-time logic hooks into the existing `release.yml` GitHub Actions workflow — not a separate skill invocation
- D-09: Detect completed work by scanning `.planning/todos/done/` files for `github_issue` frontmatter field
- D-10: Use appropriate GitHub close semantics: `completed` when all TODOs done, `not planned` if explicitly rejected, `duplicate` if closed as duplicate during ingestion
- D-11: Post a comment with the release version before closing (e.g. "Resolved in v0.9.0")
- D-12: Also comment on merged PRs with the version number (folded from pending TODO: "Comment on PRs after release with version number")

**Skill design**
- D-13: GSD internal skill — lives in project config, not shipped via npm, not registered in the Donna installer
- D-14: Skill name uses `gsd-custom:` prefix (e.g. `gsd-custom:ingest-issues`)
- D-15: Batch mode — processes every open issue without `ingested` label in one invocation, asking inline only when unclear issues arise

### Claude's Discretion
- Comment formatting details (exact markdown structure)
- How to detect if an issue is a bug report vs feature request vs neither
- GSD TODO file naming convention alignment
- Release workflow step placement within release.yml

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

## Summary

Phase 4 builds two closely related pieces of developer tooling: (1) a `gsd-custom:ingest-issues` skill that ingests open GitHub issues into GSD as TODOs, and (2) a new step in `release.yml` that scans completed TODOs for issue provenance, posts version comments, and closes resolved issues.

The skill is a `gsd-custom:` slash command — a markdown file placed at `.claude/commands/gsd-custom/ingest-issues.md` in the project. This pattern is already established: `.claude/commands/gsd-custom/` already contains `start-execution.md` and `finish-execution.md`. The skill does NOT interact with the Donna installer, npm package, or product skill stubs. It is purely project-local developer tooling.

Both labels required (`ingested`, `not-for-ingestion`) already exist on the `pingvinen/donna` repo, verified via `gh label list`. The `gh` CLI supports all required operations: `gh issue list`, `gh issue comment`, `gh issue close --reason`, `gh label create`, `gh pr comment`. The `release.yml` workflow already uses `gh` with `secrets.RELEASE_PAT` and has `contents: write` permission — adding a step that calls `gh issue comment` and `gh issue close` is straightforward.

**Primary recommendation:** Implement as two deliverables: (1) `.claude/commands/gsd-custom/ingest-issues.md` — the interactive batch skill, and (2) a new `post-release-comments` step in `.github/workflows/release.yml` that runs a Node.js script (`scripts/post-release-comments.cjs`) to scan done TODOs and close/comment on issues and PRs. Tests extend `test/workflows.test.cjs` to verify the release.yml step exists.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `gh` CLI | Installed (verified) | All GitHub API interaction — issue listing, commenting, closing, label management, PR commenting | Established pattern across all Donna/GSD workflows; no raw API calls |
| Node.js CJS | 24 (from release.yml) | Release-time script (`post-release-comments.cjs`) | Project uses Node 24 in CI; all scripts are `.cjs` |
| node:test + node:assert/strict | Built-in | Test framework | Already used in all `test/*.test.cjs` files |
| node:fs | Built-in | Scan `.planning/todos/done/` for frontmatter | Already used in installer and scripts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Biome | Existing | Linting (`npm run lint:fix`) | Must run before any commit — CI validates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `gh` CLI in release step | GitHub Actions `octokit/request-action` | `gh` is already present in the environment and used in release.yml; no new action needed |
| Node.js script for release step | Bash inline in release.yml | Node.js handles YAML frontmatter parsing (manual string search) more reliably; consistent with project's `scripts/*.cjs` pattern |

**Installation:** No new npm packages needed.

## Architecture Patterns

### Recommended Project Structure
```
.claude/commands/gsd-custom/
└── ingest-issues.md       # New gsd-custom: skill (interactive batch ingestion)

scripts/
└── post-release-comments.cjs   # New release-time script (Node.js)

.github/workflows/
└── release.yml            # Add one new step: post-release-comments

test/
└── workflows.test.cjs     # Add describe block for release.yml post-release-comments step
```

### Pattern 1: gsd-custom: Skill File
**What:** A `gsd-custom:` skill is a markdown command file placed directly in the project's `.claude/commands/gsd-custom/` directory. It is NOT installed via the Donna installer and NOT registered in `src/installer.cjs`. It appears as `/gsd-custom:<name>` in Claude Code.

**When to use:** Project-local developer tooling that is not part of the Donna product.

**Example (from existing `start-execution.md`):**
```markdown
---
name: gsd-custom:ingest-issues
description: Ingest open GitHub issues into GSD as TODOs
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
...
</objective>

<process>
<step name="check-gh-auth">...</step>
<step name="ensure-labels">...</step>
<step name="list-issues">...</step>
<step name="process-issues">...</step>
</process>
```

Note: Unlike Donna skills, `gsd-custom:` skills do NOT use `@~/.donna/workflows/` references — the workflow logic lives inline in the command file itself. This is the pattern used by `start-execution.md` and `finish-execution.md`.

### Pattern 2: TODO File Format with github_issue Provenance
**What:** Ingested TODOs are standard GSD TODO files with an added `github_issue` frontmatter field.

**Standard GSD TODO frontmatter (from `add-todo` workflow):**
```markdown
---
created: [ISO timestamp]
title: [title]
area: [area]
files:
  - [file:lines]
---

## Problem
[description]

## Solution
[approach or TBD]
```

**Extended format for ingested TODOs (D-04):**
```markdown
---
created: [ISO timestamp]
title: [title] (ref: #<issue_number>)
area: [inferred area]
github_issue: <issue_number>
files: []
---

## Problem
[issue description, summarised from title + body]

## Solution
[from issue body, or TBD]
```

The `(ref: #<number>)` appears in the `title` field for human readability when scanning STATE.md. The `github_issue` field is the machine-readable provenance key used by the release-time script.

**File naming:** `<date>-<slug>.md` using the same slug generation as `gsd-tools.cjs generate-slug`.

### Pattern 3: Ingestion Skill Step Structure
**What:** The batch ingestion skill processes each open issue without the `ingested` label in a loop.

**Recommended step order:**
```
check-gh-auth         → verify gh CLI is authenticated
ensure-labels         → create ingested / not-for-ingestion if missing
list-issues           → gh issue list --label !ingested --label !not-for-ingestion
read-pending-todos    → load all .planning/todos/pending/ for duplicate check
process-issues        → for each issue: classify → deduplicate → create TODOs → comment → label
print-summary         → report how many issues processed, TODOs created, skipped
```

The `process-issues` step is the main loop. For each issue:
1. Read issue title, body, comments via `gh issue view <number> --json title,body,comments`
2. Classify: bug / feature / neither (Claude reasoning)
3. If neither → apply `not-for-ingestion` label → skip
4. If unclear → AskUserQuestion inline (D-01)
5. Semantic duplicate check against pending TODOs (D-02) → AskUserQuestion if match found
6. Split into 1+ TODOs (D-03), write each with `github_issue` frontmatter (D-04)
7. `gh issue comment <number> --body "..."` (D-07)
8. `gh issue label add <number> ingested` via `gh issue edit <number> --add-label ingested`

### Pattern 4: Release-Time Script
**What:** `scripts/post-release-comments.cjs` — runs as a step in `release.yml` after `gh release create`.

**Inputs available in release.yml context:**
- `steps.bump.outputs.new_version` — the new version string (e.g., `0.9.0`)
- Git history since previous tag

**Script logic:**
```
1. Scan .planning/todos/done/*.md for github_issue frontmatter
2. Group done TODOs by issue number
3. For each issue:
   a. gh issue view <n> --json state → check if already closed
   b. If open: post comment "Resolved in v<version>" then close with --reason completed
4. Find PRs merged since previous tag:
   a. git log <prev_tag>..HEAD --merges → extract merge commits
   b. gh api to find PR numbers for those commits
   c. gh pr comment <n> --body "Released in v<version>"
```

**release.yml step to add (after "Create GitHub release"):**
```yaml
- name: Post release comments and close resolved issues
  env:
    GH_TOKEN: ${{ secrets.RELEASE_PAT }}
  run: node scripts/post-release-comments.cjs ${{ steps.bump.outputs.new_version }}
```

### Pattern 5: Label Management
**What:** Labels `ingested` and `not-for-ingestion` already exist on the repo (confirmed via `gh label list`). D-06 says to auto-create if missing — the ensure-labels step should be a no-op in practice but defensive.

**gh label create command:**
```bash
gh label create "ingested" --description "Shows that this issue has been ingested into GSD" --color "1b157c" --repo pingvinen/donna 2>/dev/null || true
gh label create "not-for-ingestion" --description "This does not appear to be something that we should attempt to ingest into GSD" --color "25b3f7" --repo pingvinen/donna 2>/dev/null || true
```

The `|| true` prevents failure if the label already exists.

**Applying a label:**
```bash
gh issue edit <number> --add-label "ingested" --repo pingvinen/donna
```

### Pattern 6: gh Issue Close Semantics (D-10)
**Verified from `gh issue close --help`:**
```bash
# Close as completed (all TODOs done)
gh issue close <number> --reason "completed" --comment "Resolved in v<version>" --repo pingvinen/donna

# Close as not planned (explicitly rejected)
gh issue close <number> --reason "not planned" --comment "Not planned for implementation" --repo pingvinen/donna

# Close as duplicate
gh issue close <number> --reason "duplicate" --comment "Duplicate of ..." --repo pingvinen/donna
```

The `--comment` flag adds the comment and closes atomically. For the release-time flow (D-11), use `--comment "Resolved in v<version>"` combined with `--reason "completed"` in one call.

### Anti-Patterns to Avoid
- **Installing the skill via `src/installer.cjs`:** D-13 is explicit — this is NOT a Donna product skill. Do not touch the installer, stubs directory, or installer test expectations.
- **Using `@~/.donna/workflows/` pattern:** `gsd-custom:` skills inline their logic directly; they are not installed to `~/.donna/`.
- **Git commits from the skill:** CLAUDE.md prohibits git commits from subagents. The skill creates TODO files but git commits are made by the developer in the main conversation after the skill runs (or the skill can stage files but leave commit to developer).
- **Raw GitHub API calls:** Project convention is `gh` CLI only, not `curl` to api.github.com.
- **Closing issues before posting the comment:** The `--comment` flag on `gh issue close` handles both atomically. Don't post comment then close in two separate calls.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub issue listing | Custom REST calls | `gh issue list --json number,title,body,labels --limit 100` | Already established in `contribute-idea.md`; handles auth, pagination |
| Semantic duplicate detection | Substring matching | Claude reasoning over issue title vs todo titles | Substring matching produces false positives; Claude handles synonyms, rephrasing |
| Frontmatter parsing in release script | Custom YAML parser | String search for `github_issue:` line | No YAML npm dep available in CI; simple line scan is reliable for this known format |
| Label existence check | `gh api` to list labels | `gh label create ... || true` | Simpler; idempotent; fails gracefully if already exists |
| PR-to-commit mapping for release comments | Custom git parsing | `gh api repos/pingvinen/donna/commits/<sha>/pulls` | GitHub API maps commits to PRs directly; more reliable than parsing merge commits |

**Key insight:** Both deliverables are thin wrappers around `gh` CLI. Resist the urge to build abstractions — each `gh` invocation is a single Bash step.

## Common Pitfalls

### Pitfall 1: Duplicate Labels Breaking the Skill
**What goes wrong:** `gh label create` fails with exit code 1 if the label already exists, aborting the entire skill.
**Why it happens:** Labels `ingested` and `not-for-ingestion` already exist on the repo.
**How to avoid:** Always append `|| true` or `2>/dev/null || true` to label create commands.
**Warning signs:** Skill aborts immediately with "Label already exists" on first run.

### Pitfall 2: Issues Without the ingested Label Appearing in Multiple Runs
**What goes wrong:** An issue is processed (TODOs created) but the label is not applied, causing re-processing on the next run.
**Why it happens:** The label apply step is skipped on error or placed incorrectly in the flow.
**How to avoid:** Apply the `ingested` label as the LAST step for each issue — after TODOs are written and comment is posted. This ensures atomicity: if anything fails before the label is applied, the issue will be retried next run.
**Warning signs:** Duplicate TODOs appear in `.planning/todos/pending/`.

### Pitfall 3: github_issue Field Not Scanned by Release Script
**What goes wrong:** The release script finds no TODOs to process even when done TODOs with issue provenance exist.
**Why it happens:** Frontmatter field name mismatch (e.g., `github_issue_number` vs `github_issue`).
**How to avoid:** Use exactly `github_issue:` (singular, no suffix) in both the ingestion skill and the release script. Document the canonical field name.
**Warning signs:** Release script reports "0 issues to close" even after ingesting issues and completing their TODOs.

### Pitfall 4: Release Script Not Finding Done TODOs
**What goes wrong:** The release script runs but skips todos that were completed before this phase shipped.
**Why it happens:** Done TODOs created before Phase 4 don't have the `github_issue` field.
**How to avoid:** This is expected and correct — only TODOs created by the ingestion skill will have `github_issue` frontmatter. The script should simply skip TODOs without this field. Document this clearly.
**Warning signs:** Script errors on missing field instead of gracefully skipping.

### Pitfall 5: Release Script Fails When No Done TODOs Have github_issue
**What goes wrong:** The release script fails on the first release after Phase 4 ships because no ingested TODOs have been completed yet.
**Why it happens:** Script assumes at least one matching todo exists.
**How to avoid:** Script must handle the case where no matching todos are found gracefully (exit 0, print "No issue-linked TODOs found in done/").
**Warning signs:** Release workflow fails on the post-release-comments step.

### Pitfall 6: Comment + Close Race in release.yml
**What goes wrong:** The release script tries to close an issue that was already closed manually.
**Why it happens:** Developer closed the issue before the release ran.
**How to avoid:** In the release script, check `gh issue view <n> --json state --jq '.state'` before commenting/closing. If already `CLOSED`, skip.
**Warning signs:** `gh issue close` exits non-zero with "already closed" error.

### Pitfall 7: Skill Attempts Git Commits
**What goes wrong:** Skill tries to run `git commit` to commit the new TODO files, which hangs due to 1Password SSH signing requiring interactive approval (CLAUDE.md constraint).
**Why it happens:** Developer adds a git commit step as a convenience.
**How to avoid:** The ingestion skill MUST NOT run `git commit`. It writes TODO files with Write tool and stages them with `git add`, but leaves committing to the developer in the main conversation. Print a reminder at the end: "TODO files staged — run git commit to save."
**Warning signs:** Skill hangs indefinitely with no output.

## Code Examples

Verified patterns from existing sources:

### List Open Issues Without ingested Label
```bash
# Source: workflows/contribute-idea.md pattern + gh documentation
gh issue list --repo pingvinen/donna --state open --json number,title,body,labels --limit 100
```

To filter issues that don't have the `ingested` label, filter in Claude reasoning over the JSON output (label filtering with `!ingested` is not directly supported by `gh issue list --label`).

### Read Full Issue Content
```bash
# Source: gh issue view --help (verified)
gh issue view <number> --repo pingvinen/donna --json number,title,body,comments,labels
```

### Apply Label to Issue
```bash
# Source: gh issue edit --help (verified)
gh issue edit <number> --add-label "ingested" --repo pingvinen/donna
```

### Post Comment on Issue
```bash
# Source: workflows/contribute-idea.md pattern + gh documentation
gh issue comment <number> --repo pingvinen/donna --body "Ingested into GSD:\n- TODO title 1\n- TODO title 2"
```

### Close Issue with Reason and Comment
```bash
# Source: gh issue close --help (verified — confirmed --reason and --comment flags exist)
gh issue close <number> --repo pingvinen/donna --reason "completed" --comment "Resolved in v0.9.0"
```

### TODO File with github_issue Provenance (D-04)
```markdown
---
created: 2026-03-26T19:00:00.000Z
title: Add ASCII art branding to Donna's output banners (ref: #13)
area: general
github_issue: 13
files: []
---

## Problem

Output banners across Donna skills (begin-the-day, run-tools, etc.) use plain text headers like `══════════`. Adding ASCII art branding would make the output more recognizable.

## Solution

Design ASCII art header and integrate into each skill's print step. (ref: #13)
```

### Release Script: Scan Done TODOs for Provenance
```javascript
// Source: pattern from existing scripts/*.cjs style
const fs = require('node:fs');
const path = require('node:path');

const donePath = path.join(process.cwd(), '.planning', 'todos', 'done');

function getIssueNumber(content) {
    const match = content.match(/^github_issue:\s*(\d+)/m);
    return match ? parseInt(match[1], 10) : null;
}

const files = fs.readdirSync(donePath).filter(f => f.endsWith('.md'));
const byIssue = {};

for (const file of files) {
    const content = fs.readFileSync(path.join(donePath, file), 'utf8');
    const issueNum = getIssueNumber(content);
    if (issueNum) {
        if (!byIssue[issueNum]) byIssue[issueNum] = [];
        byIssue[issueNum].push(file);
    }
}
// byIssue: { 13: ['2026-03-26-add-ascii-art.md'], 21: [...], ... }
```

### release.yml Step Placement
```yaml
# After the existing "Create GitHub release" step
- name: Post release comments and close resolved issues
  env:
    GH_TOKEN: ${{ secrets.RELEASE_PAT }}
  run: node scripts/post-release-comments.cjs ${{ steps.bump.outputs.new_version }}
```

The `RELEASE_PAT` already has `contents: write` and is used for `gh release create` — it will also have permission to comment on issues and close them (it authenticates as the repo admin).

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | Issue listing, commenting, closing, label management | Verified (used in existing workflows) | — | None — no fallback; project requires gh |
| `ingested` label | Label apply step | Verified (confirmed via `gh label list`) | — | Auto-created by ensure-labels step (D-06) |
| `not-for-ingestion` label | Classification skip step | Verified (confirmed via `gh label list`) | — | Auto-created by ensure-labels step (D-06) |
| `RELEASE_PAT` secret | release.yml new step | Existing (used in all other release steps) | — | None — already required for release |
| Node.js 24 | `post-release-comments.cjs` in CI | Available in CI (release.yml uses node-version: '24') | 24 | — |

**Missing dependencies with no fallback:** None.

**Missing dependencies with fallback:** None — all dependencies are present.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in Node.js test runner) |
| Config file | none — invoked via `node --test 'test/*.test.cjs'` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INGEST-01 | `gsd-custom:ingest-issues` skill file exists at `.claude/commands/gsd-custom/ingest-issues.md` | unit | `npm test` | ❌ Wave 0 |
| INGEST-01 | Skill file has valid YAML frontmatter with `name: gsd-custom:ingest-issues` | unit | `npm test` | ❌ Wave 0 |
| INGEST-02 | `scripts/post-release-comments.cjs` script exists | unit | `npm test` | ❌ Wave 0 |
| INGEST-03 | `release.yml` contains `post-release-comments` step | unit | `npm test` | ❌ Wave 0 |
| INGEST-03 | `release.yml` `post-release-comments` step uses `RELEASE_PAT` | unit | `npm test` | ❌ Wave 0 |
| INGEST-04 | `post-release-comments.cjs` handles empty done/ directory gracefully (no crash) | unit | `npm test` | ❌ Wave 0 |
| INGEST-05 | `post-release-comments.cjs` correctly parses `github_issue:` frontmatter field | unit | `npm test` | ❌ Wave 0 |
| INGEST-06–15 | Ingestion skill logic (classification, dedup, TODO creation, labeling) | manual-only | n/a — requires running Claude Code session + real GitHub repo | n/a |

Note on manual-only: The `gsd-custom:` skill is a markdown workflow consumed by Claude Code at runtime. Its logic (classification, AskUserQuestion flows, gh CLI calls) cannot be unit-tested in isolation — it requires an active Claude Code session with `gh` auth.

### Sampling Rate
- **Per task commit:** `npm test` (< 5 seconds)
- **Per wave merge:** `npm test && npm run lint`
- **Phase gate:** Full suite green + `npm run lint:fix` clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/stubs.test.cjs` (or new `test/gsd-custom.test.cjs`) — add `describe` blocks for `ingest-issues` skill file existence and frontmatter
- [ ] `test/workflows.test.cjs` — add assertions for `post-release-comments` step in `release.yml`
- [ ] `test/scripts.test.cjs` (new, or add to existing) — unit tests for `post-release-comments.cjs` frontmatter parsing and empty-dir handling

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual issue triage | Automated ingestion via `gsd-custom:` skill | Phase 4 | Issues flow directly into planning system |
| PRs closed with no version reference | Release step comments on merged PRs with version | Phase 4 (D-12, folded from TODO) | Contributors notified when their PRs ship |
| Issues closed without version reference | Release step closes with "Resolved in vX.Y.Z" | Phase 4 | Traceable issue closure |

**No deprecated patterns** introduced by this phase — it adds new files only.

## Open Questions

1. **Where to test the ingest-issues skill file?**
   - What we know: `test/stubs.test.cjs` tests Donna skill stubs. `gsd-custom:` skills are a different namespace.
   - What's unclear: Whether to extend `stubs.test.cjs` with a gsd-custom section or create `test/gsd-custom.test.cjs`.
   - Recommendation: Create `test/gsd-custom.test.cjs` for clarity — it tests project-local developer tooling, not the installed Donna product.

2. **How to find PRs merged since previous tag for release-time PR commenting (D-12)?**
   - What we know: `gh pr list --state merged` can filter by date. The previous tag commit is known from `git describe --abbrev=0 --tags HEAD^`.
   - What's unclear: Whether to use `git log <prev_tag>..HEAD --merges` + per-commit `gh api` calls, or `gh pr list --search "merged:>YYYY-MM-DD"`.
   - Recommendation: Use `gh pr list --state merged --limit 100 --json number,mergedAt` and filter by date since previous tag's commit date — simpler than per-commit API calls, no risk of missing PRs.

3. **Should the ingestion skill commit the TODO files?**
   - What we know: CLAUDE.md prohibits git commits from subagents/skills due to 1Password SSH signing. The skill runs in a Claude Code session (main context), so technically commits are possible — but the constraint exists for all skills.
   - What's unclear: Whether the skill is run in main context or spawns Task agents for issue processing.
   - Recommendation: Follow the same pattern as other gsd-custom skills — the skill stages files (`git add`) and prints a reminder to commit manually. Do NOT auto-commit from the skill.

## Sources

### Primary (HIGH confidence)
- `.claude/commands/gsd-custom/start-execution.md`, `finish-execution.md` — gsd-custom: skill file format and inline workflow pattern — direct source inspection
- `.claude/settings.local.json` — confirmed gsd-custom: namespace is already registered and active
- `gh issue close --help` — confirmed `--reason` flag with `completed|not planned|duplicate` values, `--comment` flag
- `gh issue comment --help`, `gh issue edit --help`, `gh label create --help` — all confirmed available
- `gh label list --repo pingvinen/donna` — confirmed both labels already exist with correct names
- `.github/workflows/release.yml` — confirmed RELEASE_PAT usage, contents:write permission, node-version: '24', step structure
- `.planning/todos/pending/*.md` — confirmed standard frontmatter format (no github_issue field yet)
- `test/stubs.test.cjs`, `test/workflows.test.cjs` — confirmed test patterns for file existence and workflow content checks
- `CLAUDE.md` — SSH signing constraint, lint requirement, README update requirement

### Secondary (MEDIUM confidence)
- `workflows/contribute-idea.md` — GitHub CLI interaction patterns (gh issue list, gh issue create) — direct inspection
- `scripts/determine-bump.cjs` — established Node.js CJS script pattern for CI — direct inspection
- `gh issue list --repo pingvinen/donna` — confirmed 10 open issues without ingested label exist, ready for ingestion

### Tertiary (LOW confidence)
- None — all findings verified against source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; gh CLI and Node.js built-ins only
- Architecture: HIGH — patterns sourced directly from existing gsd-custom: skills and project conventions
- Pitfalls: HIGH — derived from code analysis, gh CLI documentation, and CLAUDE.md constraints
- Validation: HIGH — test framework and existing test structure inspected directly

**Research date:** 2026-03-26
**Valid until:** 2026-06-26 (stable domain — gh CLI flags and project conventions are durable)
