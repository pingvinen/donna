---
phase: 02-tool-system-enhancements
verified: 2026-03-20T14:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification:
  previous_status: passed
  previous_score: 10/10
  gaps_closed:
    - "backfill-tool-type migration detects MCP tools by mcp: prefix in command"
    - "backfill-tool-type migration detects REST/GraphQL tools by base_url field"
    - "backfill-tool-type defaults to type: cli only when no non-CLI indicators found"
    - "add-tool URL entry prompt is a plain question without inline examples"
    - "relearn-tools introspects GraphQL tools via __schema query"
    - "REST and MCP tools continue to skip re-learning"
    - "adjust-tool detects capability format mismatches on type change and offers repair"
  gaps_remaining: []
  regressions: []
gaps:
  - truth: "backfill-tool-type migration executes correctly in adjust-tool for users with both migrations pending"
    status: resolved
    reason: "Fixed: removed misplaced cleanup block between the two migration handlers. Only one cleanup remains at the correct position after all handlers."
    artifacts:
      - path: "workflows/adjust-tool.md"
        issue: "Lines 57-62: state.md cleanup block is placed between the two migration handlers, not after both. Lines 84-89 duplicate the cleanup at the correct position. Fix: remove the first cleanup block (lines 57-62) so only one remains at line 84."
    missing:
      - "Remove the duplicate/misplaced cleanup block at lines 57-62 of adjust-tool.md (the one between the two handlers)"
      - "The second cleanup block at lines 84-89 is correctly positioned and should be kept"
human_verification:
  - test: "End-to-end GraphQL relearn with live API"
    expected: "Running /donna:relearn-tools with a GraphQL tool that has a real secret triggers schema introspection, reports field changes, and offers interactive update"
    why_human: "GraphQL introspection requires a live API and secret; schema diff logic depends on runtime response parsing"
  - test: "adjust-tool type change with capability format repair"
    expected: "Changing an MCP tool from type: cli to type: mcp detects that capabilities are in CLI format, presents the mismatch, and allows re-entry in mcp:server/tool format"
    why_human: "Interactive AskUserQuestion loop; capability format detection logic cannot be verified statically"
  - test: "Parallel execution with 3 tools in begin-the-day"
    expected: "All 3 tools queried concurrently; daily file assembled after 2-minute timeout or all Tasks return"
    why_human: "Task agent spawning and concurrent execution are runtime behaviors"
---

# Phase 2: Tool System Enhancements Verification Report

**Phase Goal:** Expand the tool system — parallelize tool capability commands for faster data pulls, add an adjust-tool skill for iterative tool configuration refinement, and support non-CLI tools (APIs and MCP servers)
**Verified:** 2026-03-20T14:00:00Z
**Status:** gaps_found
**Re-verification:** Yes — after UAT gap closure (plans 02-05 and 02-06)

## Context

Previous verification (2026-03-16) passed with 10/10 truths. UAT run after that found 4 issues:
- 2 minor (URL UX, relearn-tools GraphQL skip)
- 2 major (blind backfill corrupting pre-existing non-CLI tools, MCP execution failure cascade)

Gap closure plans 02-05 and 02-06 were executed (commits 44c6d16 and 1ae3530). This re-verification checks all original truths plus the 4 gap-closure truths.

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | Migration 003 exists and queues backfill-tool-type pending flag | VERIFIED | `migrations/003-tool-type-backfill.cjs` — version 0.7.0, exports up() fn, writes backfill-tool-type to state.md |
| 2  | All 5 tool workflows handle backfill-tool-type with heuristic detection | VERIFIED | All 5 workflows contain heuristic logic: mcp: prefix check, base_url check, cli default |
| 3  | Existing tools without type field are treated as cli everywhere | VERIFIED | `treat as "cli"` in run-tools.md, begin-the-day.md, relearn-tools.md, adjust-tool.md; add-tool writes `type: cli` |
| 4  | add-tool asks user to choose tool type (CLI, REST API, GraphQL API, MCP server) | VERIFIED | ask-tool-type step at line 109 of workflows/add-tool.md |
| 5  | REST/GraphQL tools registered with base_url, auth_header, auth_secret fields | VERIFIED | All 3 fields present in add-tool.md write-tools-md step |
| 6  | MCP tools registered with mcp: prefixed capability names | VERIFIED | `mcp:<server>/<tool>` format in add-tool.md, begin-the-day.md, run-tools.md |
| 7  | secrets.md auto-added to .gitignore when API tool registered | VERIFIED | add-tool.md explicitly appends `donna/secrets.md` to `.gitignore` |
| 8  | begin-the-day and run-tools spawn one Task agent per tool for parallel execution | VERIFIED | "spawn one Task agent per tool" in both workflows; 2-minute global timeout confirmed |
| 9  | adjust-tool skill exists with stub, full workflow, installer registration | VERIFIED | Stub + workflow exist, installer includes adjust-tool in skill list (line 82) |
| 10 | relearn-tools introspects GraphQL tools to detect schema changes | VERIFIED | `__schema` introspection query in check-versions step (line 119); new relearn-graphql step |
| 11 | add-tool URL entry prompt is plain question without inline e.g. picker options | VERIFIED | AskUserQuestion text "What is the base URL for <tool_name>?" — no e.g. in prompt text; examples moved to prose |
| 12 | backfill-tool-type migration executes correctly in adjust-tool | FAILED | adjust-tool.md has state.md cleanup at line 57 BEFORE the backfill-tool-type handler at line 64 — other 4 workflows have cleanup once at end |

**Score:** 11/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `migrations/003-tool-type-backfill.cjs` | Migration queues backfill-tool-type flag | VERIFIED | version 0.7.0, exports up fn, idempotent |
| `workflows/add-tool.md` | Type selection + heuristic backfill + clean prompts + REST/GraphQL/MCP + secrets.md | VERIFIED | ask-tool-type step, plain URL prompt, heuristic backfill, all type formats present |
| `workflows/run-tools.md` | Parallel Task-per-tool + type-aware execution + heuristic backfill | VERIFIED | spawn one Task agent per tool, 2-minute timeout, curl, mcp: present |
| `workflows/begin-the-day.md` | Parallel Task-per-tool + type-aware execution + heuristic backfill | VERIFIED | spawn one Task agent per tool, 2-minute timeout, curl, mcp: present |
| `workflows/relearn-tools.md` | GraphQL introspection + REST/MCP skip + heuristic backfill | VERIFIED | __schema query, relearn-graphql step, REST/MCP unchanged path |
| `workflows/adjust-tool.md` | Full menu-driven editing + format repair + heuristic backfill | PARTIAL | Format repair present (lines 183-220), backfill logic present, but state.md cleanup mis-ordered |
| `stubs/claude-code/donna/adjust-tool.md` | Skill stub with correct frontmatter | VERIFIED | name: donna:adjust-tool, @~/.donna/workflows/adjust-tool.md reference |
| `src/installer.cjs` | Installer includes adjust-tool | VERIFIED | adjust-tool in success message skill list at line 82 |
| `test/migrator.test.cjs` | Test for migration 003 | VERIFIED | References 003-tool-type-backfill, all 10 tests pass |
| `test/stubs.test.cjs` | Tests for adjust-tool stub + workflow | VERIFIED | adjustToolStubPath, adjustToolWorkflowPath, 166 tests pass |
| `test/installer.test.cjs` | Test that installer mentions adjust-tool | VERIFIED | adjust-tool assertion, 31 tests pass |
| `README.md` | Updated with new tool types, parallel execution | VERIFIED | REST APIs, parallel mention, /donna:adjust-tool in command table |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `migrations/003-tool-type-backfill.cjs` | `~/.donna/state.md` | Writes pending_migrations flag | WIRED | `ctx.fs.writeFileSync(statePath, pendingFlag)` in up() function |
| `workflows/add-tool.md` | `<storage_repo>/donna/secrets.md` | Creates template + adds to .gitignore | WIRED | Creates file, adds `donna/secrets.md` to .gitignore |
| `workflows/add-tool.md` | `donna/tools.md` | Writes type-specific tool section | WIRED | type: rest, type: graphql, type: mcp sections all present |
| `stubs/claude-code/donna/adjust-tool.md` | `workflows/adjust-tool.md` | @~/.donna/workflows/adjust-tool.md reference | WIRED | Exact reference at line 16 of stub |
| `src/installer.cjs` | `stubs/claude-code/donna/adjust-tool.md` | cpSync copies entire stubs directory | WIRED | adjust-tool in success message; stubs dir copied wholesale |
| `workflows/begin-the-day.md` | Claude Code Task tool | Spawns one Task agent per tool | WIRED | "spawn one Task agent per tool" at line 161 |
| `workflows/run-tools.md` | Claude Code Task tool | Spawns one Task agent per tool | WIRED | "spawn one Task agent per tool" at line 126 |
| `workflows/begin-the-day.md` | `<storage_repo>/donna/secrets.md` | Agents read secrets for API substitution | WIRED | secrets.md read for auth_secret resolution |
| `workflows/relearn-tools.md` | GraphQL introspection | curl POST to base_url with __schema query | WIRED | Line 119 contains __schema query |
| `workflows/adjust-tool.md` | capability format repair | format check after type change | PARTIAL | Format mismatch detection present (lines 183-220); wiring broken by misplaced state.md cleanup before backfill handler |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| TOOL-01 | 02-04 | Parallel execution (one Task agent per tool) | SATISFIED | begin-the-day.md + run-tools.md both spawn Tasks, 2-min timeout |
| TOOL-02 | 02-01, 02-05 | Type field + migration backfill (heuristic) | PARTIALLY SATISFIED | Migration 003 exists; heuristic backfill in 4/5 workflows correct; adjust-tool.md has mis-ordered cleanup |
| TOOL-03 | 02-03, 02-04 | REST API support | SATISFIED | ask-tool-type, base_url/auth_header/auth_secret, curl in add-tool + execution |
| TOOL-04 | 02-03, 02-04, 02-06 | GraphQL API support | SATISFIED | type: graphql branch, curl POST with JSON query body, __schema introspection in relearn-tools |
| TOOL-05 | 02-03, 02-04, 02-05 | MCP server support | SATISFIED | type: mcp branch, mcp: capability format, native invocation |
| TOOL-06 | 02-03 | secrets.md infrastructure | SATISFIED | secrets.md template created, .gitignore updated, REPLACE_WITH_YOUR_SECRET placeholder |
| TOOL-07 | 02-02, 02-06 | adjust-tool skill | PARTIALLY SATISFIED | Stub + 10-step workflow with format repair; state.md cleanup order defect may cause backfill to skip in adjust-tool context |
| TOOL-08 | 02-02 | Installer + tests | SATISFIED | installer.cjs updated, migrator/stubs/installer tests all pass (10+166+31) |

No orphaned requirements — all 8 TOOL IDs declared in ROADMAP.md are accounted for.

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `workflows/adjust-tool.md` | 57-62 | Duplicate/misplaced state.md cleanup block — appears BETWEEN move-standing-files and backfill-tool-type handlers | Blocker | If user has both migrations pending and runs adjust-tool first, state.md cleanup fires after move-standing-files completes (line 57), clearing backfill-tool-type from the queue before the backfill handler (line 64) can execute it. Other 4 workflows correctly have cleanup once at end. |

### Human Verification Required

#### 1. GraphQL schema introspection in relearn-tools

**Test:** Register a GraphQL tool with a real secret, run `/donna:relearn-tools`. Verify that schema introspection fires (curl to __schema), changes are reported, and the interactive update loop works.
**Expected:** Schema fields compared against stored capabilities; new/removed fields surfaced to user; capability update offered.
**Why human:** Live API required; schema diff depends on runtime response parsing.

#### 2. adjust-tool type change with capability format repair

**Test:** Register an MCP tool, deliberately corrupt its type to cli in tools.md, then run `/donna:adjust-tool <tool>`, change type back to mcp, verify mismatch is detected and repair options presented.
**Expected:** "Capability format mismatch detected" message with list of mismatched capabilities and 3 repair options.
**Why human:** Interactive AskUserQuestion loop and format detection logic cannot be verified statically.

#### 3. Parallel tool execution with 3 tools

**Test:** Register 3 tools (1 CLI, 1 REST, 1 MCP), run `/donna:begin-the-day`, observe concurrent execution.
**Expected:** All 3 tools queried in parallel; daily file assembled after 2-minute timeout or all Tasks return; failures per tool do not block others.
**Why human:** Task agent spawning is a runtime behavior; grep confirms instructions exist but not that Claude executes them correctly in parallel.

### Gaps Summary

One gap blocks full goal achievement: `workflows/adjust-tool.md` has the state.md cleanup instruction inserted BETWEEN the two migration handlers (move-standing-files and backfill-tool-type) rather than after both. This means a user who runs `adjust-tool` with both migrations pending will have backfill-tool-type cleared from the queue before it executes, resulting in their non-CLI tools remaining without a type field and subject to incorrect runtime handling.

The fix is surgical: remove lines 57-62 from adjust-tool.md (the first, misplaced cleanup block). The second cleanup block at lines 84-89 is correctly positioned and should be kept.

All 4 other tool workflows (add-tool, run-tools, begin-the-day, relearn-tools) have the correct single-cleanup structure. All tests pass (10/10 migrator, 166/166 stubs, 31/31 installer). The gap closure plans 02-05 and 02-06 successfully addressed all 4 UAT issues except this structural defect which was introduced in the original plan 02-02 and not caught during gap closure.

---

_Verified: 2026-03-20T14:00:00Z_
_Verifier: Claude (gsd-verifier)_
