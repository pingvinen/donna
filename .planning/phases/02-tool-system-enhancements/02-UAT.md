---
status: complete
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

## Summary

total: 7
passed: 5
issues: 2
pending: 0
skipped: 0

## Gaps

- truth: "add-tool URL entry flow works smoothly for REST/GraphQL tools"
  status: failed
  reason: "User reported: The 'I'll enter it' option for URL entry has poor UX — tab doesn't extend text, leads to confusing menu with guessed value, 'aborting', and 'type something'. Typing something works but flow is not user friendly."
  severity: minor
  test: 3
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""

- truth: "relearn-tools re-introspects non-CLI tools to detect schema changes"
  status: failed
  reason: "User reported: GraphQL tool just says 're-learning not applicable' but the add flow can introspect the API schema, so relearn should at least check for removed or changed fields and new useful fields."
  severity: minor
  test: 4
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
