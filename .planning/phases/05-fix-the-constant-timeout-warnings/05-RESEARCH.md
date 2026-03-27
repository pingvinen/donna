# Phase 05: Fix the Constant Timeout Warnings - Research

**Researched:** 2026-03-27
**Domain:** Workflow markdown authoring + Node.js test assertions
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Replace all `timeout N <cmd>` invocations with the Bash tool's native `timeout` parameter (in milliseconds). No external `timeout` binary dependency.
- **D-02:** Applies to all 5 affected workflows: `begin-the-day.md`, `run-tools.md`, `focus.md`, `add-tool.md`, `relearn-tools.md`
- **D-03:** Keep the same durations — 10s (10000ms) for tool commands, 15s (15000ms) for GraphQL introspection. Same values, just expressed as Bash tool timeout param.
- **D-04:** Remove the `stubs.test.cjs` assertions that check for `timeout` presence in workflow text. Since the Bash tool handles timeout natively, workflow markdown no longer needs the word "timeout".

### Claude's Discretion
- Exact wording of workflow instructions that tell Claude to use the Bash tool timeout param
- Whether to add a comment in workflows explaining why `timeout` binary is not used

### Deferred Ideas (OUT OF SCOPE)
- Document why automated periodic run-tools invocations are not supported (docs, ref: #23)
- Check for new Donna version once per day (tooling)
- Skip setup prompt when Donna is already configured (tooling)
</user_constraints>

## Summary

Phase 05 is a targeted find-and-replace across five workflow markdown files plus two test assertions. The root cause is that Donna workflows instruct Claude to prefix commands with the POSIX `timeout` binary (e.g., `timeout 10 gh ...`), which is not available on macOS unless coreutils is installed. The Bash tool Claude Code uses already has a native `timeout` parameter (integer milliseconds), so the fix is to remove the binary invocation and instead document that Claude should use the Bash tool's timeout parameter directly.

All five workflows follow an identical pattern for each tool type (cli, rest, graphql): a fenced bash block containing `timeout N <command>`. The replacement prose pattern is: describe the operation then instruct Claude to use the Bash tool with the timeout parameter set to the appropriate milliseconds value. No new dependencies are introduced; no file format changes are required.

Two test assertions in `test/stubs.test.cjs` currently verify that the word "timeout" appears in workflow content. After the fix the `timeout` binary keyword no longer appears in workflow markdown, so these assertions must be replaced with assertions that verify the timeout concept is still expressed (e.g., checking for "10000" or "10-second" or the Bash tool parameter description).

**Primary recommendation:** Work file-by-file through the 5 workflows replacing every fenced `timeout N <cmd>` block with prose instructing Claude to use the Bash tool's native timeout parameter, then update the two test assertions to match the new wording.

## Standard Stack

No new libraries or tools are required. This is a documentation/prose change in markdown files plus a test assertion change in CJS.

### Existing Infrastructure
| Component | Version | Purpose |
|-----------|---------|---------|
| Node.js built-in test runner | Node 24.14.0 (confirmed) | Test framework (`node:test`) |
| `test/stubs.test.cjs` | — | Tests that workflows contain required patterns |
| Bash tool native timeout | Claude Code built-in | Replacement for `timeout` binary, max 600000ms |

**Installation:** No new packages needed.

## Architecture Patterns

### How Workflows Instruct Claude

Donna workflows are plain markdown files that Claude reads and follows as instructions. When a workflow says:

```bash
timeout 10 gh issue list --json number,title,url 2>&1
```

Claude runs that bash command literally. The `timeout` binary must exist in PATH. On macOS without coreutils it does not, causing warnings.

The Bash tool natively accepts a `timeout` parameter (integer, milliseconds). To use it, the workflow instructs Claude in prose — e.g., "Run via Bash with `timeout: 10000`" — and Claude sets that parameter when invoking the tool. No bash binary is involved.

### Replacement Pattern (per tool type)

**CLI (10s):**

Before:
```bash
timeout 10 <cli_invocation> 2>&1
```

After (prose instruction to Claude):
```
Run the capability command via Bash with a 10-second timeout (set the Bash tool's `timeout` parameter to `10000`):
<cli_invocation> 2>&1
```

**REST/GraphQL curl (10s):**

Before:
```bash
timeout 10 curl -s ... 2>&1
```

After:
```
Run via Bash with a 10-second timeout (set the Bash tool's `timeout` parameter to `10000`):
curl -s ... 2>&1
```

**GraphQL introspection (15s, relearn-tools.md):**

Before:
```bash
timeout 15 curl -s -X POST ...
```

After:
```
Run via Bash with a 15-second timeout (set the Bash tool's `timeout` parameter to `15000`):
curl -s -X POST ...
```

**Inline references (add-tool.md auth tests):**

Before:
```
- `gh`: `timeout 10 gh api user --jq '.login' 2>&1`
```

After:
```
- `gh`: run `gh api user --jq '.login' 2>&1` via Bash with `timeout: 10000`
```

### Anti-Patterns to Avoid
- **Leaving any `timeout N` prefix in a fenced bash block:** Claude will attempt to run it literally and fail on macOS.
- **Using milliseconds text where seconds used to appear in error messages:** Keep error messages human-readable (e.g., "timed out after 10s" stays as-is — it is display text, not a bash command).
- **Changing timeout durations:** D-03 locks them. 10s → 10000ms, 15s → 15000ms.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-command timeout | Shell `timeout` binary | Bash tool's native `timeout` parameter | Cross-platform, no coreutils dependency |
| Error message for timeout | Custom exit code detection | Existing exit-code 124 handling already in workflow prose | Already implemented, just keep it |

**Key insight:** The Bash tool's native timeout fires before the shell process, so the workflow's existing exit-124 error handling (e.g., "timed out after 10s") continues to work correctly — Claude receives an error response from the Bash tool and formats the warning using the existing template.

## Complete Change Inventory

### Workflow files — exact locations of `timeout N` occurrences

**`workflows/begin-the-day.md`** (3 occurrences)
- Line 183: CLI — `timeout 10 <cli_invocation> 2>&1`
- Line 215: REST — `timeout 10 curl -s -H ...`
- Line 228: GraphQL — `timeout 10 curl -s -X POST ...`

**`workflows/run-tools.md`** (4 occurrences)
- Line 148: CLI — `timeout 10 <capability_command> 2>&1`
- Line 181: REST — `timeout 10 curl -s -H ...`
- Line 194: GraphQL — `timeout 10 curl -s -X POST ...`
- Line 226: Smart-merge gh check — `timeout 10 gh pr view ... || timeout 10 gh issue view ...` (inline in prose, not a standalone fenced block)

**`workflows/focus.md`** (3 occurrences)
- Line 158: CLI — `timeout 10 <cli_invocation> 2>&1`
- Line 166: REST — `timeout 10 curl -s -H ...`
- Line 173: GraphQL — `timeout 10 curl -s -X POST ...`

**`workflows/add-tool.md`** (3 occurrences)
- Line 168: `gh` auth test — inline backtick `timeout 10 gh api user ...`
- Line 169: `jira` auth test — inline backtick `timeout 10 jira me ...`
- Line 170: `kubectl` auth test — inline backtick `timeout 10 kubectl auth whoami ...`

**`workflows/relearn-tools.md`** (2 occurrences)
- Line 122: GraphQL with auth — `timeout 15 curl -s -X POST ...` (multi-line block)
- Line 130: GraphQL without auth — `timeout 15 curl -s -X POST ...` (multi-line block)

**Total:** 15 individual `timeout N` references across 5 files.

### Test file — exact assertions to remove/replace

**`test/stubs.test.cjs`** — 2 assertions:

1. Lines 822-828, describe block `"workflow: run-tools.md"`:
```javascript
it("contains timeout for failure isolation", () => {
    const content = fs.readFileSync(runToolsWorkflowPath, "utf8");
    assert.ok(
        content.includes("timeout"),
        "Should contain timeout for per-tool failure isolation",
    );
});
```
Replace with an assertion that verifies the Bash tool timeout concept is present. Suggested: check that the workflow includes "10000" or "10-second timeout" (whichever wording is used in the replacement prose).

2. Lines 894-900, describe block `"cross-cutting: begin-the-day tool integration"`:
```javascript
it("includes timeout for failure isolation", () => {
    const content = fs.readFileSync(beginTheDayWorkflowPath, "utf8");
    assert.ok(
        content.includes("timeout 10") || content.includes("timeout"),
        "begin-the-day should use timeout for tool command failure isolation",
    );
});
```
Replace with an assertion that verifies the Bash tool timeout concept is present (same approach as above).

**Note:** The `stubs/` directory does NOT contain any `timeout` references — only the `workflows/` directory does.

## Common Pitfalls

### Pitfall 1: Prose says "timeout" but bash block still has `timeout N`
**What goes wrong:** Partial update — the explanatory prose is updated but the fenced code block still contains the `timeout` binary prefix. Claude will attempt to run the literal command and fail on macOS.
**Why it happens:** Workflows often have the timeout instruction in both prose ("run with a 10-second timeout") and the code block.
**How to avoid:** After editing each workflow, grep for `timeout [0-9]` to confirm zero remaining matches.
**Warning signs:** `grep -n "timeout [0-9]" workflows/*.md` returns any results.

### Pitfall 2: Test assertions become vacuous
**What goes wrong:** Replacing `content.includes("timeout")` with `content.includes("timeout")` — same assertion, still passes, but no longer verifies the intended behavior.
**Why it happens:** Easy to forget what the assertion is supposed to guard.
**How to avoid:** Replace with an assertion tied to the specific replacement wording chosen (e.g., "10000" milliseconds or "Bash tool's `timeout` parameter"). Determine the exact replacement wording first, then write the assertion to match.

### Pitfall 3: Changing the error message text
**What goes wrong:** Updating "timed out after 10s" display text while changing the implementation.
**Why it happens:** It looks related to the `timeout` binary change.
**How to avoid:** Leave all error message templates, warning text, and "timed out (2-minute batch limit)" prose unchanged. Only change the bash invocation style.

### Pitfall 4: Omitting the smart-merge gh check in run-tools.md
**What goes wrong:** The inline `timeout 10 gh pr view ... || timeout 10 gh issue view ...` on line 226 of `run-tools.md` is in prose (not a fenced block), so a grep for fenced blocks misses it.
**How to avoid:** Use `grep -n "timeout" workflows/run-tools.md` to find all occurrences including inline prose references.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (node:test) |
| Config file | none — invoked directly via `npm test` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements to Test Map
| Behavior | Test Type | Automated Command | File Exists? |
|----------|-----------|-------------------|-------------|
| No `timeout N` bash prefix in any workflow | unit | `npm test` (stubs.test.cjs) | Yes — assertions need updating |
| Bash tool timeout concept still present in run-tools.md | unit | `npm test` | Yes — assertion needs replacement |
| Bash tool timeout concept still present in begin-the-day.md | unit | `npm test` | Yes — assertion needs replacement |
| All 287 existing tests continue to pass | unit | `npm test` | Yes |

### Sampling Rate
- **Per task commit:** `npm test`
- **Phase gate:** Full suite green (287+ tests passing) before `/gsd:verify-work`

### Wave 0 Gaps
None — existing test infrastructure covers all phase requirements. The changes are modifications to existing assertions, not new test files.

## Environment Availability

Step 2.6: SKIPPED — this phase is code/documentation edits with no external dependencies beyond the project's own files.

## Sources

### Primary (HIGH confidence)
- Direct code inspection of `workflows/begin-the-day.md`, `run-tools.md`, `focus.md`, `add-tool.md`, `relearn-tools.md` — all timeout occurrences catalogued
- Direct code inspection of `test/stubs.test.cjs` lines 822-900 — exact assertions identified
- `05-CONTEXT.md` — locked decisions D-01 through D-04

### Secondary (MEDIUM confidence)
- Bash tool documentation (from tool description in conversation): timeout parameter is in milliseconds, max 600000ms

## Metadata

**Confidence breakdown:**
- Change inventory: HIGH — all 15 occurrences found by direct grep across all workflow files
- Test assertions to update: HIGH — 2 exact line ranges identified with full code context
- Replacement pattern: HIGH — Bash tool timeout parameter confirmed, millisecond conversion is deterministic
- No external dependencies: HIGH — pure markdown + CJS edit

**Research date:** 2026-03-27
**Valid until:** Indefinite (no external dependencies, no evolving APIs)
