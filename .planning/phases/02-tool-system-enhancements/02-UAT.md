---
status: diagnosed
phase: 02-tool-system-enhancements
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md, 02-06-SUMMARY.md]
started: 2026-03-20T13:00:00Z
updated: 2026-03-20T13:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. adjust-tool skill available
expected: Running `/donna:adjust-tool` shows the skill is registered and invocable.
result: pass

### 2. add-tool offers tool type selection
expected: When invoking `/donna:add-tool`, after naming the tool, a numbered menu presents 4 options: CLI tool, REST API, GraphQL API, MCP server.
result: pass

### 3. REST/GraphQL URL entry works smoothly
expected: When adding a REST or GraphQL tool, the base URL prompt is a clean question without inline examples that confuse Claude Code's picker. Typing the URL directly works without tab/menu issues.
result: issue
reported: "I still cannot extend the answer like I can often do with GSD questions. When I say that I will enter it manually, I am presented with a new menu with 2 options with values where the description says 'placeholder .....' and then the generic 'Type something' option - i.e. basically the same unhelpful UX as before. You can enter the url via the 'Type something' option, but given that GSD is able to make me extend answers in a lot of places, it should be possible here too."
severity: minor

### 4. REST/GraphQL secret management
expected: When adding a REST or GraphQL tool, the workflow asks for auth header name and secret KEY NAME (never the actual secret). It creates `donna/secrets.md` with a `REPLACE_WITH_YOUR_SECRET` placeholder and ensures `donna/secrets.md` is in `.gitignore`.
result: pass

### 5. relearn-tools handles non-CLI types correctly
expected: Running `/donna:relearn-tools` when you have GraphQL tools introspects the API schema to detect changes (not just "re-learning not applicable"). REST and MCP tools still show "not applicable". GraphQL tools with no secret or failed introspection are gracefully skipped.
result: issue
reported: "I tried re-learning a GraphQL tool where I had previously defined auth (which the actual site does not require). I had claude remove it, but when I run 're-learn' it now says: '- swapi: graphql tool, no auth_secret configured → unchanged (skipped — no secret configured)'. Auth is not a requirement for all tools!"
severity: major

### 6. Parallel tool execution in run-tools
expected: When multiple tools are configured, `/donna:run-tools` spawns one Task agent per tool for parallel execution. Single tool runs directly without Task overhead. A 2-minute global timeout applies.
result: issue
reported: "Nothing in the output suggests that queries were made in parallel (it was before the fixes). The parallel execution launched but a single tool failure (Jira command not found) cancelled the other parallel queries (swapi GraphQL). Tools should fail independently — one tool's error shouldn't cancel others."
severity: major

### 7. Migration handles pre-existing non-CLI tools
expected: The backfill-tool-type migration uses heuristic detection: tools with `mcp:` prefix in command get `type: mcp`, tools with `base_url` field get `type: rest` or `type: graphql`, and only tools with no non-CLI indicators default to `type: cli`.
result: pass

### 8. adjust-tool detects capability format mismatches
expected: When changing a tool's type via `/donna:adjust-tool` (e.g., CLI to MCP), it detects that existing capabilities don't match the new type's format and offers 3 repair options: re-enter capabilities, clear them, or keep as-is.
result: pass

### 9. README documents new capabilities
expected: README.md includes: four tool types listed (CLI, REST API, GraphQL API, MCP server), parallel execution mention, adjust-tool in the command table, and secure secret management via gitignored secrets.md.
result: pass

### 10. Migration 003 and tests pass
expected: Running `node --test test/migrator.test.cjs` passes all tests including the 003-tool-type-backfill migration test.
result: pass

## Summary

total: 10
passed: 7
issues: 3
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "add-tool URL entry flow works smoothly for REST/GraphQL tools"
  status: failed
  reason: "User reported: I still cannot extend the answer like I can often do with GSD questions. When I say that I will enter it manually, I am presented with a new menu with 2 options with values where the description says 'placeholder .....' and then the generic 'Type something' option - i.e. basically the same unhelpful UX as before. You can enter the url via the 'Type something' option, but given that GSD is able to make me extend answers in a lot of places, it should be possible here too."
  severity: minor
  test: 3
  root_cause: "The learn-capabilities AskUserQuestion prompts for REST/GraphQL/MCP (lines 307-345) contain Examples: sections with hyphen-prefixed bullet lines that Claude Code parses as picker options. The URL prompt itself (line 134) is clean, but the capabilities step later in the flow triggers the picker UX. The workflow already documents this risk at line 130 but didn't apply it consistently."
  artifacts:
    - path: "workflows/add-tool.md"
      issue: "Lines 307-345: learn-capabilities prompts embed Examples: with bullet lines inside AskUserQuestion text"
  missing:
    - "Move Examples: content out of AskUserQuestion — print examples as regular output before calling AskUserQuestion with a clean prompt"
    - "Apply same treatment to graphql (lines 321-330) and mcp (lines 334-344) capability prompts"
  debug_session: ""

- truth: "relearn-tools introspects GraphQL APIs without requiring auth"
  status: failed
  reason: "User reported: GraphQL tool with no auth_secret says 'skipped — no secret configured' but auth is not a requirement for all tools. Introspection should work without auth on public APIs."
  severity: major
  test: 5
  root_cause: "relearn-tools.md lines 112-113: graphql branch unconditionally gates on auth_secret — if missing or placeholder, tool is added to unchanged_tools with 'skipped — no secret configured'. The curl command on lines 116-121 hardcodes -H '<auth_header>: <resolved_secret>' so the gate exists to prevent running with unresolved placeholders. Auth is not required for public GraphQL APIs."
  artifacts:
    - path: "workflows/relearn-tools.md"
      issue: "Lines 112-113: Hard gate on auth_secret before GraphQL introspection"
    - path: "workflows/relearn-tools.md"
      issue: "Lines 116-121: curl command unconditionally includes auth header"
  missing:
    - "Make auth header conditional: if auth_secret exists and is not placeholder, include -H header; otherwise omit it"
    - "Remove hard gate — allow introspection to proceed without auth for public APIs"
  debug_session: ""

- truth: "Parallel tool execution is resilient — one tool failure doesn't cancel others"
  status: failed
  reason: "User reported: Nothing in the output suggests that queries were made in parallel. A single tool failure (Jira command not found) cancelled the other parallel queries (swapi GraphQL). Tools should fail independently."
  severity: major
  test: 6
  root_cause: "Claude Code platform limitation: when multiple Task agents are spawned as parallel tool calls, an unhandled error in one agent (jira exit 127) propagates upward and cancels sibling agents. The workflow instructions for error handling are inside each agent, but the platform cancels at the batch level before agents can handle their own errors. This is not a workflow bug."
  artifacts:
    - path: "workflows/run-tools.md"
      issue: "Lines 123-141: parallel Task agent spawning is vulnerable to platform-level sibling cancellation"
    - path: "workflows/begin-the-day.md"
      issue: "Lines 159-175: same parallel execution pattern duplicated"
  missing:
    - "Switch from parallel Task agents to sequential execution with explicit error isolation per tool"
    - "Wrap each tool's execution so failure records a warning and continues to next tool"
    - "Apply to both run-tools.md and begin-the-day.md"
  debug_session: ""
