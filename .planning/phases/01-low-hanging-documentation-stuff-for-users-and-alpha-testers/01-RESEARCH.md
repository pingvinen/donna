# Phase 1: Low-Hanging Documentation Stuff for Users and Alpha Testers - Research

**Researched:** 2026-03-16
**Domain:** Documentation, skill authoring, installer changelog, GitHub Issues integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**CONTRIBUTING.md**
- Create a CONTRIBUTING.md at the repo root
- Covers how a Donna developer can test changes locally (link stubs, run installer in dev mode, etc.)
- Separate from README — README is user-facing, CONTRIBUTING.md is developer-facing

**User-facing changelog**
- Changelog is shown during install/upgrade — the installer displays what's new when upgrading
- No separate CHANGELOG.md file needed (installer output is the delivery mechanism)
- Format should be compact and human-friendly — not raw git log, not verbose prose
- Group changes by category (new skills, fixes, improvements) with brief descriptions

**`/donna:help` skill**
- Conversational troubleshooting — have a conversation with the user about what they need help with, then try to help them fix the problem
- Not a static command reference — it's interactive and diagnostic
- Should be able to inspect Donna's state (config, storage repo, installed tools) to diagnose issues

**`/donna:contribute-idea` skill**
- Interactive skill that helps users submit feature ideas or feedback
- Checks TWO sources for duplicates before creating a new issue:
  1. Existing GitHub Issues in pingvinen/donna (via `gh`)
  2. GSD's pending todos — fetched from GitHub (`.planning/STATE.md` in pingvinen/donna) since the `.planning/` folder doesn't exist in the user's storage repo
- If duplicate found in either source: links to the existing issue or shows the matching todo
- If new: helps the user create (or helps create) a GitHub Issue on pingvinen/donna
- Replaces the original "generate pending TODOs file" idea — GitHub Issues is the right home for feedback

### Claude's Discretion
- Exact structure and sections of CONTRIBUTING.md
- How the installer detects "upgrading" vs "fresh install" for changelog display
- How `/donna:help` inspects state and formulates diagnostic questions
- How `/donna:contribute-idea` searches for duplicate issues (title match, keyword search, etc.)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 1 has four concrete deliverables: (1) `CONTRIBUTING.md` for developers, (2) a human-friendly upgrade changelog shown by the installer during upgrades, (3) a `/donna:help` skill for conversational troubleshooting, and (4) a `/donna:contribute-idea` skill for guided issue reporting. All deliverables involve either documentation authoring or adding a new Donna skill (stub + workflow pair), with one deliverable (changelog) modifying existing installer CJS code.

The project is mature. The skill pattern is established and well-understood: every skill is a stub file in `stubs/claude-code/donna/` (YAML frontmatter + XML-tagged prompt that points to the workflow via `@~/.donna/workflows/<name>.md`) plus a workflow file in `workflows/`. The installer uses `fs.cpSync` to install both to user machines. New skills need their filenames added to the stub copy operation in `src/installer.cjs` — currently the copy is done with `recursive: true` on the whole folder, so NO explicit per-file entries are needed in `installer.cjs` for stubs or workflows; the directory copy handles it automatically.

The changelog hook point already exists: `installer.cjs` already detects upgrades (line 51: `if (currentVersion && currentVersion !== packageVersion)`), calls `output.upgradeHeader()`, and then lists migration descriptions. The task is to add a richer changelog section between the upgrade header and the migration list — sourced from either a static embedded data structure or read from a file included in the package.

**Primary recommendation:** Build the four deliverables in dependency order: CONTRIBUTING.md (no dependencies) → installer changelog (modifies existing CJS) → `/donna:help` skill (new skill, no external deps) → `/donna:contribute-idea` skill (new skill, depends on `gh` CLI being authenticated).

---

## Standard Stack

### Core (already in project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js CJS modules | >=18 | Installer and tooling | Established project choice |
| `node:fs`, `node:path`, `node:os` | built-in | File system operations | No extra deps |
| `node:test` + `node:assert/strict` | built-in | Unit tests | Already used throughout test/ |
| `gh` CLI | user-installed | GitHub Issues interaction | Already used by contribute-idea design |
| Biome | ^1.9.0 | Linting/formatting | Already in devDependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@biomejs/biome` | ^1.9.0 | Code style enforcement | Run before committing CJS changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Embedded changelog data in installer | Separate `CHANGELOG.md` file | User decision was no separate changelog file |
| `gh issue create` (interactive) | `gh issue create --title --body` (scripted) | Skill controls the form — scripted is correct |

**Installation:** No new dependencies needed. All functionality is built on existing stack.

---

## Architecture Patterns

### Skill Structure (established pattern)

Every skill = stub + workflow.

**Stub** (`stubs/claude-code/donna/<name>.md`):
```markdown
---
name: donna:<name>
description: <one-line description>
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna <name> workflow.
</objective>

<execution_context>
@~/.donna/workflows/<name>.md
</execution_context>
```

**Workflow** (`workflows/<name>.md`):
```markdown
# Donna <Name> Workflow

<objective>
<single sentence describing goal>
</objective>

<step name="banner">
Print the Donna banner:
```
━━━ Donna ▸ <Name> ━━━
```
</step>

<step name="read-config">
Read `~/.config/donna/config.md`.
If the file does not exist, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract `storage_repo`, `daily_folder` (default: `daily`), and `auto_push` (default: false).
</step>

<!-- additional steps -->
```

### Installer: How New Skills Are Deployed

The installer copies the entire `stubs/claude-code/donna/` directory recursively to the provider's target:

```javascript
// src/installer.cjs line 77-81
fs.cpSync(provider.stubSource, provider.stubTarget, { recursive: true });
```

And all workflows:
```javascript
// src/installer.cjs line 91
fs.cpSync(workflowsSource, workflowsTarget, { recursive: true });
```

**Key insight:** Adding new `.md` files to `stubs/claude-code/donna/` and `workflows/` is sufficient — no changes to `installer.cjs` file lists are needed. The recursive copy handles it automatically.

### Installer: Upgrade Detection (existing)

```javascript
// src/installer.cjs lines 50-53
if (currentVersion && currentVersion !== packageVersion) {
    output.upgradeHeader(currentVersion, packageVersion);
}
```

`output.upgradeHeader(from, to)` prints: `  Upgrading 0.4.0 → 0.5.0:`

The changelog section should be added immediately after this call, before migrations run.

### Changelog Data Architecture

Two viable approaches (Claude's discretion):

**Option A: Embedded in installer (recommended for simplicity)**

Add a `CHANGELOG` constant in `installer.cjs` or a separate `src/changelog.cjs` module. Keyed by version string, each entry contains categorized changes. On upgrade, display changes for all versions between `currentVersion` and `packageVersion` (exclusive of current, inclusive of new).

```javascript
// src/changelog.cjs
const CHANGELOG = {
    "0.5.0": {
        "New skills": ["help — conversational troubleshooting", "contribute-idea — submit ideas and feedback"],
        "Improvements": ["Changelog now shown on upgrade"],
    },
};
```

**Option B: Static file bundled in package**

A `CHANGELOG.md` (or `references/changelog.md`) read by the installer at runtime. Simpler to edit but requires file I/O.

Option A is cleaner — no file path resolution needed, and all version data travels with the code.

### Changelog Display Format

Target aesthetic: like `brew upgrade` output — quick scan.

```
  Upgrading 0.4.0 → 0.5.0:

  What's new:
    New skills:
      + donna:help — conversational troubleshooting
      + donna:contribute-idea — submit ideas and feedback
    Improvements:
      · Changelog now shown on upgrade
```

Use `output.cjs` conventions: spaces for indentation, `+` for new, `·` for improvements, consistent with existing `✓` / `✗` prefix style.

### `/donna:help` Skill Pattern

Conversational diagnostic — not a reference document. The workflow should:

1. Print banner
2. Read `~/.config/donna/config.md` to check if configured
3. Use AskUserQuestion to ask "What do you need help with?"
4. Based on response, inspect relevant state:
   - Config issues → read `~/.config/donna/config.md`
   - Storage issues → check storage repo exists, `git -C <repo> status`
   - Tool issues → read `<storage_repo>/donna/tools.md`
   - Skill not working → check `~/.donna/workflows/` exists and has the skill file
5. Provide diagnostic output and next steps
6. AskUserQuestion: "Did that help, or do you want to submit a bug report?"
7. If bug report wanted → guide to `/donna:contribute-idea`

### `/donna:contribute-idea` Skill Pattern

Duplicate check requires two sources, fetched at runtime:

**Source 1: GitHub Issues**
```bash
gh issue list --repo pingvinen/donna --state open --json number,title,url --limit 100
```
Search titles for keyword overlap with user's idea.

**Source 2: GSD pending todos from STATE.md on GitHub**
```bash
# Fetch raw STATE.md from the donna repo's main branch
gh api repos/pingvinen/donna/contents/.planning/STATE.md --jq '.content' | base64 -d
```
Parse the `### Pending Todos` section from the decoded content.

This approach avoids assumptions about the user's local file system (the `.planning/` folder does not exist in user installations — it is only in the developer's repo).

After duplicate check:
- Duplicate found: show existing issue URL or todo text, suggest upvoting or commenting
- No duplicate: AskUserQuestion to gather title and description, then `gh issue create --repo pingvinen/donna --title "..." --body "..."`

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub API access | Custom HTTP requests | `gh` CLI | Already authenticated, JSON output, handles auth |
| GitHub Issues CRUD | REST calls | `gh issue list`, `gh issue create` | Simpler, handles pagination, respects auth |
| Fetching remote file | curl/wget | `gh api repos/.../contents/...` | Same auth context as issues, no separate token |
| Changelog versioning | Semver library | Simple string split `"0.5.0".split(".")` | Only need major/minor/patch integers for comparison |
| Interactive prompts in skills | Custom input loop | `AskUserQuestion` | Established pattern, works in Claude Code |

**Key insight:** `gh` CLI handles all GitHub interaction. Skills never make direct HTTP requests.

---

## Common Pitfalls

### Pitfall 1: Forgetting README Update When Adding Skills

**What goes wrong:** New skills added to stubs and workflows but not listed in README "All commands" table.

**Why it happens:** README and skill files are in different places; easy to overlook.

**How to avoid:** CLAUDE.md explicitly requires: "Update README.md whenever features are added, removed, or renamed." Add README update as a required step in the skill implementation plan.

**Warning signs:** Git diff shows new stub/workflow files but no README.md change.

---

### Pitfall 2: Changelog Version Range Logic

**What goes wrong:** Changelog shows changes for the wrong versions (e.g., shows all history on every upgrade, or misses entries).

**Why it happens:** Version comparison needs to be inclusive of the new version and exclusive of the current version. String comparison doesn't work for semver.

**How to avoid:** Compare versions numerically. Only show entries where `version > currentVersion` and `version <= packageVersion`. Use sorted keys from the CHANGELOG object.

**Warning signs:** On upgrading from 0.3.0 to 0.5.0, changes from 0.3.0 appear in the output (should be excluded).

---

### Pitfall 3: `gh` CLI Not Authenticated in User Context

**What goes wrong:** `/donna:contribute-idea` calls `gh issue list` but `gh` is not authenticated, causing a silent failure or confusing error.

**Why it happens:** `gh` requires `gh auth login` before use. Users who haven't set it up will hit this immediately.

**How to avoid:** Run an auth check early in the contribute-idea workflow:
```bash
gh auth status 2>&1
```
If it fails, print a helpful message: `✗ gh is not authenticated. Run 'gh auth login' first, then re-run this skill.` and stop gracefully.

**Warning signs:** `gh` exits non-zero on first real call.

---

### Pitfall 4: `base64 -d` vs `base64 --decode` on macOS

**What goes wrong:** `base64 -d` works on Linux (GNU coreutils) but macOS uses BSD base64 where the flag is `-D` (capital D) — or `-d` may work in newer macOS versions.

**Why it happens:** Platform differences between developer (macOS) and potential CI environments.

**How to avoid:** Use `base64 -D` on macOS or test with `base64 -d 2>/dev/null || base64 -D`. Better: use `gh api ... --jq '.content | @base64d'` which handles decoding inside jq itself, avoiding the platform issue entirely.

**Warning signs:** Workflow silently produces garbled output or empty string on macOS.

---

### Pitfall 5: Git Commit from Skill Workflows

**What goes wrong:** A new skill workflow tries to commit to git, but runs via a subagent context where SSH signing requires interactive 1Password unlock.

**Why it happens:** Muscle memory from writing other skills. `begin-the-day` and `add-task` commit — new developers copy the pattern without checking whether the new skill has storage writes.

**How to avoid:** `/donna:help` and `/donna:contribute-idea` are READ-ONLY skills — they inspect state but do not write to the storage repo. Do not add git commit steps to their workflows.

**Warning signs:** Workflow includes `git -C <storage_repo> commit` step.

---

### Pitfall 6: Changelog Missing from `package.json` `files` Array

**What goes wrong:** If changelog data is stored in a separate file, it won't be included in the npm package unless listed in `package.json`'s `files` field.

**Why it happens:** The `files` field is an allowlist; unlisted files are excluded from the published package.

**How to avoid:** Either embed changelog data in `src/changelog.cjs` (already covered by `"src/"` in files) or add any new data file path to the `files` array. Current `files` entries: `"bin/"`, `"src/"`, `"stubs/"`, `"workflows/"`, `"migrations/"`, `"templates/"`, `"references/"`.

**Warning signs:** `npm pack` output doesn't include the changelog data file.

---

## Code Examples

Verified patterns from existing source:

### Upgrade Detection Hook Point (installer.cjs)
```javascript
// Source: src/installer.cjs lines 50-56
if (currentVersion && currentVersion !== packageVersion) {
    output.upgradeHeader(currentVersion, packageVersion);
    // INSERT: display changelog here, between header and migrations
}

const results = migrator.runMigrations(migrationsDir, donnaDir, lastMigration);
```

### output.cjs Conventions
```javascript
// Source: src/output.cjs
output.success("message");   // "  ✓ message"
output.fail("message");      // "  ✗ message"
output.info("message");      // "  message"
output.upgradeHeader(from, to);  // "  Upgrading 0.4.0 → 0.5.0:"
```

### Stub Pattern (from stubs/claude-code/donna/setup.md)
```markdown
---
name: donna:setup
description: Set up Donna — configure storage repo, initialize file structure, create bootstrap config
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna setup workflow.
</objective>

<execution_context>
@~/.donna/workflows/setup.md
</execution_context>
```

### gh API: Fetch Remote File Content
```bash
# Fetch .planning/STATE.md from the donna repo on GitHub
# --jq '.content | @base64d' decodes base64 inline, avoids platform base64 issues
gh api repos/pingvinen/donna/contents/.planning/STATE.md --jq '.content | @base64d'
```

### gh: List and Create Issues
```bash
# List open issues as JSON
gh issue list --repo pingvinen/donna --state open --json number,title,url --limit 100

# Create an issue
gh issue create --repo pingvinen/donna --title "Feature: ..." --body "..."
```

### Version Comparison for Changelog Range
```javascript
// Compare semver strings without a library
function semverGt(a, b) {
    const pa = a.split(".").map(Number);
    const pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) {
        if (pa[i] > pb[i]) return true;
        if (pa[i] < pb[i]) return false;
    }
    return false;
}

// Show changelog entries for versions: currentVersion < v <= packageVersion
const versionsToShow = Object.keys(CHANGELOG)
    .filter(v => semverGt(v, currentVersion) && !semverGt(v, packageVersion))
    .sort(/* ascending */);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Migration descriptions as upgrade output | Migration descriptions + richer user-facing changelog | Phase 1 | Users see what actually changed in their workflow |
| No developer onboarding docs | CONTRIBUTING.md with local dev setup | Phase 1 | Reduces friction for contributors and for yourself returning after weeks away |

**Deprecated/outdated:**
- None — no existing patterns are being replaced, only extended.

---

## Open Questions

1. **Changelog storage location**
   - What we know: Option A (embedded in `src/changelog.cjs`) is simpler and has no file path issues
   - What's unclear: Whether the planner prefers the changelog data editable without touching installer.cjs (favor Option B) or collocated with installer logic (favor Option A)
   - Recommendation: Default to Option A (embedded module). The planner can override if separation is preferred.

2. **`/donna:help` depth of diagnostics**
   - What we know: The skill should inspect config, storage repo, workflows dir, and tools.md
   - What's unclear: Should it also check network connectivity or gh auth status?
   - Recommendation: Keep scope to local Donna state in v1 of the skill. Network/auth is complex and can be a follow-up.

3. **`/donna:contribute-idea` duplicate matching threshold**
   - What we know: We check titles in GitHub Issues and bullets in STATE.md Pending Todos
   - What's unclear: Exact matching algorithm — exact substring, keyword overlap, or ask Claude to judge similarity?
   - Recommendation: Ask Claude (the skill AI) to judge semantic similarity between the user's idea and each candidate. This is Claude's natural strength and avoids brittle string matching.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | none — test runner invoked directly |
| Quick run command | `node --test 'test/*.test.cjs'` |
| Full suite command | `node --test 'test/*.test.cjs'` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| Installer shows changelog section during upgrade | unit | `node --test 'test/installer.test.cjs'` | ✅ (extend existing) |
| Installer does NOT show changelog on fresh install | unit | `node --test 'test/installer.test.cjs'` | ✅ (extend existing) |
| Installer does NOT show changelog when already up to date | unit | `node --test 'test/installer.test.cjs'` | ✅ (extend existing) |
| New skill stubs deployed by installer | unit | `node --test 'test/stubs.test.cjs'` | ✅ (extend existing) |
| New skill workflows deployed by installer | unit | `node --test 'test/workflows.test.cjs'` | ✅ (extend existing) |
| `/donna:help` skill workflow: reads config, interactive | manual-only | — | N/A — LLM workflow |
| `/donna:contribute-idea` workflow: gh auth check | manual-only | — | N/A — LLM workflow + gh dep |
| CONTRIBUTING.md exists at repo root | smoke | `node --test 'test/package.test.cjs'` | ✅ (extend existing) |

### Sampling Rate
- **Per task commit:** `node --test 'test/installer.test.cjs'`
- **Per wave merge:** `node --test 'test/*.test.cjs'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all testable phase requirements. Skill workflow tests are manual-only by nature (LLM-executed prompts, not unit-testable).

---

## Sources

### Primary (HIGH confidence)
- `src/installer.cjs` — Direct source inspection, upgrade detection logic confirmed at lines 50-53
- `src/output.cjs` — Output helper API confirmed, all functions documented
- `src/version.cjs` — Version read/write API confirmed
- `stubs/claude-code/donna/setup.md` — Stub pattern confirmed
- `workflows/setup.md`, `workflows/add-tool.md` — Workflow step pattern confirmed
- `test/installer.test.cjs` — Test infrastructure confirmed: `node:test` + `node:assert/strict`
- `package.json` — Files array, test script, Node 18+ requirement confirmed
- `CLAUDE.md` — Project conventions confirmed (README update rule, no git from subagents)

### Secondary (MEDIUM confidence)
- `gh api repos/.../contents/...` base64 decode via `--jq '.content | @base64d'` — standard gh CLI pattern, verified against gh CLI docs conventions

### Tertiary (LOW confidence)
- macOS `base64 -D` vs Linux `base64 -d` distinction — flagged in pitfalls, use jq decode to avoid entirely

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct source inspection
- Architecture: HIGH — existing patterns confirmed from source files
- Pitfalls: HIGH (README, git commit) / MEDIUM (base64 platform, version range) — README and git pitfalls confirmed from CLAUDE.md; base64 from general platform knowledge
- Changelog data: MEDIUM — approach recommended but implementation choice deferred to planner (open question 1)

**Research date:** 2026-03-16
**Valid until:** 2026-04-16 (stable domain, no fast-moving dependencies)
