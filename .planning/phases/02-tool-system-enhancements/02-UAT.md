---
status: diagnosed
phase: 02-tool-system-enhancements
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-03-17T12:00:00Z
updated: 2026-03-20T12:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. adjust-tool skill available
expected: Running `/donna:adjust-tool` (or checking available skills) shows the adjust-tool skill is registered and invocable. The stub file exists at `stubs/claude-code/donna/adjust-tool.md`.
result: pass

### 2. add-tool offers tool type selection
expected: The add-tool workflow (`workflows/add-tool.md`) contains an `ask-tool-type` step that presents a numbered menu with 4 options: CLI tool, REST API, GraphQL API, MCP server. When invoking `/donna:add-tool`, after naming the tool, the user is asked which type it is.
result: pass

### 3. REST/GraphQL tool registration flow
expected: When adding a REST or GraphQL tool via `/donna:add-tool`, the workflow asks for base URL, auth header name, and secret KEY NAME (never the actual secret value). It creates `donna/secrets.md` with a `REPLACE_WITH_YOUR_SECRET` placeholder and ensures `donna/secrets.md` is in `.gitignore`.
result: issue
reported: "The option to actually enter the URL of a RESTApi or GraphQL tool does not work. If I pick the 'I'll enter it' I cannot use 'tab' to extend the text and it just leads me to a menu where I can pick the guessed value, 'aborting' and the standard 'type something'. If I 'type something', then it is picked up, but it is not exactly user friendly in my opinion."
severity: minor

### 4. Non-CLI tools handled in relearn-tools
expected: Running `/donna:relearn-tools` when you have REST/GraphQL/MCP tools in tools.md shows them as "not applicable (capabilities are user-defined)" and skips version checking for them. Only CLI tools go through the version comparison flow.
result: issue
reported: "For a GraphQL tool it just says 're-learning not applicable', which I am uncertain whether I agree with. The flow for adding is able to pick up capabilities from the api, so it should at least check that none of what is stored has been removed or meaningfully changed (perhaps there are new fields that holds something useful)."
severity: minor

### 5. Parallel tool execution in run-tools
expected: When multiple tools are configured, `/donna:run-tools` spawns one Task agent per tool for parallel execution rather than running them sequentially. Single tool still runs directly without Task overhead. A 2-minute global timeout applies.
result: pass

### 6. README documents new capabilities
expected: README.md includes: four tool types listed (CLI, REST API, GraphQL API, MCP server), parallel execution mention, adjust-tool in the command table, and secure secret management via gitignored secrets.md.
result: pass

### 7. Migration 003 and tests pass
expected: Running `node --test test/migrator.test.cjs` passes all tests including the 003-tool-type-backfill migration test. The migration file exists at `migrations/003-tool-type-backfill.cjs`.
result: pass

### 8. Migration handles pre-existing non-CLI tools
expected: The backfill-tool-type migration correctly identifies tools that were already registered as non-CLI (e.g., MCP server) and preserves their type instead of blindly stamping `type: cli` on all tools missing a type field.
result: issue
reported: "Alpha tester had previously registered an MCP server. Migration assumes all tools are CLI and backfilled type: cli on it, causing breakage."
severity: major

### 9. MCP tool works after manual fix
expected: After correcting an MCP tool's type in tools.md from `type: cli` to `type: mcp`, run-tools executes it via native MCP invocation without errors.
result: issue
reported: "After fixing the MCP entry, Donna still complains: 'teams-outlook: MCP server — not executable as CLI tool (see donna/tools.md note)'"
severity: major

## Summary

total: 9
passed: 5
issues: 4
pending: 0
skipped: 0

## Gaps

- truth: "add-tool URL entry flow works smoothly for REST/GraphQL tools"
  status: failed
  reason: "User reported: The 'I'll enter it' option for URL entry has poor UX — tab doesn't extend text, leads to confusing menu with guessed value, 'aborting', and 'type something'. Typing something works but flow is not user friendly."
  severity: minor
  test: 3
  root_cause: "AskUserQuestion prompt includes inline (e.g., https://api.github.com) example which Claude Code surfaces as a selectable option instead of plain free-text input. Tab navigates menu instead of extending text."
  artifacts:
    - path: "workflows/add-tool.md"
      issue: "Lines 123-124: Base URL prompt contains e.g. example that AskUserQuestion treats as a candidate answer"
  missing:
    - "Remove inline e.g. from AskUserQuestion prompt text — move example to workflow prose visible only to Claude"
    - "Simplify prompt to plain question like 'What is the base URL for <tool_name>?'"
  debug_session: ""

- truth: "relearn-tools re-introspects non-CLI tools to detect schema changes"
  status: failed
  reason: "User reported: GraphQL tool just says 're-learning not applicable' but the add flow can introspect the API schema, so relearn should at least check for removed or changed fields and new useful fields."
  severity: minor
  test: 4
  root_cause: "relearn-tools.md hard-codes all non-CLI tools into skip path at lines 99-101 (routes graphql to unchanged_tools) and line 139 (note: non-CLI capabilities are user-defined). This was a deliberate deferral, not an oversight. Note: add-tool also has no automatic GraphQL introspection — capabilities are user-typed — so introspection would need to be built from scratch."
  artifacts:
    - path: "workflows/relearn-tools.md"
      issue: "Lines 99-101: Hard routes graphql to unchanged_tools with no introspection path"
    - path: "workflows/relearn-tools.md"
      issue: "Lines 121-124: Emits 're-learning not applicable' message"
    - path: "workflows/add-tool.md"
      issue: "Lines 305-316: GraphQL capabilities are user-typed, no introspection query exists to reuse"
  missing:
    - "Add GraphQL schema introspection query via curl against base_url with stored auth"
    - "Diff returned schema against stored capabilities to detect new/removed fields"
    - "Surface schema changes to user and offer interactive capability update"
    - "REST and MCP can continue to skip — only graphql has introspection support"
  debug_session: ""

- truth: "backfill-tool-type migration preserves existing non-CLI tool types"
  status: failed
  reason: "Alpha tester had an MCP server registered before the migration. backfill-tool-type blindly inserts type: cli on all tools missing a type line, overwriting the implicit MCP type."
  severity: major
  test: 8
  root_cause: "backfill-tool-type handler (line 61 in all workflows containing it) does 'if type: line missing, insert type: cli' — it has no logic to detect pre-existing non-CLI tools. Before the type field existed, tools had no type marker, but some users had already registered MCP/REST tools via manual editing or earlier experiments. The migration should check for MCP/REST indicators (e.g., command field containing mcp: prefix, or base_url field) before defaulting to cli."
  artifacts:
    - path: "workflows/run-tools.md"
      issue: "Line 61: backfill inserts type: cli unconditionally when type line is missing"
    - path: "workflows/begin-the-day.md"
      issue: "Line 61: same backfill logic duplicated"
    - path: "workflows/add-tool.md"
      issue: "Line 61: same backfill logic duplicated"
    - path: "workflows/relearn-tools.md"
      issue: "Line 61: same backfill logic duplicated"
    - path: "workflows/adjust-tool.md"
      issue: "Line 64: same backfill logic duplicated"
  missing:
    - "Add type detection heuristics: check command field for mcp: prefix → type: mcp, check for base_url field → type: rest or graphql, default to cli only if no indicators found"
    - "Update backfill handler in all 5 workflow files"
  debug_session: ""

- truth: "MCP tools execute correctly via native MCP invocation after type correction"
  status: failed
  reason: "Alpha tester reports 'teams-outlook: MCP server — not executable as CLI tool (see donna/tools.md note)' even after manually fixing type to mcp in tools.md"
  severity: major
  test: 9
  root_cause: "Downstream symptom of gap 8. Most likely cause: the tester fixed the type field but run-tools still failed because (a) the capability format was wrong — MCP capabilities need format 'name: mcp:<server>/<tool>' but the backfill left them in CLI format, or (b) Claude cached the old tool state and the error message is stale from before the fix. The workflow itself (run-tools.md lines 196-203) handles type: mcp correctly — the issue is the tool data in tools.md was corrupted by the bad backfill and only partially fixed."
  artifacts:
    - path: "workflows/run-tools.md"
      issue: "Lines 196-203: MCP execution path is correct, but depends on capability format being mcp:<server>/<tool>"
  missing:
    - "Fix gap 8 first (correct backfill), which prevents this cascade"
    - "Add a recovery/repair step in adjust-tool that can detect and fix capability format mismatches for a given tool type"
  debug_session: ""
