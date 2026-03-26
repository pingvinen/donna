# Phase 4: Ingest GitHub issues into GSD - Context

**Gathered:** 2026-03-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Internal developer tooling skill to ingest open GitHub issues (from pingvinen/donna) into GSD todos, plus a release-time GitHub Actions step that comments on resolved issues and merged PRs with version info. This is NOT a product feature shipped to Donna users — it's tooling for working on Donna itself.

</domain>

<decisions>
## Implementation Decisions

### Ingestion flow
- **D-01:** When an unclear issue is encountered, use AskUserQuestion to ask the developer inline — no need to post clarification comments on the issue since the developer is the primary audience
- **D-02:** Semantic match against all pending TODOs in `.planning/todos/pending/` to detect duplicates — if a match is found, ask the developer whether to skip or merge
- **D-03:** One issue can produce multiple TODOs — split issues describing several pieces of work into separate TODOs, each referencing the source issue
- **D-04:** TODO provenance uses both: `github_issue: <number>` field in YAML frontmatter (machine-readable for release-time flow) AND `(ref: #<number>)` inline mention (human-readable)

### Labeling & commenting
- **D-05:** Two labels managed: `ingested` (applied after successful processing) and `not-for-ingestion` (applied to non-bug/non-feature issues that are skipped)
- **D-06:** Auto-create missing labels on the repo using `gh label create` before processing
- **D-07:** Comment on ingested issues lists each TODO created, e.g. "Ingested into GSD:\n- TODO title 1\n- TODO title 2"

### Release-time closure
- **D-08:** Release-time logic hooks into the existing `release.yml` GitHub Actions workflow — not a separate skill invocation
- **D-09:** Detect completed work by scanning `.planning/todos/done/` files for `github_issue` frontmatter field
- **D-10:** Use appropriate GitHub close semantics: `completed` when all TODOs done, `not planned` if explicitly rejected, `duplicate` if closed as duplicate during ingestion
- **D-11:** Post a comment with the release version before closing (e.g. "Resolved in v0.9.0")
- **D-12:** Also comment on merged PRs with the version number (folded from pending TODO: "Comment on PRs after release with version number")

### Skill design
- **D-13:** GSD internal skill — lives in project config, not shipped via npm, not registered in the Donna installer
- **D-14:** Skill name uses `gsd-custom:` prefix (e.g. `gsd-custom:ingest-issues`)
- **D-15:** Batch mode — processes every open issue without `ingested` label in one invocation, asking inline only when unclear issues arise

### Claude's Discretion
- Comment formatting details (exact markdown structure)
- How to detect if an issue is a bug report vs feature request vs neither
- GSD TODO file naming convention alignment
- Release workflow step placement within release.yml

### Folded Todos
- **Comment on PRs after release with version number** (from `.planning/todos/pending/2026-03-14-comment-on-prs-after-release-with-version-number.md`) — folded into release-time closure as D-12

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Issue specification
- GitHub issue #21 (`gh issue view 21 --repo pingvinen/donna`) — Original specification for ingestion flow, classification rules, release-time closure semantics

### Existing GitHub interaction patterns
- `workflows/contribute-idea.md` — Established patterns for `gh issue list`, `gh issue create`, `gh api` usage
- `workflows/run-tools.md` line 226 — Pattern for checking PR/issue state via `gh pr view` / `gh issue view`

### CI/CD pipeline
- `.github/workflows/release.yml` — Release workflow where the release-time closure step will be added

### GSD todo system
- `.planning/todos/pending/` — Where ingested TODOs will be created (existing TODO file format)
- `.planning/todos/done/` — Where completed TODOs live (scanned during release-time closure)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/contribute-idea.md`: GitHub API interaction patterns (`gh issue list`, `gh api`, `gh issue create`) — reuse for issue listing and commenting
- `src/installer.cjs`: Skill registration pattern — NOT needed here since this is a GSD internal skill, not a Donna product skill
- GSD todo tooling (`gsd-tools.cjs`): TODO creation and management commands

### Established Patterns
- `gh` CLI for all GitHub API interactions (not raw REST calls)
- Stub-workflow architecture for skills (but this skill uses gsd-custom: pattern instead)
- AskUserQuestion for interactive decision points during workflow execution
- YAML frontmatter in markdown files for machine-readable metadata

### Integration Points
- `.github/workflows/release.yml` — new step added for release-time issue/PR commenting and closure
- `.planning/todos/pending/` — new TODO files created during ingestion
- `.planning/todos/done/` — scanned during release-time closure for provenance
- GSD custom skill registration (project-level `.claude/` config)

</code_context>

<specifics>
## Specific Ideas

- This is developer tooling for the Donna project, not a product feature — it should be simple and functional, not polished for end users
- The `pingvinen/donna` repo is hardcoded — no need for configurable repo targeting
- Issue #21 describes the full spec including the "totally buy a bar!" joke — the actual requirements are clearly laid out in that issue

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

### Reviewed Todos (not folded)
- **Check for new Donna version once per day** (score 0.6) — tooling concern but unrelated to issue ingestion
- **Evaluate natural language input as alternative to slash commands** (score 0.4) — general UX concern, not related to this phase

</deferred>

---

*Phase: 04-ingest-github-issues-into-gsd*
*Context gathered: 2026-03-26*
