---
status: diagnosed
trigger: "relearn-tools for GraphQL tool says re-learning not applicable and skips it entirely"
created: 2026-03-20T00:00:00Z
updated: 2026-03-20T00:00:00Z
---

## Current Focus

hypothesis: relearn-tools hard-codes non-CLI tools into unchanged_tools with a user-visible skip message, and has no schema-change detection path for graphql/rest/mcp tools — this is an implementation oversight, not a deliberate design constraint
test: read check-versions and report-unchanged steps in relearn-tools.md
expecting: confirmed skip with no introspection path
next_action: return diagnosis (research-only mode)

## Symptoms

expected: /donna:relearn-tools detects when a GraphQL tool's schema has changed (new/removed fields) and updates stored capabilities accordingly
actual: Running /donna:relearn-tools for a GraphQL tool prints "⊘ <tool_name>: graphql tool — re-learning not applicable (capabilities are user-defined)" and does nothing
errors: no error — silent skip with informational message
reproduction: register a GraphQL tool via add-tool, then run relearn-tools
started: since non-CLI type support was added in phase-02

## Eliminated

(none — research-only investigation)

## Evidence

- timestamp: 2026-03-20T00:00:00Z
  checked: relearn-tools.md check-versions step (lines 96-116)
  found: |
    The step explicitly branches on tool type. For rest/graphql/mcp it adds
    the tool directly to <unchanged_tools> with the comment
    "version checking is not applicable for non-CLI tools."
    No introspection or schema-check path exists.
  implication: graphql tools are never even considered for re-learning

- timestamp: 2026-03-20T00:00:00Z
  checked: relearn-tools.md report-unchanged step (lines 118-136)
  found: |
    The step has a special-case print for rest/graphql/mcp tools:
    "⊘ <tool_name>: <type> tool — re-learning not applicable (capabilities are user-defined)"
    This is the exact message seen in the UAT.
  implication: the skip message is intentional in the current implementation

- timestamp: 2026-03-20T00:00:00Z
  checked: relearn-tools.md relearn-changed step (lines 138-171)
  found: |
    The step opens with an explicit note:
    "Re-learning is currently supported for CLI tools only. REST, GraphQL, and MCP
    tool capabilities are user-defined and not auto-learned."
    Only CLI tools in <changed_tools> are processed here.
  implication: even if a graphql tool reached changed_tools it would not be re-learned

- timestamp: 2026-03-20T00:00:00Z
  checked: add-tool.md learn-capabilities step for graphql (lines 305-316)
  found: |
    For graphql type, add-tool asks the user to define capabilities manually:
    "Define capabilities for <tool_name>. Each capability is a name and a
    GraphQL query (single line)."
    There is NO introspection query step — no curl to /graphql with the
    introspection query, no schema diffing, no automatic field discovery.
    Capabilities are entirely user-typed strings.
  implication: add-tool does NOT introspect GraphQL schemas; the UAT report's
    framing ("add-tool CAN introspect GraphQL schemas") is inaccurate.
    add-tool collects user-supplied queries; it does not run schema introspection.

- timestamp: 2026-03-20T00:00:00Z
  checked: add-tool.md auth-test step for graphql (lines 174-223)
  found: |
    For rest/graphql, add-tool validates connectivity via a plain curl to base_url
    checking HTTP status code. This is a liveness check, not an introspection query.
  implication: confirms add-tool has no schema introspection — only a connectivity test

## Resolution

root_cause: |
  relearn-tools.md hard-codes all non-CLI tools (rest, graphql, mcp) into the
  <unchanged_tools> bucket in check-versions (line 99-101), then emits the
  "re-learning not applicable" message in report-unchanged (lines 121-124).
  The relearn-changed step reinforces this with an explicit design note
  (line 139) stating non-CLI capabilities are "user-defined and not auto-learned."

  This is a deliberate but incomplete design decision: when non-CLI tool support
  was added in phase-02 the relearn path was intentionally deferred ("user-defined")
  rather than built out. The result is that graphql tools have no refresh mechanism
  at all.

  A secondary finding: the UAT issue description claims add-tool "CAN introspect
  GraphQL schemas via introspection queries" — this is incorrect. add-tool asks the
  USER to type capabilities manually; there is no automatic schema introspection in
  the current codebase. Any future relearn enhancement would need to implement
  introspection from scratch, not reuse an existing mechanism.

fix: (not applied — research-only mode)
verification: (not applied — research-only mode)
files_changed: []
