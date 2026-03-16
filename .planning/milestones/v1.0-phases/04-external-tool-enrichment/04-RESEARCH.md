# Phase 4: External Tool Enrichment - Research

**Researched:** 2026-03-15
**Domain:** CLI tool registry, external data pulling, workflow integration, tools.md standing file
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- Capabilities map stored in tools.md — what the tool CAN DO for Donna (e.g. "gh — can list assigned PRs, show review requests, list issues"), not a full CLI reference
- Training data as baseline for well-known tools (gh, jira, kubectl), augmented by CLI help parsing only when the installed version is newer than what Claude was trained on
- Version stored at learn time; relearn compares stored version vs `tool --version` output
- Single tools.md file with sections per tool (consistent with role.md, recurring.md pattern)
- Minimum input for add-tool: just the tool name (e.g. "gh"). Claude resolves the CLI command, verifies installation (`which`), learns capabilities
- Pre-fill from set-role notes: if set-role noted tools (e.g. "Jira (sprint management)"), add-tool recognizes them and pre-fills context, skipping redundant questions
- User selects relevant capabilities from a pre-filled list (sensible defaults checked) with option for write-ins
- Batch mode: if set-role noted multiple tools, add-tool offers to configure all noted tools in one session
- Verification during add-tool: run `which <command>`, `<command> --version`, and a simple auth test query. Warn if not installed but allow saving
- Auth validation at add time (e.g. `gh api user`) — catch auth problems early with clear fix instructions
- Tool tasks appear in a single "## From Tools" section in the daily file, below manual tasks
- Each task tagged with source: `- [ ] Review PR #42 [gh](https://github.com/...)`
- Always include clickable URL when the tool provides an external ID (PR number, ticket ID)
- Sensible defaults per tool for what data to pull, but user selects from a pre-filled capabilities list during add-tool
- Tool-sourced tasks are living data with two refresh mechanisms: begin-the-day always refreshes; donna:refresh-tools for mid-day updates
- Smart merge on refresh: tool says done → auto-mark [x] with reason; user manually checked [x] but tool says open → keep [x]; tool removed task → move to "## Resolved" section; new tasks → add to "## From Tools"
- Skip and warn on failure: if a tool fails during daily brief, skip it with a warning line, continue with other tools
- No retry — fail fast per tool, don't delay the brief
- When no tools are configured, begin-the-day works exactly as before with no errors or degradation
- Tool failures never block manual tasks, carry-forward, or recurring task processing

### Claude's Discretion

- Exact capabilities map format within tools.md
- How training data version comparison works (heuristic is fine)
- CLI help parsing strategy for unknown tools
- Refresh-tools workflow internals
- How auth test queries are selected per tool type
- Smart merge implementation details

### Deferred Ideas (OUT OF SCOPE)

- Standing files subfolder (already completed in Phase 03.1)
- Automatic tool refresh on schedule (cron/hook — pull-model constraint)
- Auto-relearn tools during begin-the-day

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| TOOL-01 | User can run `/donna:add-tool` to declare a new tool via interactive prompts, after which Claude learns the tool by reading its help output and stores knowledge in `tools.md` | add-tool workflow pattern, tools.md format, capability selection via AskUserQuestion, verification via Bash (which/version/auth) |
| TOOL-02 | When adding a tool Claude already knows well, the learning step is skipped and knowledge is synthesized from training data instead | Known-tool detection heuristic, training-data baseline for gh/jira/kubectl, version comparison logic |
| TOOL-03 | User can run `/donna:relearn-tools` to re-run the learning process for tools whose installed version has changed since last learned; tools at the same version are skipped | Version comparison via `tool --version`, stored version in tools.md YAML frontmatter, selective re-learn loop |
| DAILY-03 | `begin-the-day` optionally pulls data from configured tools; gracefully skipped if not configured | New step in begin-the-day.md after recurring tasks, graceful no-op when tools.md absent, failure isolation per tool |

</phase_requirements>

## Summary

Phase 4 delivers three new skills (add-tool, relearn-tools, refresh-tools) and extends begin-the-day with external data pulling. The architecture is purely additive — new workflow files, new stubs, a new tools.md standing file, and a new step inserted into begin-the-day.md between check-recurring and write-daily-file. All existing patterns from the codebase (stub/workflow split, AskUserQuestion interactive flows, Bash verification, git commit on write) apply directly.

The Jira CLI ecosystem is fragmented: three serious options exist — ankitpokhrel/jira-cli (binary: `jira`, developer-focused), Appfire Jira CLI (Java-based, marketplace product), and Atlassian's official ACLI. The add-tool design handles this correctly: it asks the user for the CLI command name (defaulting to `jira` for jira-cli), so Donna is agnostic to which implementation is installed. The key commands for each well-known tool are well-documented and stable.

The smart merge in refresh-tools is the most complex logic in this phase. It requires three-way reasoning: tool state (open/closed via CLI query), Donna file state (open/closed checkbox), and user's local intent (manually checked items win). The failure-isolation model is simple — wrap each tool's data-pull in a try/catch pattern using Bash exit codes, collect warnings, continue.

**Primary recommendation:** Build add-tool first (it creates tools.md and establishes the data schema), then extend begin-the-day (read tools.md + pull data), then build relearn-tools (reads tools.md versions, selectively re-learns), then build refresh-tools (standalone smart-merge step).

## Standard Stack

### Core
| Component | Version/Details | Purpose | Why Standard |
|-----------|----------------|---------|--------------|
| Node.js test runner | Built-in (`node:test`) | Test harness for new stubs/installer assertions | Already in use across all test files |
| Bash (workflow steps) | macOS zsh/bash | CLI verification (`which`, `--version`, auth tests) | All existing workflows use Bash steps |
| YAML frontmatter | Plain markdown | tools.md standing file storage | Consistent with role.md, recurring.md, config.md |
| AskUserQuestion | Claude Code tool | Interactive capability selection in add-tool | Used in add-task, done, set-role |

### Supporting
| Component | Version/Details | Purpose | When to Use |
|-----------|----------------|---------|-------------|
| `gh` (GitHub CLI) | v2.x | First-class supported external tool | Assigned PRs, review requests, issue listing |
| `jira` (ankitpokhrel/jira-cli) | v1.x | First-class supported external tool | Sprint issues, assigned tickets |
| `<tool> --help` parsing | Any CLI | Capability discovery for unknown tools | When installed version > training knowledge |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ankitpokhrel/jira-cli (`jira`) | Appfire Jira CLI (Java) | Appfire requires Java + marketplace subscription; jira-cli is free, Go binary, developer-targeted |
| Training data baseline | Always parse --help | Parsing is fragile and unnecessary for well-known tools; baseline + version delta is more reliable |
| Per-tool failure stop | Skip and warn | Skip-and-warn keeps the brief useful even when one tool has auth problems |

## Architecture Patterns

### Recommended File Structure

New files to create:
```
workflows/
├── add-tool.md          # New: interactive tool declaration workflow
├── relearn-tools.md     # New: version-aware re-learning workflow
├── refresh-tools.md     # New: standalone mid-day tool data refresh
stubs/claude-code/donna/
├── add-tool.md          # New: stub referencing ~/.donna/workflows/add-tool.md
├── relearn-tools.md     # New: stub referencing ~/.donna/workflows/relearn-tools.md
├── refresh-tools.md     # New: stub referencing ~/.donna/workflows/refresh-tools.md
```

Modified files:
```
workflows/begin-the-day.md   # New step: pull-tool-data (after check-recurring, before deduplicate)
workflows/done.md            # Update fuzzy-match to handle [tool-tag] and (merged) suffixes
src/installer.cjs            # Add new skill names to success message
test/stubs.test.cjs          # Add test cases for 3 new stubs + updated done.md
```

New standing file (created by add-tool, read by begin-the-day and relearn-tools):
```
<storage_repo>/donna/tools.md
```

### Pattern 1: tools.md Standing File Format

**What:** Single file, YAML frontmatter for file metadata, sections per tool.
**When to use:** Created by add-tool; read by begin-the-day, relearn-tools, refresh-tools.

```markdown
---
# tools.md — managed by donna:add-tool
---

## gh

- command: gh
- version: 2.63.0
- learned: 2026-03-15
- auth_test: gh api user

### Capabilities
- list-assigned-prs: gh search prs --assignee=@me --state=open --json number,title,url
- list-review-requests: gh search prs --review-requested=@me --state=open --json number,title,url

## jira

- command: jira
- version: 1.5.2
- learned: 2026-03-15
- auth_test: jira me

### Capabilities
- list-sprint-issues: jira sprint list --current -a$(jira me) --plain
```

**Note:** The exact capabilities map format is Claude's discretion (locked decision). This is a recommended pattern consistent with how role.md and recurring.md are structured. Plain key: value under the section header, a Capabilities subsection with named commands and their CLI invocations.

### Pattern 2: add-tool Workflow Step Structure

**What:** Interactive tool declaration flow with verification and capability selection.
**When to use:** All three new workflows follow this type of step structure.

Steps:
1. `read-config` — same pattern as all other workflows (read ~/.config/donna/config.md)
2. `check-pending-migrations` — same character-for-character block as all other workflows
3. `detect-noted-tools` — read donna/role.md and donna/role-research.md to find "Noted: X" lines from set-role's approve-tools step
4. `ask-tool-name` — AskUserQuestion; if batch mode available, offer all noted tools at once
5. `verify-installation` — Bash: `which <command>`, `<command> --version`; warn if missing but allow saving
6. `auth-test` — Bash: run tool-specific auth test; warn on failure with fix instructions
7. `learn-capabilities` — synthesize from training data (known tools) or parse `<command> --help` (unknown); for known tools, compare stored version vs installed version
8. `select-capabilities` — AskUserQuestion with pre-filled list, sensible defaults checked, allow write-ins
9. `write-tools-md` — read existing tools.md (if any), upsert this tool's section, write back with Write tool
10. `git-commit` — same pattern as all other workflows

### Pattern 3: begin-the-day Tool Data Pull Step

**What:** New step inserted between check-recurring and deduplicate.
**When to use:** Every begin-the-day run.

```
<step name="pull-tool-data">
Read <storage_repo>/donna/tools.md with the Read tool.
If the file does not exist or has no tool sections, set <tool_tasks> to an empty list
and <tool_warnings> to an empty list. Continue.

For each tool section in tools.md:
  Run the tool's configured capability commands via Bash.
  On success: parse output into task entries with source tag and URL.
  On failure (non-zero exit, timeout, auth error): add warning line, continue next tool.
  Never retry.

Collect all task entries as <tool_tasks>.
Collect all warning messages as <tool_warnings>.
</step>
```

The `<tool_tasks>` list feeds into the deduplicate step with source tags preserved.
The `<tool_warnings>` are printed in the brief output.

### Pattern 4: Smart Merge for refresh-tools

**What:** Three-way merge of tool state, file state, and user intent.
**When to use:** refresh-tools workflow; also applied in begin-the-day's pull-tool-data step when today's file already has tool tasks.

Rules (in priority order):
1. User manually checked `[x]` on a tool-sourced task — user intent wins, keep `[x]` regardless of tool state
2. Tool reports item closed/merged/done AND Donna file shows `[ ]` — auto-mark `[x]` with parenthetical reason
3. Tool reports item removed entirely (reassigned away, deleted) — move line to `## Resolved` section with reason
4. Tool reports new item not in file — add to `## From Tools` section

Detection strategy: match tasks by their embedded URL (the `[gh](https://...)` or `[jira](https://...)` link), which is stable across renames.

### Anti-Patterns to Avoid

- **Blocking the brief on tool failure:** A timeout or auth error for one tool must never delay or abort the daily brief. Each tool's Bash call should use a timeout (e.g. `timeout 10s gh search prs ...`; exit code 124 = timeout).
- **Re-adding manually-completed tool tasks:** The deduplication step in begin-the-day already handles this for carried tasks; the pull-tool-data step must also check against `<existing_tasks>` using normalized URL matching.
- **Polluting the daily file when tools.md absent:** The pull-tool-data step must check for tools.md existence before doing anything. Absent file = silent skip, no output.
- **Writing tools.md without reading first:** add-tool and relearn-tools must read existing tools.md before writing, to upsert (not overwrite) individual tool sections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON output from gh | Custom text parsing | `gh search prs --json number,title,url` | gh has first-class JSON output; text parsing is fragile |
| Auth status check | Custom token validation | `gh auth status` / `gh api user` / `jira me` | Tools expose their own auth validation commands |
| CLI version parsing | Complex regex | `<command> --version \| head -1` then store raw string | Version comparison is a heuristic ("is it different?"); exact semver parsing not needed |
| Task URL matching | Title fuzzy match | Match by embedded URL in `[tool](url)` format | URLs are stable identifiers; titles change |
| Tool capability catalog | Dynamic --help parse for known tools | Training data synthesis for gh/jira/kubectl | Training data is accurate for well-known tools; --help parse is brittle and slow |

**Key insight:** The tools.md file stores the exact CLI invocations Donna should run. At data-pull time, the workflow just executes those stored commands verbatim — no re-interpretation needed.

## Common Pitfalls

### Pitfall 1: Jira CLI Command Name Collision
**What goes wrong:** The `jira` binary name is used by multiple tools (ankitpokhrel/jira-cli, custom scripts, Appfire's JCLI has a different invocation). If Donna hardcodes `jira` as the command, it may run the wrong tool.
**Why it happens:** The Jira CLI ecosystem is genuinely fragmented.
**How to avoid:** add-tool always asks for (or confirms) the CLI command name, defaulting to `jira` for a tool named "jira". The stored `command:` field in tools.md is the canonical invocation — never derive it from the tool name.
**Warning signs:** `which jira` returns a path outside /usr/local/bin or /opt/homebrew (might be a wrapper script).

### Pitfall 2: Tool Output in Interactive Mode
**What goes wrong:** Some CLI tools (including jira-cli) default to interactive/pager output that hangs when run from a non-TTY context (Claude's Bash step).
**Why it happens:** Tools detect TTY and switch to interactive mode. In a workflow Bash step, there is no TTY.
**How to avoid:** Use flags that force plain/table/JSON output. For jira-cli: `--plain` flag. For gh: `--json` flag. Document the required flags in tools.md capabilities entries.
**Warning signs:** Bash step hangs indefinitely; `timeout` wrapper returns exit code 124.

### Pitfall 3: begin-the-day Idempotency with Tool Tasks
**What goes wrong:** Running begin-the-day twice on the same day duplicates tool tasks in today's file because the pull-tool-data step adds them again.
**Why it happens:** The existing deduplicate step normalizes by stripping `(N times)` suffixes and lowercasing, but tool tasks have `[gh](url)` tags that the current normalization may not strip.
**How to avoid:** Normalization in the deduplicate step must also strip `[tool-name](url)` suffixes for comparison purposes. Document this in the deduplicate step logic.
**Warning signs:** Running begin-the-day twice creates duplicate `- [ ] Review PR #42` lines with and without the `[gh]` tag.

### Pitfall 4: done.md Fuzzy Match Breaking on Tool-Tagged Tasks
**What goes wrong:** `/donna:done Review PR #42` fails to match `- [ ] Review PR #42 [gh](https://github.com/...)` because the tag+URL suffix is present.
**Why it happens:** The done.md fuzzy-matching strips `(N times)` but not `[tool](url)` suffixes.
**How to avoid:** Update done.md's select-tasks step to also strip `[<word>](<url>)` suffixes before fuzzy matching. Keep the full line for file operations.
**Warning signs:** done.md says "no match" for tasks that visually appear on the list.

### Pitfall 5: Stale Tool Tasks in "## From Tools" After Smart Merge
**What goes wrong:** After refresh-tools runs, closed items appear in `## Resolved` with a reason, but old `## From Tools` section still shows them as open because the file write didn't remove them.
**Why it happens:** Smart merge adds to Resolved but forgot to remove from From Tools.
**How to avoid:** Smart merge is a read-modify-write: read the full file, collect all tool-sourced lines, classify each (keep open / mark closed / move to Resolved / remove), then write the entire file back with all sections updated atomically.

## Code Examples

Verified patterns from existing codebase and official sources:

### Stub Template for New Skills
```markdown
---
name: donna:add-tool
description: Declare an external CLI tool and teach Donna its capabilities
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna add-tool workflow.
</objective>

<execution_context>
@~/.donna/workflows/add-tool.md
</execution_context>
```

### Verification Bash Block (add-tool)
```bash
# Step 1: check installation
COMMAND="gh"
which "$COMMAND" && echo "INSTALLED=true" || echo "INSTALLED=false"

# Step 2: get version
"$COMMAND" --version 2>/dev/null | head -1
```

### Auth Test Bash Block (known tools)
```bash
# GitHub CLI auth test
gh api user --jq '.login' 2>&1
# Exit 0 + login name = authenticated
# Exit non-zero = not authenticated; message tells user to run: gh auth login

# jira-cli auth test
jira me 2>&1
# Exit 0 + user info = authenticated
# Exit non-zero = not authenticated; message tells user to run: jira init
```

### gh Data Pull Commands (verified from official docs)
```bash
# Assigned PRs (open)
gh search prs --assignee=@me --state=open --json number,title,url --limit 20

# Review requests (open)
gh search prs --review-requested=@me --state=open --json number,title,url --limit 20
```
Source: https://cli.github.com/manual/gh_search_prs

### jira-cli Data Pull Commands (verified from community sources)
```bash
# Current sprint issues assigned to me
jira sprint list --current -a$(jira me) --plain

# All issues assigned to me
jira issue list -a$(jira me) --plain
```
Source: ankitpokhrel/jira-cli README — MEDIUM confidence (rate-limited, could not fetch directly)

### Task Format in Daily File (from CONTEXT.md)
```markdown
## From Tools

- [ ] Review PR #42 [gh](https://github.com/org/repo/pull/42)
- [ ] Implement AUTH-07 [jira](https://company.atlassian.net/browse/AUTH-07)

## Resolved

- [x] Merge PR #38 [gh](https://github.com/org/repo/pull/38) (merged)
```

### begin-the-day Warning Line Format
```
! gh: authentication failed — run `gh auth login`
! jira: command not found — run `brew install jira-cli` then `jira init`
! gh: timed out after 10s — check network connectivity
```

### Installer Success Message Update Pattern
```javascript
// Current (src/installer.cjs line ~80):
output.success(
    `Copied donna skills (setup, add-task, done, set-role, begin-the-day) to ${provider.stubTarget}`,
);
// Updated to include Phase 4 skills:
output.success(
    `Copied donna skills (setup, add-task, done, set-role, begin-the-day, add-tool, relearn-tools, refresh-tools) to ${provider.stubTarget}`,
);
```

### check-pending-migrations Block
The character-for-character identical block used in begin-the-day.md, done.md, set-role.md must also appear verbatim in add-tool.md, relearn-tools.md, and refresh-tools.md.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded tool integrations | Registry-based (tools.md) | Phase 4 design decision | Any CLI tool can be added without code changes |
| Tool tasks absent from daily file | "## From Tools" section | Phase 4 | External data surfaces in morning ritual |
| No mid-day refresh | donna:refresh-tools skill | Phase 4 | User can update tool data without full begin-the-day |

**Deprecated/outdated:**
- set-role's approve-tools step message: currently says "available in a future update" — Phase 4 removes that caveat and add-tool becomes real

## Open Questions

1. **jira-cli --plain flag output format**
   - What we know: `--plain` disables interactive/pager mode; `jira sprint list --current -a$(jira me) --plain` is documented in community sources
   - What's unclear: exact column format of --plain output (whether it includes issue URLs or just keys)
   - Recommendation: During add-tool capability configuration, test-run the stored command and show the user the first 3 lines of output to confirm it looks right before saving

2. **gh search prs rate limits**
   - What we know: gh search uses GitHub's search API which has rate limits (30 requests/minute unauthenticated, higher authenticated)
   - What's unclear: whether repeated begin-the-day runs hit limits for users with many repos
   - Recommendation: Use `--limit 20` on all gh search calls; add a comment in the workflow that the limit is intentional

3. **tools.md migration for existing users**
   - What we know: tools.md is a new file; no existing users have it; tools.md lives at `<storage_repo>/donna/tools.md` (donna/ subfolder, Phase 03.1 completed)
   - What's unclear: whether a migration entry is needed
   - Recommendation: No migration needed — tools.md absence is handled gracefully ("if file does not exist, skip"). No migration entry required.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | none — invoked via `node --test 'test/*.test.cjs'` |
| Quick run command | `cd /Users/pingvinen/workspace/github/donna && npm test` |
| Full suite command | `cd /Users/pingvinen/workspace/github/donna && npm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TOOL-01 | add-tool stub exists with correct frontmatter and workflow reference | unit | `npm test` (stubs.test.cjs) | Wave 0 — needs new describe block in stubs.test.cjs |
| TOOL-01 | add-tool workflow exists and references tools.md | unit | `npm test` (stubs.test.cjs) | Wave 0 — needs new describe block in stubs.test.cjs |
| TOOL-02 | add-tool workflow contains known-tool training-data baseline logic | unit | `npm test` (stubs.test.cjs) | Wave 0 — content assertion in workflow describe block |
| TOOL-03 | relearn-tools stub exists with correct frontmatter | unit | `npm test` (stubs.test.cjs) | Wave 0 — needs new describe block in stubs.test.cjs |
| TOOL-03 | relearn-tools workflow contains version comparison logic | unit | `npm test` (stubs.test.cjs) | Wave 0 — content assertion in workflow describe block |
| DAILY-03 | begin-the-day workflow contains pull-tool-data step | unit | `npm test` (stubs.test.cjs) | Wave 0 — new assertion in existing begin-the-day describe |
| DAILY-03 | begin-the-day gracefully skips when tools.md absent | unit | `npm test` (stubs.test.cjs) | Wave 0 — content assertion for "does not exist" handling |
| cross-cut | installer success message includes add-tool, relearn-tools, refresh-tools | unit | `npm test` (stubs.test.cjs) | Wave 0 — extend installer describe block in stubs.test.cjs |
| cross-cut | done.md strips [tool](url) suffixes for fuzzy matching | unit | `npm test` (stubs.test.cjs) | Wave 0 — new assertion in cross-cutting done.md describe |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] New describe blocks in `test/stubs.test.cjs` for add-tool stub, add-tool workflow, relearn-tools stub, relearn-tools workflow, refresh-tools stub, refresh-tools workflow
- [ ] Extended assertions in existing begin-the-day describe block for pull-tool-data step
- [ ] Extended assertions in installer describe block for new skill names
- [ ] New assertion in cross-cutting done.md section for `[tool](url)` suffix stripping

## Sources

### Primary (HIGH confidence)
- Official GitHub CLI docs (https://cli.github.com/manual/gh_search_prs) — gh search prs flags, --json fields, --assignee, --review-requested
- Official GitHub CLI docs (https://cli.github.com/manual/gh_auth_status) — auth status checking
- Existing codebase (workflows/begin-the-day.md, workflows/done.md, workflows/set-role.md) — step structure patterns, migration guard, git commit pattern, output format
- Existing codebase (stubs/claude-code/donna/*.md) — stub format, allowed-tools declarations
- Existing codebase (src/installer.cjs) — installer success message pattern
- Existing codebase (test/stubs.test.cjs) — test assertion patterns for stubs and workflows

### Secondary (MEDIUM confidence)
- ankitpokhrel/jira-cli GitHub (https://github.com/ankitpokhrel/jira-cli) — binary name `jira`, `jira sprint list --current -a$(jira me)`, `jira me` auth test, `--plain` flag (rate-limited during research, could not fetch README directly)
- WebSearch results for jira-cli commands — consistent with community documentation
- WebSearch results for Jira CLI ecosystem landscape — Appfire, go-jira, ACLI options

### Tertiary (LOW confidence)
- Exact --plain output format for jira-cli sprint list — documented as non-interactive mode but exact column format unverified in this research session

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — existing codebase patterns are directly observable; gh CLI verified against official docs
- Architecture: HIGH — all patterns derived from existing codebase with minor extensions
- Pitfalls: HIGH for items 1-2 (well-known CLI behavior); MEDIUM for items 3-5 (derived from code analysis)
- Jira CLI specifics: MEDIUM — binary name and sprint commands verified via multiple community sources but README fetch was rate-limited

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (stable ecosystem; Jira CLI commands unlikely to change in 30 days)
