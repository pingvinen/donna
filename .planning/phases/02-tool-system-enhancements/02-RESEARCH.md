# Phase 2: Tool System Enhancements - Research

**Researched:** 2026-03-16
**Domain:** Claude Code skill authoring, workflow parallelization, API/MCP integration patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Parallelization strategy:**
- Spawn one background agent per tool (not per capability) during begin-the-day and run-tools
- Each agent runs all capabilities for its tool sequentially; tools run in parallel
- Collect all results after all agents finish, then do a single smart-merge pass into the daily file (atomic write)
- Independent failure: if one tool agent fails/times out, others complete normally; failed tool adds a warning (existing pattern)
- No retry on failure — consistent with current behavior
- Global timeout of 2 minutes for the entire parallel batch; collect whatever completed and warn about the rest
- Per-command timeout remains at 10 seconds within each agent

**Non-CLI tool types:**
- Support three new tool types: REST APIs, GraphQL APIs, and MCP servers
- When adding a tool, ask the user to choose the type: CLI, REST API, GraphQL API, or MCP server
- API auth: Gitignored secrets file at `<storage_repo>/donna/secrets.md`, auto-added to `.gitignore` by Donna
  - Capabilities reference `{{SECRET_NAME}}` placeholders; Donna substitutes at runtime from secrets.md
  - Donna never prompts for actual secret values — user edits secrets.md directly
  - Secrets file stored inside the `donna/` subfolder (consistent with other standing files)
- MCP servers: Claude calls MCP tools directly (native invocation, not shell wrapper)
  - MCP server configuration lives in Claude Code's settings, not duplicated in tools.md
  - tools.md stores only which MCP tool names to call as capabilities
- API capability format: Claude's discretion — determine best format (curl templates, structured definitions, etc.) during research/planning

**Adjust-tool skill design:**
- New skill: `/donna:adjust-tool`
- All fields are adjustable: scope/filtering, capabilities, auth/secrets, tool command itself
- Menu-driven flow: show current config, ask "What do you want to change?", edit selected field, re-verify if needed, save
- If no tool name argument provided, list all registered tools from tools.md as options
- When scope changes, ask user: "Scope changed. Re-learn capabilities with new scope?" before re-learning
- Follows existing stub + workflow split pattern

**tools.md schema evolution:**
- Add `type: cli|rest|graphql|mcp` field to each tool section
- Run migration on upgrade to backfill `type: cli` on existing tool sections (via migrator.cjs)
- MCP tools store MCP tool names as capabilities (minimal — server config lives in Claude Code settings)
- API tool fields: Claude's discretion to determine the right field set (base_url, auth_header, response_format, etc.)
- Backwards compatible: all reading code should handle missing `type` field gracefully as `cli`

### Claude's Discretion
- API capability definition format (curl templates vs structured fields)
- API-specific fields in tools.md (base_url, auth_header, response_format — decide during research)
- How secrets.md is structured (YAML frontmatter, key-value pairs, etc.)
- How to validate API connectivity (equivalent of auth-test for CLI tools)
- Implementation of the 2-minute global timeout mechanism
- How MCP tool capabilities map to the daily file task format

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 2 expands the tool system in three directions: parallelization of tool command execution, an `adjust-tool` skill for iterative tool refinement, and support for REST API, GraphQL API, and MCP server tool types. The codebase is well-understood from reading all canonical reference files. The existing architecture is clean and extensible — the main work is refactoring two workflows (begin-the-day and run-tools) to spawn parallel agents, extending the tools.md schema and the add-tool workflow for new types, adding a migration for the `type` field backfill, adding the adjust-tool stub+workflow, and updating the installer to include the new skill.

The parallelization pattern follows the Claude Code Task tool (background agent spawning), which is already the intended approach per PROJECT.md. The secrets.md file for API auth needs a clean structure that keeps secrets out of conversation context while being easy for users to maintain directly. MCP integration is intentionally lightweight — Claude Code handles MCP server configuration natively; Donna only records which MCP tool names to invoke.

**Primary recommendation:** Work in four parallel-ready tracks — (1) parallelize begin-the-day and run-tools, (2) add-tool + tools.md schema for new types, (3) adjust-tool skill, (4) migrator + installer plumbing. Each track is independent and can be planned as a wave.

---

## Standard Stack

### Core (existing — unchanged)
| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js CJS | 18+ | Runtime for installer, migrator, src/ modules |
| `node:test` | built-in | Test runner for all .test.cjs files |
| `node:assert/strict` | built-in | Assertions in tests |
| Biome | current | Linting (run `npm run lint:fix` before committing) |

### Claude Code Primitives Used
| Primitive | Purpose | Notes |
|-----------|---------|-------|
| Task tool | Spawn background agents per tool | Existing PROJECT.md decision: "Each tool gets its own agent" |
| AskUserQuestion | All interactive flows | Established pattern in all workflows |
| Read / Write / Bash | File I/O and CLI execution | Already in all skill stubs' `allowed-tools` |
| MCP tool invocation | Direct native call for MCP-type tools | No shell wrapper needed |

### No New npm Dependencies
This phase adds no new npm packages. All new capability is implemented in:
- Workflow markdown files (in `workflows/`)
- Stub markdown files (in `stubs/claude-code/donna/`)
- A new migration file (in `migrations/`)
- Updates to `src/installer.cjs` (skill list)

---

## Architecture Patterns

### Existing Pattern: Stub + Workflow Split
Every skill has two files:
- `stubs/claude-code/donna/<skill>.md` — YAML frontmatter with name/description/allowed-tools, plus `<execution_context>@~/.donna/workflows/<skill>.md</execution_context>`
- `workflows/<skill>.md` — Full implementation in `<step name="...">` XML tags

The installer copies stubs to provider directories and workflows to `~/.donna/workflows/`. New skills follow this split exactly.

### Existing Pattern: tools.md Format
```markdown
---
# tools.md — managed by donna:add-tool
---

## <tool_name>

- command: <command>
- version: <version>
- learned: <date>
- auth_test: <command or "none">
- scope: <scope or "none">

### Capabilities
- <name>: <invocation>
```

**Phase 2 extension** — add `type` field after `command`:
```markdown
## <tool_name>

- command: <command>
- type: cli|rest|graphql|mcp
- version: <version>
- learned: <date>
- auth_test: <command or "none">
- scope: <scope or "none">
```

### Recommended: API Tool Section Format
For REST and GraphQL tools, add API-specific fields. Recommended field set (Claude's discretion, resolved here):

```markdown
## <tool_name>

- type: rest
- base_url: https://api.example.com
- auth_header: Authorization
- auth_secret: API_KEY
- scope: <scope or "none">
- learned: <date>

### Capabilities
- <name>: GET /endpoint?param=value
```

For GraphQL:
```markdown
- type: graphql
- base_url: https://api.example.com/graphql
- auth_header: Authorization
- auth_secret: API_KEY
```

Rationale: structured fields (not curl templates) keep the format readable and consistent with the existing YAML-list style. The workflow substitutes `{{SECRET_NAME}}` placeholders at runtime from secrets.md.

### Recommended: secrets.md Structure
```markdown
---
# secrets.md — managed by user, never by donna
# Auto-added to .gitignore
---

API_KEY: your-api-key-here
GITHUB_TOKEN: ghp_...
```

Plain key-value pairs under the YAML frontmatter divider. Simple, human-editable, no nesting. Donna reads this file and substitutes `{{KEY}}` in capability invocations.

### Recommended: API Connectivity Validation
REST/GraphQL equivalent of CLI auth-test:
- Run a GET to `<base_url>` (or a designated health/me endpoint) with `Authorization: <auth_header> <resolved_secret>`
- Use Bash with `curl -s -o /dev/null -w "%{http_code}" -H "Authorization: ..." <url> 2>&1`
- 200-299: print `✓ API reachable`
- 401/403: print `! Authentication failed — check secrets.md`
- Other/timeout: print `! Could not reach <base_url>`

### Recommended: MCP Capability Format
```markdown
### Capabilities
- <name>: mcp:<server_name>/<tool_name>
```

Example:
```markdown
- list-linear-issues: mcp:linear/list_issues
```

At runtime, when Donna encounters a `mcp:` prefix, it calls the MCP tool directly (no Bash). The MCP server name must match what's configured in Claude Code's settings. MCP capabilities map to daily file tasks using the same `- [ ] (<tool_name>) <description> [<identifier>](<url>)` format — Claude extracts identifiers/URLs from MCP tool output using its understanding of the tool.

### Parallelization Pattern: Task-Per-Tool in Workflows

Current sequential pattern in `begin-the-day` and `run-tools`:
```
For each tool: run each capability → collect results → smart-merge
```

New parallel pattern:
```
Spawn one Task per tool → each Task runs all capabilities for that tool →
collect all Task results after 2-minute global timeout →
single smart-merge pass with atomic write
```

**2-minute global timeout implementation (Claude's discretion, resolved here):**
The workflow instructs Claude to spawn all Tasks, then wait for results. The instruction should specify: "Wait up to 2 minutes for all agents. After 2 minutes, collect whatever has completed and treat remaining tools as failed with a timeout warning." This is expressed as a workflow instruction to Claude, not as a shell `timeout` command — Claude Code's Task spawning handles agent lifecycle.

### Recommended Project Structure for New Files
```
migrations/
├── 001-initial.cjs
├── 002-standing-files-subfolder.cjs
└── 003-tool-type-backfill.cjs          # NEW: backfill type: cli

stubs/claude-code/donna/
├── (existing stubs)
└── adjust-tool.md                       # NEW

workflows/
├── add-tool.md                          # MODIFIED: add type selection + API/MCP branches
├── begin-the-day.md                     # MODIFIED: parallelize pull-tool-data step
├── run-tools.md                         # MODIFIED: parallelize pull-fresh-data step
└── adjust-tool.md                       # NEW

src/
└── installer.cjs                        # MODIFIED: add adjust-tool to skill list
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Parallel agent execution | Custom timeout loop or shell `wait` | Claude Code Task tool — already the intended pattern |
| API HTTP calls | Dedicated HTTP library | `curl` via Bash — already available, no new deps |
| Secret management | Encryption, keychain integration | Plain `secrets.md` with .gitignore — user's responsibility |
| MCP server lifecycle | Starting/stopping servers | Claude Code handles this natively |
| Test runner | Jest, Mocha, custom harness | `node --test` (built-in) — already used project-wide |
| File upsert logic | Custom diff/merge | Same read-modify-write + Write tool pattern used in all existing workflows |

**Key insight:** The project has no npm dependencies for runtime behavior — everything runs via Claude Code primitives + Bash. Adding dependencies would break this clean design and add install complexity for users.

---

## Common Pitfalls

### Pitfall 1: Secrets Appearing in Conversation Context
**What goes wrong:** If Donna prompts the user to enter secret values, those values appear in the conversation transcript (potentially logged, visible to observers).
**Why it happens:** Interactive flows naturally collect values via AskUserQuestion.
**How to avoid:** Donna NEVER prompts for secret values. The workflow tells the user "Edit `<storage_repo>/donna/secrets.md` directly and add `KEY_NAME: your-value`". The user adds the key, then re-runs or continues.
**Warning signs:** Any AskUserQuestion asking for a token, password, or API key value.

### Pitfall 2: tools.md Read Code Not Handling Missing `type` Field
**What goes wrong:** Existing tools.md files have no `type` field. If read code assumes it's always present, it breaks for existing users on upgrade.
**Why it happens:** Schema evolution without defensive parsing.
**How to avoid:** All code reading tools.md must treat missing `type` as `cli`. This includes begin-the-day, run-tools, add-tool, relearn-tools, and adjust-tool.
**Warning signs:** Conditional logic like `if type == "rest"` without an `else` or `default: "cli"` branch.

### Pitfall 3: Git Commit from Within Parallel Task Agents
**What goes wrong:** If a parallel agent tries to commit (e.g., to save tool results), the SSH signing prompt hangs in a subprocess.
**Why it happens:** CLAUDE.md rule: "No git commit/push from subagents — SSH signing requires interactive approval."
**How to avoid:** Parallel agents collect and return results ONLY. All git operations happen in the main workflow after agents finish and smart-merge completes.
**Warning signs:** Any `git commit` or `git push` inside a parallel Task's instructions.

### Pitfall 4: Atomic Write Race During Parallel Merge
**What goes wrong:** If parallel agents each try to write to the daily file, they overwrite each other's results.
**Why it happens:** Concurrent file writes without coordination.
**How to avoid:** The pattern is: agents return raw task lists → main workflow collects all → single smart-merge → single Write. Agents must not write to the daily file directly.
**Warning signs:** Any Write tool call to the daily file inside a Task agent's instructions.

### Pitfall 5: MCP Tool Output Has No Standard Task Format
**What goes wrong:** Different MCP tools return wildly different output structures. Donna can't reliably parse them without tool-specific logic.
**Why it happens:** MCP tools are general-purpose, not task-management specific.
**How to avoid:** For MCP capabilities, Claude uses its understanding of the specific MCP tool to extract task-like items — same approach as "unknown CLI tools" today. Document this in the workflow: "Use your understanding of the tool's output to extract actionable items."
**Warning signs:** Rigid parsing logic that assumes a specific MCP output format.

### Pitfall 6: adjust-tool Missing Installer Registration
**What goes wrong:** New skill exists as stub+workflow but isn't listed in `installer.cjs`, so it never gets copied to user's `.claude/commands/donna/` directory.
**Why it happens:** Easy to forget the installer.cjs update when adding a new skill.
**How to avoid:** Update the `output.success(...)` message in installer.cjs to include `adjust-tool` in the listed skills. Verify with the existing `stubs.test.cjs` pattern — add test assertions for the new stub.
**Warning signs:** `adjust-tool.md` exists in stubs but `installer.cjs` success message doesn't mention it; no test assertions for the new stub file.

---

## Code Examples

### Migration Pattern (003-tool-type-backfill.cjs)
```javascript
// Source: Modeled on existing migrations/002-standing-files-subfolder.cjs
"use strict";

module.exports = {
    version: "0.7.0",
    description: "Backfill type: cli on existing tool sections in tools.md",
    up(ctx) {
        // tools.md lives in the user's storage repo — not accessible from
        // migration context. Queue a pending flag so workflows apply the
        // migration on next skill use (same pattern as move-standing-files).
        const statePath = ctx.path.join(ctx.donnaDir, "state.md");
        if (ctx.fs.existsSync(statePath)) {
            const content = ctx.fs.readFileSync(statePath, "utf8");
            if (content.includes("backfill-tool-type")) return; // idempotent
        }
        ctx.fs.writeFileSync(statePath, "---\npending_migrations:\n  - backfill-tool-type\n---\n", "utf8");
    },
};
```

Note: Like migration 002, this queues a pending flag. Each workflow's `check-pending-migrations` step will handle the actual tools.md update when next run.

### Parallel Agent Invocation Pattern (workflow instruction)
```
Spawn one Task agent per tool in <registered_tools>. Each agent receives:
- The tool name and its capabilities list
- Instructions to run all capabilities sequentially (10-second timeout per command)
- Instructions to return results as a structured list (not write to any file)

Wait for all agents to complete, up to 2 minutes total. After 2 minutes,
collect whatever results have been returned and treat non-responding tools
as failed with warning: "! <tool_name>: timed out (2-minute batch limit)"
```

### secrets.md Placeholder Substitution Pattern (workflow instruction)
```
Before invoking any REST or GraphQL capability:
1. Read <storage_repo>/donna/secrets.md with the Read tool
2. Parse key-value pairs from under the frontmatter
3. For each {{KEY}} placeholder in the capability invocation, substitute the value
4. Never log the substituted values — treat them as opaque strings
5. If a {{KEY}} has no matching entry in secrets.md, print:
   "! <tool_name>: missing secret {{KEY}} — add it to donna/secrets.md"
   and skip that capability
```

### tools.md Type-Aware Parsing Pattern (workflow step)
```
Parse each tool section (starting with ## <tool_name>). For each tool:
- Extract `type` field; if absent, treat as "cli"
- For type: cli — use existing command + capabilities execution
- For type: rest|graphql — use curl invocation with secret substitution
- For type: mcp — invoke MCP tool directly (no Bash)
```

### adjust-tool Stub Template
```markdown
---
name: donna:adjust-tool
description: Edit an existing tool's configuration — scope, capabilities, auth, or command
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna adjust-tool workflow. Edit an existing registered tool's configuration.
</objective>

<execution_context>
@~/.donna/workflows/adjust-tool.md
</execution_context>
```

---

## State of the Art

| Old Approach | New Approach | Impact |
|--------------|--------------|--------|
| Sequential tool execution (one tool at a time) | One Task agent per tool, all tools in parallel | Faster begin-the-day with multiple tools registered |
| CLI tools only | CLI + REST API + GraphQL API + MCP server | Opens Donna to web APIs and AI tool ecosystem |
| No tool editing | `/donna:adjust-tool` menu-driven editing | Users can iterate on tool config without re-adding from scratch |
| tools.md has no type field | `type: cli|rest|graphql|mcp` field | Schema is now self-describing; enables type-specific handling |

---

## Open Questions

1. **MCP output→daily-file task format for structured MCP tools**
   - What we know: Claude understands specific MCP tools and can extract task-like items
   - What's unclear: Should the workflow provide explicit extraction hints per well-known MCP server (like gh/jira/kubectl baselines for CLI)?
   - Recommendation: For Phase 2, treat all MCP tools as "unknown" — Claude uses its understanding of the tool. Document that future phases may add well-known MCP baselines.

2. **GraphQL capability format — query inline vs. named reference**
   - What we know: GraphQL capabilities need a query body, which can be multi-line
   - What's unclear: Multi-line YAML values in tools.md are awkward; alternatives are single-line inline strings or a separate file reference
   - Recommendation: For Phase 2, support single-line queries only (use query string without whitespace, URL-encoded if needed via curl). Add a planner note to keep GraphQL queries short and practical. Complex queries are out of scope.

3. **secrets.md concurrency during parallel agent execution**
   - What we know: All agents read secrets.md at their start
   - What's unclear: Concurrent reads of the same file
   - Recommendation: Read-only concurrent access is safe on all platforms. No coordination needed — agents read but never write secrets.md.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in, v18+) |
| Config file | none — invoked directly |
| Quick run command | `node --test 'test/*.test.cjs'` |
| Full suite command | `node --test 'test/*.test.cjs'` |

### Phase Requirements → Test Map

| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| adjust-tool stub exists with correct frontmatter | unit | `node --test 'test/stubs.test.cjs'` | ❌ Wave 0 (add assertions) |
| adjust-tool workflow file exists and has step structure | unit | `node --test 'test/stubs.test.cjs'` | ❌ Wave 0 (add assertions) |
| installer.cjs mentions adjust-tool in success message | unit | `node --test 'test/installer.test.cjs'` | ❌ Wave 0 (add assertion) |
| Migration 003 exists and is loadable | unit | `node --test 'test/migrator.test.cjs'` | ❌ Wave 0 (add assertion) |
| tools.md type field parse (missing = "cli") | unit | `node --test 'test/*.test.cjs'` | ❌ Wave 0 (new test file) |
| secrets.md placeholder substitution | unit | `node --test 'test/*.test.cjs'` | ❌ Wave 0 (new test file) |

### Sampling Rate
- **Per task commit:** `node --test 'test/*.test.cjs'`
- **Per wave merge:** `node --test 'test/*.test.cjs'`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/stubs.test.cjs` — add describe block for `donna:adjust-tool` stub (exists as stub file, needs test assertions matching pattern of existing stubs)
- [ ] `test/installer.test.cjs` — add assertion that installer success message includes `adjust-tool`
- [ ] `test/migrator.test.cjs` — add assertion that migration 003 exists and exports `version`, `description`, `up`
- [ ] `test/tools-parser.test.cjs` — new file for tools.md type-aware parsing and secrets.md substitution logic (if helper functions are extracted to `src/`)

Note: The workflow logic (parallelization, API calls) lives in workflow markdown and is exercised via manual/integration testing, not unit tests. Unit tests cover the structural artifacts (stubs, installer registration, migration file).

---

## Sources

### Primary (HIGH confidence)
- Direct read of `workflows/add-tool.md` — full add-tool flow, tools.md write format, capability patterns
- Direct read of `workflows/run-tools.md` — pull-fresh-data step, smart-merge algorithm
- Direct read of `workflows/begin-the-day.md` (lines 130-167) — pull-tool-data step structure
- Direct read of `workflows/relearn-tools.md` — version-aware re-learning, tools.md update pattern
- Direct read of `src/migrator.cjs` — migration framework API (`up(ctx)`, `description`, numeric filename ordering)
- Direct read of `src/installer.cjs` — skill registration, workflow copy, provider detection
- Direct read of `migrations/002-standing-files-subfolder.cjs` — pending-flag migration pattern
- Direct read of `stubs/claude-code/donna/add-tool.md` and `run-tools.md` — stub format
- Direct read of `test/stubs.test.cjs` and `test/installer.test.cjs` — test patterns and what's asserted
- Direct read of `.planning/PROJECT.md` — key decisions including "Each tool gets its own agent"

### Secondary (MEDIUM confidence)
- `CLAUDE.md` project instructions — SSH signing constraint, no git from subagents, stub-real-skill convention

### Tertiary (LOW confidence — by design, no external research needed)
None. This phase is entirely internal to the Donna codebase and Claude Code primitives. No external libraries or ecosystem patterns needed.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all existing components read directly from source; no new dependencies
- Architecture patterns: HIGH — derived from reading all canonical reference files listed in CONTEXT.md
- Pitfalls: HIGH — derived from explicit codebase constraints (CLAUDE.md, PROJECT.md) and pattern analysis of existing code
- Discretion decisions (API format, secrets.md structure): MEDIUM — reasoned recommendations, not validated against external sources, but grounded in the project's existing conventions

**Research date:** 2026-03-16
**Valid until:** 2026-05-16 (stable internal domain — no external dependency versioning)
