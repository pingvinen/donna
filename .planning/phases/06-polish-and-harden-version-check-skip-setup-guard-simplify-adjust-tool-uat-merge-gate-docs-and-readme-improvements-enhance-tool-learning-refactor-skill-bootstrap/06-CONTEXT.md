# Phase 6: Polish and Harden - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Polish and harden the existing Donna skill suite: add a daily version check, suppress the setup prompt when already configured, simplify adjust-tool by removing type change support, add a GitHub Actions UAT merge gate, improve docs/README, enhance tool learning with cascading sources, and refactor the per-workflow bootstrap into a reusable CJS module. No new skills are added.

</domain>

<decisions>
## Implementation Decisions

### Version check
- **D-01:** Check npm registry once per day — first skill invocation of the day calls `npm view @pingvinen/donna-assistant version` via Bash with a short timeout. Cache result in `~/.donna/` so subsequent calls skip the check.
- **D-02:** Non-blocking hint when update available — print a single line like "Donna vX.Y.Z available — run npx @pingvinen/donna-assistant to update" then continue with the skill normally.
- **D-03:** Version check runs as part of the bootstrap module (see D-10). The bootstrap JSON response includes an `update_available` field; workflows print the hint if present.

### Skip-setup guard
- **D-04:** The installer (`installer.cjs`) currently always prints "Run /donna:setup in Claude Code to get started" at the end. When config.md (with a storage_repo path) already exists, suppress that message. No workflow-level guards needed — this is purely an installer UX fix.

### Simplify adjust-tool
- **D-05:** Remove type change support from `/donna:adjust-tool`. Type is set at add-tool time and stays fixed. Simplifies the adjust-tool workflow by removing the type change flow and associated capability format repair logic.

### UAT merge gate
- **D-06:** Add a GitHub Actions workflow that blocks merging if UAT has not been finalized. Implementation details are Claude's discretion — the key requirement is that PRs cannot merge without UAT passing.

### Docs and README improvements
- **D-07:** Group the skills list in README.md into logical categories (e.g., "Setup", "Daily workflow", "Tool management") for easier comprehension. (ref: #22)
- **D-08:** Add documentation explaining why automated periodic run-tools invocations are not supported. (ref: #23)

### Enhanced tool learning
- **D-09:** Cascading learning approach for both add-tool and relearn-tools:
  1. Local README/docs in the tool's package directory
  2. Web docs via fetch if local docs not found
  3. Source code analysis if docs are insufficient — ask the user first: "Docs covered N capabilities. Want me to analyze the source code for more?"
  The current approach (--help for unknown CLIs, training data for well-known CLIs, GraphQL introspection) remains as the baseline. The cascade adds richer sources on top.

### Bootstrap refactor
- **D-10:** Extract the repeated per-workflow bootstrap into a CJS module (`src/bootstrap.cjs`), following the GSD `gsd-tools.cjs` pattern. Workflows call it via Bash; it returns JSON with config, migration status, setup check, and version check results.
- **D-11:** The bootstrap module covers: config reading (storage_repo, daily_folder, auto_push), migration runner (move-standing-files, backfill-tool-type), Obsidian daily-notes sync, and the once-per-day version check (D-03).
- **D-12:** Migrations move from markdown instructions to testable JavaScript inside bootstrap.cjs. Each workflow replaces its inline bootstrap steps with a single `node bootstrap.cjs` call.

### Claude's Discretion
- UAT merge gate implementation details (D-06)
- Specific grouping categories for README skills list (D-07)
- Bootstrap CJS module API shape and error handling

### Folded Todos
- **Check for new Donna version once per day** (tooling) — covered by D-01/D-02/D-03
- **Skip setup prompt when Donna is already configured** (tooling) — covered by D-04
- **Simplify adjust-tool — remove type change support** (tooling) — covered by D-05
- **Add GitHub workflow that blocks merging if UAT not finalized** (ci, ref: #27) — covered by D-06
- **Make the skills list in README easier to comprehend with grouping** (docs, ref: #22) — covered by D-07
- **Document why automated periodic run-tools invocations are not supported** (docs, ref: #23) — covered by D-08
- **Enhance tool learning to read source code, docs, and API schemas** (tooling, ref: #20) — covered by D-09
- **Refactor skill bootstrap (config, migrations) into reusable module** (tooling, ref: #30) — covered by D-10/D-11/D-12

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Installer and bootstrap
- `src/installer.cjs` — Current installer logic, including the setup prompt to suppress (D-04)
- `src/version.cjs` — Version read/write utilities, relevant to version check caching (D-01)
- `src/migrator.cjs` — Current migration runner, to be absorbed into bootstrap.cjs (D-12)

### Workflows (bootstrap duplication)
- `workflows/relearn-tools.md` — Canonical example of the repeated bootstrap pattern (read-config, check-pending-migrations, Obsidian sync)
- `workflows/begin-the-day.md` — Another workflow with the full bootstrap sequence
- `workflows/adjust-tool.md` — Contains type change logic to be removed (D-05)

### CI/CD
- `.github/workflows/` — Existing GitHub Actions workflows; UAT merge gate (D-06) goes here

### Documentation
- `README.md` — Skills list to be restructured (D-07), run-tools docs to be added (D-08)

### GitHub Issues
- Issue #22 — README skills grouping
- Issue #23 — Document periodic run-tools limitation
- Issue #20 — Enhanced tool learning
- Issue #27 — UAT merge gate
- Issue #30 — Refactor skill bootstrap

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/version.cjs` — readVersion/writeVersion functions for ~/.donna/version.md; can be reused for version check caching
- `src/migrator.cjs` — runMigrations function; migration logic to be moved into bootstrap.cjs
- `src/output.cjs` — Banner/info/success/fail formatting; use for version check hint output

### Established Patterns
- **Stub + workflow split:** Skills have a stub (src/stubs/ or src/providers/) and a workflow (workflows/*.md). Bootstrap refactor should not break this pattern.
- **GSD gsd-tools.cjs pattern:** CJS module called via Bash, returns JSON. Bootstrap.cjs should follow the same convention.
- **Migration system:** Cumulative migrations in migrations/ dir, tracked by version.md lastMigration counter

### Integration Points
- Every workflow's `read-config` and `check-pending-migrations` steps will be replaced by a bootstrap.cjs call
- `installer.cjs` line 102 is where the setup prompt message lives (D-04)
- `.github/workflows/pr-validation.yml` (or similar) is where the UAT merge gate plugs in

</code_context>

<specifics>
## Specific Ideas

- Bootstrap CJS module should follow the GSD `gsd-tools.cjs` pattern — user explicitly referenced this as the model to follow
- Tool learning cascade: local docs -> web docs -> source code analysis (with user opt-in for source code). User wants the option to "go really deep" into tool code.
- Skip-setup guard is simpler than initially scoped — just suppress the installer's "Run /donna:setup" message, not a workflow-level guard

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- **Make UAT easier with sandbox environment and test tools** (testing, ref: #19) — separate concern from the merge gate; belongs in its own phase
- **Evaluate natural language input as alternative to slash commands** (general) — exploratory work, not polish/hardening

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-polish-and-harden*
*Context gathered: 2026-03-27*
