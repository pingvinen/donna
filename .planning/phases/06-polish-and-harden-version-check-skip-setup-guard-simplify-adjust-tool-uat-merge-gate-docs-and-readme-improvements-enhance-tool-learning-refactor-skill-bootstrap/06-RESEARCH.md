# Phase 6: Polish and Harden - Research

**Researched:** 2026-03-27
**Domain:** Node.js CJS module architecture, GitHub Actions status checks, workflow markdown refactoring, npm registry API
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**D-01:** Check npm registry once per day — first skill invocation of the day calls `npm view @pingvinen/donna-assistant version` via Bash with a short timeout. Cache result in `~/.donna/` so subsequent calls skip the check.

**D-02:** Non-blocking hint when update available — print a single line like "Donna vX.Y.Z available — run npx @pingvinen/donna-assistant to update" then continue with the skill normally.

**D-03:** Version check runs as part of `donna-tools init` (see D-10/D-11). The init JSON response includes an `update_available` field; workflows print the hint if present.

**D-04:** The installer (`installer.cjs`) currently always prints "Run /donna:setup in Claude Code to get started" at the end. When config.md (with a storage_repo path) already exists, suppress that message. No workflow-level guards needed — this is purely an installer UX fix.

**D-05:** Remove type change support from `/donna:adjust-tool`. Type is set at add-tool time and stays fixed. Simplifies the adjust-tool workflow by removing the type change flow and associated capability format repair logic.

**D-06:** Add a GitHub Actions workflow that blocks merging if UAT has not been finalized. Implementation details are Claude's discretion — the key requirement is that PRs cannot merge without UAT passing.

**D-07:** Group the skills list in README.md into logical categories (e.g., "Setup", "Daily workflow", "Tool management") for easier comprehension. (ref: #22)

**D-08:** Add documentation explaining why automated periodic run-tools invocations are not supported. (ref: #23)

**D-09:** Cascading learning approach for both add-tool and relearn-tools:
  1. Local README/docs in the tool's package directory
  2. Web docs via fetch if local docs not found
  3. Source code analysis if docs are insufficient — ask the user first: "Docs covered N capabilities. Want me to analyze the source code for more?"
  The current approach (--help for unknown CLIs, training data for well-known CLIs, GraphQL introspection) remains as the baseline. The cascade adds richer sources on top.

**D-10:** Create `src/donna-tools.cjs` as a single CLI entry point following the GSD `gsd-tools.cjs` pattern. Workflows call `node donna-tools.cjs <subcommand>` via Bash; subcommands return JSON. Internally delegates to focused modules in `src/` as it grows.

**D-11:** Initial subcommands:
  - `donna-tools init` — config reading (storage_repo, daily_folder, auto_push), migration runner (move-standing-files, backfill-tool-type), Obsidian daily-notes sync, and once-per-day version check (D-03). Returns a single JSON object with all bootstrap state.
  - `donna-tools commit <msg> --files f1 f2` — the git commit pattern. Replaces ~12 lines of identical git boilerplate in 7 workflows.
  - `donna-tools daily-path` — returns today's daily file path, creating the directory if needed. Replaces ~5 lines in 5 workflows.
  - `donna-tools resolve-secret <key>` — looks up a secret from `<storage_repo>/donna/secrets.md`. Replaces ~5 lines in 3 workflows.

**D-12:** Migrations move from markdown instructions to testable JavaScript inside donna-tools.cjs. Each workflow replaces its inline bootstrap steps with a single `node donna-tools.cjs init` call.

### Claude's Discretion
- UAT merge gate implementation details (D-06)
- Specific grouping categories for README skills list (D-07)
- donna-tools.cjs internal module structure and error handling

### Deferred Ideas (OUT OF SCOPE)
- Make UAT easier with sandbox environment and test tools (testing, ref: #19) — separate concern from the merge gate; belongs in its own phase
- Evaluate natural language input as alternative to slash commands (general) — exploratory work, not polish/hardening
</user_constraints>

## Summary

Phase 6 is a hardening and refactoring phase with no new skills. The largest work item is `donna-tools.cjs` — a new CJS CLI entry point (modeled on gsd-tools.cjs) that consolidates ~75 lines of duplicated bootstrap boilerplate present verbatim in every workflow. The bootstrap duplication is confirmed by reading `relearn-tools.md`, `begin-the-day.md`, `adjust-tool.md`, and `add-tool.md` — all four share identical `read-config` and `check-pending-migrations` steps.

The remaining work items are smaller but touch different layers: the installer (skip-setup guard), the adjust-tool workflow (remove type-change step), GitHub Actions (UAT merge gate), the README (skills grouping + periodic automation docs), and both `add-tool.md` and `relearn-tools.md` (enhanced tool learning cascade).

The codebase already has well-established patterns — Node.js built-ins only (no external runtime dependencies), node:test for unit tests with a `captureOutput` helper pattern, and biome for linting. All new code must follow these conventions.

**Primary recommendation:** Build donna-tools.cjs first since all other workflow changes depend on it. The UAT merge gate is independently deliverable and can be parallelized.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | Node 18+ (24 in CI) | fs, path, os, child_process, https | Zero external dependencies — project convention |
| node:test | built-in | Unit testing framework | Already used across all test files |
| @biomejs/biome | ^1.9.0 | Linting and formatting | Already in devDependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:https / child_process.exec | built-in | npm registry check for version | For `donna-tools init` version check |
| actions/checkout | v6 | GitHub Actions checkout | Already used in pr-validate.yml |
| actions/setup-node | v6 | Node setup in CI | Already used in pr-validate.yml |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:https for npm check | npm CLI subprocess | Subprocess adds latency; direct HTTPS to registry.npmjs.org is faster and has no PATH dependency |
| GitHub Actions status check | PR label approach | Status check is native GitHub branch protection — more reliable |

**Installation:** No new runtime packages. Dev tooling already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── donna-tools.cjs      # NEW: CLI entry point (subcommand router)
├── installer.cjs        # MODIFIED: skip-setup guard (D-04)
├── version.cjs          # REUSED: readVersion/writeVersion (no changes needed)
├── migrator.cjs         # REUSED: runMigrations (no changes needed)
├── output.cjs           # REUSED: banner/info/success/fail
└── providers/           # Unchanged
workflows/
├── adjust-tool.md       # MODIFIED: remove type-change step (D-05)
├── add-tool.md          # MODIFIED: enhanced learning cascade (D-09)
├── relearn-tools.md     # MODIFIED: enhanced learning cascade + donna-tools init (D-09, D-12)
├── begin-the-day.md     # MODIFIED: replace bootstrap with donna-tools init (D-12)
├── add-task.md          # MODIFIED: replace bootstrap with donna-tools init (D-12)
├── done.md              # MODIFIED: replace bootstrap with donna-tools init (D-12)
├── run-tools.md         # MODIFIED: replace bootstrap with donna-tools init (D-12)
├── focus.md             # MODIFIED: replace bootstrap with donna-tools init (D-12)
├── set-role.md          # MODIFIED: replace bootstrap with donna-tools init (D-12)
└── setup.md             # Unchanged (setup creates config, bootstrap reads it)
.github/workflows/
└── uat-gate.yml         # NEW: UAT merge gate (D-06)
README.md                # MODIFIED: skills grouping (D-07) + automation docs (D-08)
test/
└── donna-tools.test.cjs # NEW: tests for donna-tools.cjs
```

### Pattern 1: donna-tools.cjs CLI Router
**What:** CJS module with `async function main()` that reads `process.argv.slice(2)`, routes to subcommands, and prints JSON to stdout. Follows gsd-tools.cjs exactly.
**When to use:** Every subcommand that workflows call via Bash.
**Example:**
```javascript
// Pattern from gsd-tools.cjs — apply same structure
"use strict";

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (cmd === 'init') {
    const result = await runInit(args.slice(1));
    console.log(JSON.stringify(result));
    return;
  }
  if (cmd === 'commit') {
    const result = await runCommit(args.slice(1));
    console.log(JSON.stringify(result));
    return;
  }
  // etc.
  process.stderr.write(`Unknown command: ${cmd}\n`);
  process.exit(1);
}

main().catch(err => {
  process.stderr.write(err.message + '\n');
  process.exit(1);
});
```

### Pattern 2: donna-tools init JSON output
**What:** Single JSON object with all bootstrap state. Workflows destructure only what they need.
**When to use:** Replace `read-config` and `check-pending-migrations` steps in all workflows.
**Example:**
```json
{
  "storage_repo": "/Users/user/notes",
  "daily_folder": "daily",
  "auto_push": false,
  "update_available": "1.0.0",
  "migrations_applied": ["move-standing-files"],
  "error": null
}
```
Workflow usage:
```bash
INIT=$(node ~/.donna/donna-tools.cjs init)
STORAGE_REPO=$(echo "$INIT" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).storage_repo))")
UPDATE=$(echo "$INIT" | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).update_available||''))")
if [ -n "$UPDATE" ]; then echo "Donna v$UPDATE available — run npx @pingvinen/donna-assistant to update"; fi
```

### Pattern 3: Version cache file
**What:** Cache the npm registry check result in `~/.donna/version-check.md` with a `checked_on` date field. On `donna-tools init`, read this file; if `checked_on` matches today's date, skip the registry call; otherwise call and rewrite.
**When to use:** In the `init` subcommand only.
**Example cache file:**
```markdown
---
checked_on: 2026-03-27
latest_version: 1.0.0
---
```

### Pattern 4: GitHub Actions UAT gate
**What:** A required status check job that reads PR labels. If the `uat:pass` label is absent, the job fails (exit 1). Branch protection rules require this check to pass before merge.
**When to use:** `.github/workflows/uat-gate.yml` triggered on `pull_request`.
**Example:**
```yaml
name: UAT Gate
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, labeled, unlabeled]

jobs:
  uat-gate:
    name: UAT
    runs-on: ubuntu-latest
    steps:
      - name: Check UAT label
        run: |
          LABELS='${{ toJson(github.event.pull_request.labels.*.name) }}'
          if echo "$LABELS" | grep -q '"uat:pass"'; then
            echo "UAT passed"
          else
            echo "UAT not finalized. Add 'uat:pass' label to unblock merge."
            exit 1
          fi
```
This approach requires no additional actions or tokens — it reads labels directly from the event payload. Confidence: HIGH (standard GitHub Actions pattern).

### Pattern 5: Installer skip-setup guard (D-04)
**What:** Before printing "Run /donna:setup" check if `~/.config/donna/config.md` exists and has a non-empty `storage_repo` field.
**When to use:** End of `installer.cjs` run() function, line 102 area.
**Example:**
```javascript
// Check if already configured
const configPath = path.join(homeDir, ".config", "donna", "config.md");
const isConfigured = fs.existsSync(configPath) &&
  fs.readFileSync(configPath, "utf8").includes("storage_repo:");

if (!isConfigured) {
  console.log("");
  output.info("Run /donna:setup in Claude Code to get started.");
}
```

### Anti-Patterns to Avoid
- **Shipping donna-tools.cjs in the npm package without adding it to `package.json` files array:** The `files` array in package.json currently lists `src/` — donna-tools.cjs goes in `src/` so it will be included automatically. But the workflows must reference it via `~/.donna/donna-tools.cjs` (copied there by the installer), not via `node_modules`.
- **Putting donna-tools.cjs in `bin/`:** bin/ is for the npx entry point only. donna-tools.cjs is a workflow utility, not a user-facing binary.
- **Using `npm view` synchronously in workflow markdown:** npm view is a subprocess call. donna-tools.cjs must handle the timeout properly (short timeout like 5s) and treat registry failure as "no update available" — never block the user.
- **Breaking the stub + workflow split:** donna-tools.cjs handles mechanics only. Workflows still drive all logic. LLM still crafts commit messages.
- **Installing donna-tools.cjs to ~/.donna/ via a new migration:** The installer already copies `src/` contents to `~/.donna/` via the workflow copy step. Check whether donna-tools.cjs needs to be explicitly installed or if the existing copy mechanism covers it.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON output from CLI | Custom serialization | `JSON.stringify()` | Standard, already used throughout |
| Semver comparison | Custom parser | Three-field numeric compare (already in changelog.cjs as `semverGt`) | Edge cases in semver pre-release tags |
| GitHub label check in Actions | Custom API call | `github.event.pull_request.labels.*.name` in event payload | No token or API call needed |
| npm registry fetch | npm CLI subprocess | Direct HTTPS to `https://registry.npmjs.org/@pingvinen/donna-assistant` | Lightweight, no PATH dependency, registry returns JSON with `dist-tags.latest` |

**Key insight:** The npm registry returns `dist-tags.latest` in JSON at `https://registry.npmjs.org/@pingvinen%2Fdonna-assistant` without authentication. The `version` field in the JSON response is the canonical latest. No npm CLI needed.

## Runtime State Inventory

> SKIPPED — This is a refactoring/consolidation phase, not a rename or migration. Workflow files are being simplified (not renamed), and donna-tools.cjs is a new module. No stored string keys change.

## Common Pitfalls

### Pitfall 1: donna-tools.cjs path in workflows
**What goes wrong:** Workflows reference `node donna-tools.cjs` but the installer copies files to `~/.donna/` — path must be `node ~/.donna/donna-tools.cjs` (or use the full path resolved from config).
**Why it happens:** During development, donna-tools.cjs is in `src/` but users run the installed copy from `~/.donna/`.
**How to avoid:** Use `~/.donna/donna-tools.cjs` consistently in all workflow Bash steps. The installer copies `workflows/` to `~/.donna/workflows/` — donna-tools.cjs must be similarly available at `~/.donna/donna-tools.cjs`.
**Warning signs:** "Cannot find module" error when workflow runs in user environment.

### Pitfall 2: installer.cjs copies workflows but not src/
**What goes wrong:** donna-tools.cjs is in `src/` but the installer only copies `workflows/` to `~/.donna/workflows/`. Workflows calling `node ~/.donna/donna-tools.cjs` would fail.
**Why it happens:** The installer's current logic (lines 90-93 of installer.cjs) copies `workflows/` but not `src/`. donna-tools.cjs needs its own copy step to `~/.donna/donna-tools.cjs`.
**How to avoid:** Add an explicit `fs.copyFileSync(src/donna-tools.cjs, ~/.donna/donna-tools.cjs)` step in installer.cjs. Make this copy happen every install/upgrade (idempotent).
**Warning signs:** Works in dev (running `node src/donna-tools.cjs`) but fails in prod (installed copy).

### Pitfall 3: require() cache in migrator when called from donna-tools.cjs
**What goes wrong:** `migrator.cjs` uses `require()` to load migration files. If donna-tools.cjs is called multiple times in the same process (in tests), require cache may skip re-running.
**Why it happens:** Node's require cache is process-wide.
**How to avoid:** Test each migration in isolation (use temp dirs). The existing test pattern in `installer.test.cjs` already handles this by clearing require cache with `delete require.cache[key]` — apply same pattern to donna-tools tests.

### Pitfall 4: Version check timeout blocking workflow
**What goes wrong:** `npm view` or direct HTTPS to registry hangs, blocking the entire `donna-tools init` call, which blocks every workflow.
**Why it happens:** No timeout on network calls.
**How to avoid:** Use `https.get` with an explicit socket timeout (e.g. 3000ms) and abort on timeout. Treat any error (ENOTFOUND, timeout, non-200) as "registry unreachable" → set `update_available: null`. Never throw from version check.

### Pitfall 5: UAT label approach requires label to be created in repo
**What goes wrong:** Workflow checks for `uat:pass` label, but if the label doesn't exist in the GitHub repo, no one can apply it, blocking all PRs.
**Why it happens:** GitHub labels must be created before they can be applied.
**How to avoid:** Either create the label in the workflow setup step, or document label creation as a one-time setup step. The deploy/release workflow or a one-time manual step works. Alternative: check for label by name pattern matching (case-insensitive) to be resilient.

### Pitfall 6: adjust-tool show-current-config still shows "type" field after D-05
**What goes wrong:** The `show-current-config` step displays the type field. After removing type change from the menu, type is still displayed but cannot be changed. This is correct behavior — type is informational only. But the `ask-what-to-change` step currently lists "5. type" as an option, which must be removed.
**Why it happens:** The type option is currently option 5 in the numbered menu.
**How to avoid:** Remove option 5 from the menu. Remove the entire `apply-change` block for type (lines 169-214 of adjust-tool.md). Type remains visible in `show-current-config` as read-only information.

### Pitfall 7: donna-tools init must work when storage_repo does not exist yet
**What goes wrong:** If user runs a workflow before setup, donna-tools init cannot read config — it should fail gracefully with a JSON error, not throw.
**Why it happens:** Config file may not exist.
**How to avoid:** Return `{"error": "not_configured", "storage_repo": null}` from donna-tools init when config is absent. Workflows check for error field and print the "Run /donna:setup first" message.

### Pitfall 8: Enhanced tool learning cascade — source code path is user-opt-in
**What goes wrong:** Automatically reading source code for a tool could be slow, surprising, or privacy-sensitive.
**Why it happens:** Source code analysis is a deeper operation than --help.
**How to avoid:** Exactly as specified in D-09: ask user first ("Docs covered N capabilities. Want me to analyze the source code for more?"). Never do it silently.

## Code Examples

### npm registry HTTPS check (no npm CLI)
```javascript
// Source: Node.js built-in https module
const https = require("node:https");

function checkLatestVersion(currentVersion, timeout = 3000) {
  return new Promise((resolve) => {
    const req = https.get(
      "https://registry.npmjs.org/@pingvinen%2Fdonna-assistant",
      { headers: { Accept: "application/json" } },
      (res) => {
        if (res.statusCode !== 200) { resolve(null); return; }
        let data = "";
        res.on("data", (chunk) => { data += chunk; });
        res.on("end", () => {
          try {
            const latest = JSON.parse(data)["dist-tags"]?.latest || null;
            resolve(latest && latest !== currentVersion ? latest : null);
          } catch { resolve(null); }
        });
      }
    );
    req.setTimeout(timeout, () => { req.destroy(); resolve(null); });
    req.on("error", () => resolve(null));
  });
}
```

### Version cache read/write pattern
```javascript
// Cache file: ~/.donna/version-check.md
function readVersionCache(donnaDir) {
  const cachePath = require("node:path").join(donnaDir, "version-check.md");
  const fs = require("node:fs");
  if (!fs.existsSync(cachePath)) return null;
  const content = fs.readFileSync(cachePath, "utf8");
  const date = content.match(/checked_on: (.+)/)?.[1]?.trim();
  const latest = content.match(/latest_version: (.+)/)?.[1]?.trim();
  return { date, latest };
}

function writeVersionCache(donnaDir, date, latestVersion) {
  const cachePath = require("node:path").join(donnaDir, "version-check.md");
  require("node:fs").writeFileSync(
    cachePath,
    `---\nchecked_on: ${date}\nlatest_version: ${latestVersion}\n---\n`
  );
}
```

### donna-tools init JSON contract
```javascript
// Return shape for donna-tools init
{
  // Success fields
  storage_repo: "/abs/path/to/repo",   // string or null
  daily_folder: "daily",               // string
  auto_push: false,                    // boolean
  update_available: "1.0.0",           // string (new version) or null
  migrations_applied: ["move-standing-files"],  // array of applied migration names

  // Error field (null on success)
  error: null  // or "not_configured" | "config_parse_error"
}
```

### Workflow init step replacement
```markdown
<!-- BEFORE (75 lines of repeated boilerplate) -->
<step name="read-config">...</step>
<step name="check-pending-migrations">...</step>

<!-- AFTER (single call) -->
<step name="init">
Run via Bash:
```bash
INIT=$(node ~/.donna/donna-tools.cjs init)
```

If the `error` field in the JSON is `"not_configured"`, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract `storage_repo`, `daily_folder`, `auto_push` from the JSON.

If `update_available` is non-null, print:
```
  Donna v<update_available> available — run npx @pingvinen/donna-assistant to update
```
Continue normally.
</step>
```

### GitHub Actions UAT gate
```yaml
# .github/workflows/uat-gate.yml
name: UAT Gate
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened, labeled, unlabeled]

permissions:
  contents: read
  pull-requests: read

jobs:
  uat-gate:
    name: UAT
    runs-on: ubuntu-latest
    steps:
      - name: Check for uat:pass label
        run: |
          LABELS='${{ toJson(github.event.pull_request.labels.*.name) }}'
          echo "Labels: $LABELS"
          if echo "$LABELS" | grep -qi '"uat:pass"'; then
            echo "UAT passed — uat:pass label present"
          else
            echo "UAT not finalized. Apply 'uat:pass' label to this PR to unblock merge."
            exit 1
          fi
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline bootstrap in each workflow | donna-tools.cjs init subcommand | Phase 6 (this phase) | ~75 lines removed per workflow |
| Always print setup prompt | Suppress when configured | Phase 6 (this phase) | Cleaner UX on repeat installs |
| Type changeable via adjust-tool | Type fixed at add-tool time | Phase 6 (this phase) | Simpler workflow, no repair logic |
| --help only for unknown CLIs | Cascade: local docs, web, source | Phase 6 (this phase) | Richer capability discovery |

## Open Questions

1. **Where does donna-tools.cjs live at runtime?**
   - What we know: The installer copies `workflows/` to `~/.donna/workflows/`. It does NOT currently copy `src/`.
   - What's unclear: Should donna-tools.cjs go to `~/.donna/donna-tools.cjs` (flat) or `~/.donna/bin/donna-tools.cjs`?
   - Recommendation: Flat — `~/.donna/donna-tools.cjs` — mirrors the gsd-tools.cjs pattern. Add an explicit `fs.copyFileSync` in installer.cjs.

2. **Which workflows receive donna-tools init replacement?**
   - What we know: CONTEXT.md lists 7 committing workflows and 5 using daily-path. The bootstrap (read-config + check-pending-migrations) appears in: `begin-the-day.md`, `relearn-tools.md`, `adjust-tool.md`, `add-tool.md`, `add-task.md`, `done.md`, `run-tools.md`, `focus.md`, `set-role.md` — that is 9 workflows.
   - What's unclear: `setup.md` creates config — it probably should NOT call donna-tools init (there's no config yet). Confirm which workflows are in scope.
   - Recommendation: Replace bootstrap in all workflows except `setup.md`. That's 9 workflows.

3. **UAT label: who creates it?**
   - What we know: GitHub labels must exist before they can be applied. New repos don't have `uat:pass` by default.
   - What's unclear: Is there an existing label creation step, or does this need a one-time manual setup?
   - Recommendation: Add a `uat-gate.yml` note in README or CONTRIBUTING about creating the label. Alternatively, use the GitHub API in a one-time workflow. Keep simple for now.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | donna-tools.cjs | Yes | v24.14.0 | — |
| npm | Version check test | Yes | 11.11.0 | — |
| GitHub Actions | UAT gate workflow | Yes (via repo) | — | — |
| registry.npmjs.org | Version check | Yes (network) | — | Treat as no update available on failure |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in) |
| Config file | none — test files discovered via `node --test 'test/*.test.cjs'` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements — Test Map
| Area | Behavior | Test Type | Automated Command | File Exists? |
|------|----------|-----------|-------------------|-------------|
| donna-tools init | Returns JSON with storage_repo, update_available | unit | `npm test` (donna-tools.test.cjs) | No — Wave 0 |
| donna-tools commit | Runs git commands, returns JSON | unit | `npm test` | No — Wave 0 |
| donna-tools daily-path | Returns correct path, creates dir | unit | `npm test` | No — Wave 0 |
| donna-tools resolve-secret | Reads secrets.md, validates placeholder | unit | `npm test` | No — Wave 0 |
| Version check | Caches result per day, non-blocking | unit | `npm test` | No — Wave 0 |
| Skip-setup guard | Suppresses message when config exists | unit | `npm test` (installer.test.cjs) | Yes (add cases) |
| installer | Existing tests still pass | unit | `npm test` | Yes |

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/donna-tools.test.cjs` — covers all donna-tools subcommands
- [ ] Additional cases in `test/installer.test.cjs` — covers D-04 skip-setup guard

*(Existing test infrastructure covers all other behaviors)*

## Sources

### Primary (HIGH confidence)
- Direct code reading: `src/installer.cjs`, `src/version.cjs`, `src/migrator.cjs`, `src/output.cjs` — authoritative source of truth
- Direct code reading: `workflows/relearn-tools.md`, `workflows/adjust-tool.md`, `workflows/begin-the-day.md`, `workflows/add-tool.md` — bootstrap duplication confirmed
- Direct code reading: `.github/workflows/pr-validate.yml`, `.github/workflows/pr-lint.yml` — existing CI patterns
- Direct inspection: `test/installer.test.cjs` — test patterns (captureOutput, makeTempHome, require cache clearing)
- Live npm registry: `npm view @pingvinen/donna-assistant version` returned `0.9.1` — registry accessible

### Secondary (MEDIUM confidence)
- gsd-tools.cjs header comments — subcommand router pattern, JSON output convention (read directly from installed file at `/Users/pingvinen/.claude/get-shit-done/bin/gsd-tools.cjs`)
- GitHub Actions label access: `github.event.pull_request.labels.*.name` — standard documented pattern for reading PR labels in workflow expressions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified from existing package.json, test files, and CI workflows
- Architecture patterns: HIGH — all patterns derived directly from existing code
- Pitfalls: HIGH — identified from concrete code inspection (installer copy logic, require cache, workflow paths)
- Test framework: HIGH — confirmed from package.json scripts and test file structure

**Research date:** 2026-03-27
**Valid until:** 2026-04-27 (stable Node.js ecosystem, no fast-moving dependencies)
