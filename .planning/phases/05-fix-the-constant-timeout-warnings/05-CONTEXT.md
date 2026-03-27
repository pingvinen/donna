# Phase 5: Fix the constant timeout warnings - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Remove or guard all `timeout` binary usage across Donna workflows so they work on systems where `timeout` is not installed (e.g. macOS without coreutils). Replace with the Bash tool's native timeout parameter. Update tests accordingly.

</domain>

<decisions>
## Implementation Decisions

### Guard strategy
- **D-01:** Replace all `timeout N <cmd>` invocations with the Bash tool's native `timeout` parameter (in milliseconds). No external `timeout` binary dependency.
- **D-02:** This applies to all 5 affected workflows: `begin-the-day.md`, `run-tools.md`, `focus.md`, `add-tool.md`, `relearn-tools.md`

### Timeout durations
- **D-03:** Keep the same durations — 10s (10000ms) for tool commands, 15s (15000ms) for GraphQL introspection. Same values, just expressed as Bash tool timeout param.

### Test updates
- **D-04:** Remove the `stubs.test.cjs` assertions that check for `timeout` presence in workflow text. Since the Bash tool handles timeout natively, workflow markdown no longer needs the word "timeout".

### Claude's Discretion
- Exact wording of workflow instructions that tell Claude to use the Bash tool timeout param
- Whether to add a comment in workflows explaining why `timeout` binary is not used

### Folded Todos
- **Stop wrapping commands in "timeout" if timeout is not installed** (ref: #18) — the core problem this phase solves. Claude wraps commands in `timeout` which fails on macOS without coreutils.

</decisions>

<canonical_refs>
## Canonical References

No external specs — requirements fully captured in decisions above

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Bash tool: Already supports a `timeout` parameter (in ms, max 600000). This is the replacement mechanism.

### Established Patterns
- All 5 workflows follow the same pattern: `timeout 10 <command> 2>&1` for CLI tools, `timeout 10 curl ...` for REST/GraphQL APIs
- `relearn-tools.md` uses `timeout 15` for GraphQL introspection (longer timeout)
- `add-tool.md` uses `timeout 10` for auth verification commands (`gh api`, `jira me`, `kubectl auth`)

### Integration Points
- `workflows/begin-the-day.md` — lines 181-232: CLI, REST, and GraphQL tool execution
- `workflows/run-tools.md` — lines 146-226: CLI, REST, GraphQL tool execution + gh item checking
- `workflows/focus.md` — lines 152-179: CLI, REST, GraphQL tool enrichment
- `workflows/add-tool.md` — lines 166-234: auth verification for known tools + URL reachability
- `workflows/relearn-tools.md` — lines 119-136: GraphQL introspection
- `test/stubs.test.cjs` — lines 822-898: assertions checking for timeout in workflow content

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

### Reviewed Todos (not folded)
- **Document why automated periodic run-tools invocations are not supported** (ref: #23) — docs-only, not related to timeout fix
- **Check for new Donna version once per day** — tooling, unrelated to timeout
- **Skip setup prompt when Donna is already configured** — tooling, unrelated to timeout

</deferred>

---

*Phase: 05-fix-the-constant-timeout-warnings*
*Context gathered: 2026-03-27*
