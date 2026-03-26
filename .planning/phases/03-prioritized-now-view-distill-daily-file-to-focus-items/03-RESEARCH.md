# Phase 3: Prioritized now view — distill daily file to focus items - Research

**Researched:** 2026-03-21
**Domain:** Claude Code skill authoring — markdown workflow parsing, AI-driven prioritization, tool enrichment reuse
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Skill name and invocation**
- D-01: Skill name is `donna:focus`
- D-02: No arguments — always reads today's full daily file and produces the focus list
- D-03: Zero-friction invocation: just `/donna:focus`, no configuration needed

**Output destination**
- D-04: Write to `daily/focus.md` (single file, not date-stamped) — visible in Obsidian
- D-05: Also print the focus list to the terminal so user sees it immediately
- D-06: Each run overwrites `focus.md` entirely — always shows current state, no history
- D-07: `focus.md` must be Obsidian-compatible markdown with YAML frontmatter

**Prioritization signals — text analysis (from daily file content)**
- D-08: Urgency keywords in task text: "due today", "due tomorrow", "blocking", "urgent", "ASAP"
- D-09: Carry-forward count — items carried forward many times (high `(N times)` suffix) signal neglected work
- D-10: Task source via tool tags — `(gh)`, `(jira)`, etc. — used to correlate with enriched data
- D-11: Recency — items appearing for the first time today (not carried forward) get a freshness signal
- D-12: Open vs resolved — only open items (`- [ ]`) are candidates for the focus list

**Prioritization signals — tool enrichment**
- D-13: Re-query only tools whose items appear in the daily file (not all configured tools)
- D-14: Enrichment adds richer context: Jira status fields, PR review-requested flags, PR approval state, etc.
- D-15: Graceful fallback — if a tool query fails, fall back to text-only signals for that tool's items; still produce the focus list
- D-16: Tool enrichment uses the same capability commands from `tools.md` that `run-tools` uses

**Focus list sizing**
- D-17: Dynamic item count — Claude decides based on urgency distribution (could be 3 items on a quiet day, 8 on a busy one)
- D-18: Always show total item count in daily file as context (e.g. "47 other items in today's file")

### Claude's Discretion
- Exact ranking algorithm and signal weighting
- How to present enriched data in the focus list (inline annotations, sub-bullets, etc.)
- Format and structure of `focus.md` beyond the basic requirements
- How to detect "first time today" items vs carried-forward items
- Whether to include a brief reason/tag for why each item is prioritized

### Deferred Ideas (OUT OF SCOPE)
- Calendar integration for meeting proximity signals — requires a calendar tool type first
- Configurable item count override via arguments — keep it simple for now
- "Done with this, what's next?" interactive flow — separate skill or future enhancement
- Tool-specific filtering (e.g. "only show GitHub items") — could add arguments later
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FOCUS-01 | `/donna:focus` skill stub at `stubs/claude-code/donna/focus.md` | Stub pattern established — YAML frontmatter + `@~/.donna/workflows/focus.md` reference |
| FOCUS-02 | `workflows/focus.md` workflow file installed to `~/.donna/workflows/` | Installer copies entire `workflows/` dir; new file is picked up automatically |
| FOCUS-03 | Read today's daily file and extract all open `- [ ]` items | Parsing pattern documented in `begin-the-day.md` carry-forward step |
| FOCUS-04 | Apply text-analysis priority signals (D-08 through D-12) | Keyword scanning + `(N times)` suffix parsing — pure Claude reasoning, no new libraries |
| FOCUS-05 | Re-query tools that have items in today's file for enrichment data (D-13 to D-16) | Same type-aware execution logic as `run-tools.md` — reuse verbatim |
| FOCUS-06 | Produce dynamic focus list (3–8 items, Claude-decided) with total item count footer (D-17, D-18) | Claude scoring, no library needed |
| FOCUS-07 | Write `daily/focus.md` with YAML frontmatter, Obsidian-compatible (D-04, D-07) | Obsidian format requirements well-understood; path is `<storage_repo>/<daily_folder>/focus.md` |
| FOCUS-08 | Print focus list to terminal with Donna banner (D-05) | Follow existing banner pattern from `begin-the-day.md` print-brief step |
| FOCUS-09 | Register skill in `src/installer.cjs` success message string | Tested by `stubs.test.cjs` — must update installer string to include "focus" |
| FOCUS-10 | Add `/donna:focus` entry to `README.md` command table | CLAUDE.md requirement: README update in same commit as feature |
| FOCUS-11 | Test coverage for new stub and workflow | `test/stubs.test.cjs` pattern — add `describe` blocks for stub + workflow file existence and structure |
</phase_requirements>

## Summary

Phase 3 adds `/donna:focus`, a read-only distillation skill that reads today's daily file, scores open tasks on urgency and recency signals, optionally re-queries active tools for enriched context, and writes a short prioritized list to `daily/focus.md` while printing to the terminal. The skill is fully self-contained in a `workflows/focus.md` file and a `stubs/claude-code/donna/focus.md` stub — no new npm dependencies, no new installer logic beyond updating the success message string.

The implementation heavily reuses existing workflow patterns. The task-parsing logic mirrors the carry-forward step in `begin-the-day.md`. The tool enrichment re-uses the type-aware execution block from `run-tools.md` verbatim — only the tools whose tag (`(gh)`, `(jira)`, etc.) appears in the daily file are queried. The output file format follows Obsidian conventions already established across all other Donna output files.

The test surface is lightweight: `stubs.test.cjs` tests file existence, YAML frontmatter correctness, and workflow reference paths. The installer success message string must be updated to include "focus" — this is tested. `README.md` command table needs a new row.

**Primary recommendation:** Implement as a single `workflows/focus.md` file following the `run-tools.md` step pattern (`read-config` → `read-daily-file` → `parse-open-tasks` → `enrich-from-tools` → `score-and-rank` → `write-focus-file` → `print-focus`). No new dependencies. The git commit step is omitted — write focus.md then commit in main context per CLAUDE.md constraints. Actually: `focus.md` lives in the storage repo and should be committed; the workflow should issue the git commit exactly as other skills do.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js CJS | Existing | Installer and test runner | Project uses Node --test runner; no change needed |
| node:test | Built-in | Test framework | Already used in all `test/*.test.cjs` files |
| node:assert/strict | Built-in | Test assertions | Consistent with existing tests |

No new npm packages are needed. The skill is a markdown workflow file consumed by Claude Code, not compiled code.

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Biome | Existing | Linting (`npm run lint:fix`) | Must run before any commit — CI validates |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Claude reasoning for scoring | Numeric scoring algorithm in workflow prose | Claude reasoning produces better contextual results without rigid rules; no need for deterministic algorithm |

**Installation:** No new packages needed.

## Architecture Patterns

### Recommended Project Structure
```
stubs/claude-code/donna/
└── focus.md              # New skill stub (YAML frontmatter + @~/.donna/workflows/focus.md)

workflows/
└── focus.md              # New workflow — contains all logic

test/
└── stubs.test.cjs        # Add describe blocks for focus stub and workflow (existing file)
```

### Pattern 1: Skill = Stub + Workflow
**What:** Every Donna skill is split into a stub (installed to `~/.claude/commands/donna/`) and a workflow (installed to `~/.donna/workflows/`). The stub references the workflow via `@~/.donna/workflows/<name>.md`. Claude Code loads the workflow at invocation.

**When to use:** Always. All existing skills follow this pattern.

**Stub example (verbatim from existing skills):**
```markdown
---
name: donna:focus
description: Distill today's tasks into a short prioritized focus list
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Run the Donna focus workflow.
</objective>

<execution_context>
@~/.donna/workflows/focus.md
</execution_context>
```

Note: `run-tools.md` and `begin-the-day.md` do not include `AskUserQuestion` in `allowed-tools` because they are non-interactive. `donna:focus` is also non-interactive (D-02, D-03), so `AskUserQuestion` is NOT needed in the allowed-tools list.

### Pattern 2: Workflow Step Structure
**What:** Workflows use `<step name="...">` XML tags. Each step is a discrete unit of work with explicit input/output variables. Read config first, then do work, then write output, then commit, then print.

**When to use:** Every workflow. Consistent structure enables the parser/tester to verify step existence.

**Recommended steps for `focus.md`:**
```
read-config          → extracts storage_repo, daily_folder
read-daily-file      → reads today's YYYY-MM-DD.md
parse-open-tasks     → extracts all - [ ] lines into <open_tasks>
enrich-from-tools    → re-queries tools found in daily file, per D-13/D-16 pattern
score-and-rank       → Claude applies D-08 through D-12 signals, produces <focus_items>
write-focus-file     → writes daily/focus.md with YAML frontmatter
git-commit           → git add + commit "donna(focus): focus list for <today>"
print-focus          → prints terminal output with banner
```

### Pattern 3: Task Line Format
**What:** Task lines in daily files follow a strict format. Understanding this format is critical for parsing.

**Full format:**
```
- [state] (tool_tag) description [identifier](url) (N times)
```

**Components (all optional except state and description):**
- `[state]`: `[ ]` open or `[x]` closed
- `(tool_tag)`: present on tool-sourced tasks, e.g. `(gh)`, `(jira)` — matches the `## <tool_name>` section header in `tools.md`
- `description`: free text
- `[identifier](url)`: link with source identifier — stable URL used for tool matching
- `(N times)`: carry-forward counter added by `begin-the-day.md` — N is an integer >= 1

**Parsing to detect carry-forward (D-09, D-11):**
- Line ends with `(N times)` where N >= 1 → carried forward at least once → NOT a first-time item
- Line has no `(N times)` suffix → first time today (D-11 freshness signal)
- High N (e.g., >= 5) → chronic neglect signal → elevated priority

**Urgency keyword detection (D-08):**
Scan description text (after stripping tool tag, link, counter) for: "due today", "due tomorrow", "blocking", "urgent", "ASAP" (case-insensitive).

### Pattern 4: Tool Enrichment Reuse (run-tools pattern)
**What:** The `enrich-from-tools` step should detect which tool tags appear in the open task list, then re-query only those tools using the same type-aware execution logic from `run-tools.md`.

**When to use:** D-13 mandates this — only query tools with items in today's file.

**Execution logic (HIGH confidence — sourced directly from `run-tools.md`):**
```
For each tool tag found in <open_tasks>:
  Read tools.md to find the matching ## <tool_name> section
  Execute all capabilities using type-aware execution:
    - cli: timeout 10 <cli_invocation> 2>&1
    - rest: timeout 10 curl -s -H "<auth_header>: <secret>" "<base_url><path>" 2>&1
    - graphql: timeout 10 curl -s -X POST ... 2>&1
    - mcp: invoke MCP tool directly
  Collect fresh task data as <enriched_data>
  On failure: add warning, continue (D-15 fallback)
```

**Key difference from run-tools:** Focus does NOT smart-merge results back into the daily file. It uses enriched data solely to improve scoring (e.g., if a `(gh)` PR has review-requested status, rank it higher).

### Pattern 5: Git Commit in Main Context
**What:** All git operations run in the main workflow context, never from spawned Task agents.

**Why:** CLAUDE.md — SSH signing via 1Password requires interactive approval that hangs in subprocesses.

**Applied to focus.md:** If the workflow spawns Task agents for parallel tool enrichment (as run-tools does), those agents must NOT issue git commits. The git commit step runs in the main workflow after agents return.

### Pattern 6: focus.md File Format
**What:** Output file at `<storage_repo>/<daily_folder>/focus.md` must be Obsidian-compatible (D-07).

**Format:**
```markdown
---
date: <today>
generated: <HH:MM>
---

## Focus (<today>, <HH:MM>)

1. <item description> — <reason tag>
2. <item description> — <reason tag>
...

---
<N> other items in today's file
```

Reason tags are Claude's discretion (D per CONTEXT.md). Examples: "due today", "review requested", "urgent", "carried 8 times". The example output from GitHub issue #16 shows inline annotation on the same line as the task.

### Anti-Patterns to Avoid
- **Spawning Task agents for git commits:** Agents must never commit — SSH signing hangs subprocesses.
- **Modifying the daily file:** `donna:focus` is read-only relative to the daily file (CONTEXT.md domain boundary). Only `focus.md` is written.
- **Adding AskUserQuestion to allowed-tools:** Skill is non-interactive (D-02). No prompts.
- **Date-stamping focus.md:** D-04 mandates `daily/focus.md` not `daily/focus-2026-03-21.md`. Single file, always overwritten.
- **Querying all configured tools:** D-13 mandates only querying tools whose items appear in today's file.
- **Blocking on tool failure:** D-15 mandates graceful fallback — tool failures never prevent the focus list from being produced.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tool type-aware execution | Custom execution logic | Copy/reference the block from `run-tools.md` step `pull-fresh-data` | It handles cli/rest/graphql/mcp, timeouts, error classification, and secrets resolution — all edge cases covered |
| Task line parsing | Custom regex parser | Follow the normalization algorithm in `begin-the-day.md` step `deduplicate` | Handles tool tag, counter suffix, and link suffix stripping — exact same problem |
| Config reading | Custom config parser | Copy the `read-config` step pattern (same in all 11 workflows) | Handles Obsidian sync, daily_folder default, and missing config error exactly |
| Parallel tool enrichment | Custom parallelization | Use Task agent spawning per tool (same as run-tools / begin-the-day) | Already proven; handles 2-minute global timeout, per-tool 10-second timeout |

**Key insight:** The focus workflow is primarily a composition of already-proven building blocks. The only genuinely new logic is the scoring/ranking step, which is Claude reasoning — not code.

## Common Pitfalls

### Pitfall 1: Writing to Daily File
**What goes wrong:** Workflow accidentally modifies `YYYY-MM-DD.md` instead of only writing `focus.md`.
**Why it happens:** Confusion about which file is the output target.
**How to avoid:** The write step must explicitly target `<storage_repo>/<daily_folder>/focus.md` only. Verify daily file path vs focus file path differ.
**Warning signs:** Test checks that daily file modification time is unchanged after focus run.

### Pitfall 2: Missing Tool Tags in Enrichment Detection
**What goes wrong:** Tool detection misses tools because the tool tag regex is wrong (e.g., misses `(gh)` due to incorrect character class).
**Why it happens:** Tool tags use `\(\w+\)` pattern — same as the normalization regex in `done.md`/`begin-the-day.md`.
**How to avoid:** Use exactly the same pattern: `\(\w+\)` after `- [ ] `. Cross-reference with run-tools and begin-the-day.
**Warning signs:** Enrichment step skips items that clearly have tool tags.

### Pitfall 3: Git Commit in Subagent
**What goes wrong:** If Task agents are spawned for parallel tool enrichment, a naive implementation might include a git commit in agent logic.
**Why it happens:** Copy-paste from run-tools without removing the commit step from agent instructions.
**How to avoid:** Agent instructions must explicitly state "DO NOT run git commands". The git-commit step lives in main workflow only (CLAUDE.md constraint).
**Warning signs:** CI fails, or 1Password blocks during test.

### Pitfall 4: Installer Success Message Not Updated
**What goes wrong:** `test/stubs.test.cjs` test "success message includes 'focus'" fails because `src/installer.cjs` string was not updated.
**Why it happens:** New skills must be mentioned in the installer's `output.success(...)` call listing all skill names.
**How to avoid:** Update the string in `src/installer.cjs` line 82 to include "focus" — the test checks for exact substring match.
**Warning signs:** `npm test` fails with "Installer success message should include focus skill".

### Pitfall 5: focus.md Missing YAML Frontmatter
**What goes wrong:** Obsidian cannot render or link focus.md properly.
**Why it happens:** Forgetting YAML frontmatter block.
**How to avoid:** D-07 is explicit. The write step must start with `---\ndate: <today>\ngenerated: <HH:MM>\n---`.
**Warning signs:** Obsidian shows raw markdown instead of rendered note.

### Pitfall 6: Scoring All Items Including Closed Ones
**What goes wrong:** Focus list includes `- [x]` completed tasks.
**Why it happens:** Parser iterates all task lines without filtering by state.
**How to avoid:** D-12 is explicit — only `- [ ]` (open) items are candidates. Filter before scoring.
**Warning signs:** Completed tasks appear in focus list.

## Code Examples

Verified patterns from existing Donna workflows:

### Config Read Step (identical across all skills)
```markdown
<!-- Source: workflows/begin-the-day.md, run-tools.md, done.md — all identical -->
<step name="read-config">
Read `~/.config/donna/config.md`.

If the file does not exist, print:
```
✗ Donna is not configured. Run /donna:setup first.
```
Stop.

Extract the `storage_repo`, `daily_folder` (default: `daily`), and `auto_push` (default: false) fields from the YAML frontmatter.
</step>
```

### Open Task Extraction Pattern
```markdown
<!-- Source: workflows/begin-the-day.md, carry-forward step -->
Extract all open tasks — every line matching the pattern `- [ ] <description>`.
```

### Carry-Forward Counter Detection
```markdown
<!-- Source: workflows/begin-the-day.md, carry-forward step -->
If the description ends with ` (N times)` (where N is any integer): extract N.
If the description has no such suffix: this is a first-time item today.
```

### Task Normalization (for comparison/analysis)
```markdown
<!-- Source: workflows/begin-the-day.md, deduplicate step -->
strip `- [ ] ` or `- [x] ` prefix,
strip any leading `(<tool>) ` prefix (matching pattern `\(\w+\) `),
strip any trailing ` (N times)` suffix (where N is any integer),
strip any trailing ` [<text>](<url>)` suffix (matching pattern ` \[[^\]]+\]\([^\)]+\)`),
lowercase all text, trim whitespace.
```

### Tool Tag Extraction for Enrichment
```markdown
<!-- Source: workflows/run-tools.md, read-tools-md step -->
Parse each tool section (starting with `## <tool_name>`). For each tool, extract the `type` field
(if absent, treat as "cli"), the `command` field, and the capabilities list under `### Capabilities`.
```

### Terminal Banner Pattern
```markdown
<!-- Source: workflows/begin-the-day.md, print-brief step -->
══════════════════════════════════════
 Donna — Focus for <today>
══════════════════════════════════════
[focus list here]
══════════════════════════════════════
```

### Git Commit Pattern
```markdown
<!-- Source: workflows/run-tools.md, git-commit step -->
Run via Bash:
git -C <storage_repo> add -A
git -C <storage_repo> status --porcelain
# If not empty:
git -C <storage_repo> commit -m "donna(focus): focus list for <today>"
# If auto_push:
git -C <storage_repo> push
```

### Stub File Format
```markdown
<!-- Source: stubs/claude-code/donna/run-tools.md — non-interactive pattern -->
---
name: donna:focus
description: Distill today's tasks into a short prioritized focus list
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Run the Donna focus workflow.
</objective>

<execution_context>
@~/.donna/workflows/focus.md
</execution_context>
```

### Installer Success Message Update
```javascript
// Source: src/installer.cjs line 82
// Current:
output.success(
    `Copied donna skills (setup, add-task, done, set-role, begin-the-day, add-tool, relearn-tools, run-tools, help, contribute-idea, adjust-tool) to ${provider.stubTarget}`,
);
// Updated (add "focus" to the list):
output.success(
    `Copied donna skills (setup, add-task, done, set-role, begin-the-day, add-tool, relearn-tools, run-tools, help, contribute-idea, adjust-tool, focus) to ${provider.stubTarget}`,
);
```

### README Command Table Entry
```markdown
<!-- Source: README.md command table pattern -->
| `/donna:focus` | Distill today's tasks into a short prioritized focus list |
```

### Test Stub Block Pattern
```javascript
// Source: test/stubs.test.cjs — adjust-tool pattern (lines 1216–1242)
const focusStubPath = path.join(projectRoot, "stubs", "claude-code", "donna", "focus.md");
const focusWorkflowPath = path.join(projectRoot, "workflows", "focus.md");

describe("stub: stubs/claude-code/donna/focus.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(focusStubPath), "Stub file should exist");
    });
    it('has YAML frontmatter with name "donna:focus"', () => {
        const content = fs.readFileSync(focusStubPath, "utf8");
        assert.ok(content.startsWith("---"), "Should start with YAML frontmatter delimiter");
        assert.ok(content.includes("name: donna:focus"), "Should have name: donna:focus in frontmatter");
    });
    it("has description field in frontmatter", () => {
        const content = fs.readFileSync(focusStubPath, "utf8");
        assert.ok(content.includes("description:"), "Should have description field");
    });
    it("contains @~/.donna/workflows/focus.md reference", () => {
        const content = fs.readFileSync(focusStubPath, "utf8");
        assert.ok(content.includes("@~/.donna/workflows/focus.md"), "Should reference workflow");
    });
    it("does not have AskUserQuestion — focus is non-interactive", () => {
        const content = fs.readFileSync(focusStubPath, "utf8");
        assert.ok(!content.includes("AskUserQuestion"), "Should NOT have AskUserQuestion");
    });
});

describe("workflow: workflows/focus.md", () => {
    it("exists", () => {
        assert.ok(fs.existsSync(focusWorkflowPath), "Workflow file should exist");
    });
    it("has step structure", () => {
        const content = fs.readFileSync(focusWorkflowPath, "utf8");
        assert.ok(content.includes('step name="read-config"'), "Should have read-config step");
        assert.ok(content.includes('step name="read-daily-file"'), "Should have read-daily-file step");
        assert.ok(content.includes('step name="score-and-rank"'), "Should have score-and-rank step");
        assert.ok(content.includes('step name="write-focus-file"'), "Should have write-focus-file step");
    });
});
```

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | node:test (built-in Node.js test runner) |
| Config file | none — invoked via `node --test 'test/*.test.cjs'` |
| Quick run command | `npm test` |
| Full suite command | `npm test` (same — all tests run in one command) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FOCUS-01 | Stub file exists at correct path | unit | `npm test` | ❌ Wave 0 |
| FOCUS-01 | Stub has correct YAML frontmatter (name, description) | unit | `npm test` | ❌ Wave 0 |
| FOCUS-01 | Stub references `@~/.donna/workflows/focus.md` | unit | `npm test` | ❌ Wave 0 |
| FOCUS-01 | Stub does NOT have AskUserQuestion | unit | `npm test` | ❌ Wave 0 |
| FOCUS-02 | Workflow file exists at `workflows/focus.md` | unit | `npm test` | ❌ Wave 0 |
| FOCUS-02 | Workflow has expected step names | unit | `npm test` | ❌ Wave 0 |
| FOCUS-09 | Installer success message includes "focus" | unit | `npm test` | ❌ Wave 0 |
| FOCUS-03–08 | Workflow logic correctness (parsing, scoring, output) | manual-only | n/a — Claude workflow, no unit test possible | n/a |
| FOCUS-10 | README includes `/donna:focus` row | manual-only | visual inspection | n/a |

Note on manual-only: The workflow file is consumed by Claude Code at runtime. Its logic (task parsing, scoring, tool enrichment, file writing) cannot be unit-tested in isolation — it requires a running Claude Code session. Test coverage focuses on file structure and installer wiring, consistent with how all other Donna skills are tested.

### Sampling Rate
- **Per task commit:** `npm test` (< 5 seconds)
- **Per wave merge:** `npm test && npm run lint`
- **Phase gate:** Full suite green + `npm run lint:fix` clean before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `test/stubs.test.cjs` — add `describe` blocks for `focus` stub and workflow (append to existing file)
- [ ] `src/installer.cjs` — update success message string to include "focus" (prerequisite for installer test to pass)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single flat workflow file | Stub + workflow split | Phase 01 | Enables provider-agnostic distribution |
| Standing files in repo root | donna/ subfolder | Phase 02 migration | Clean separation — tools.md, role.md, secrets.md all in donna/ |
| Serial tool execution | Parallel Task agents per tool | Phase 02 | Faster; focus skill should use same parallelization for enrichment |
| No tool type distinction | Type field (cli/rest/graphql/mcp) with backfill | Phase 02 | Focus must handle all four types in enrichment step |

**Deprecated/outdated:**
- Single-file workflow (no stub split): obsolete since Phase 01 — all new skills use stub+workflow.
- Tool execution without type field: all tools now have explicit `type`; `focus.md` must read and respect it.

## Open Questions

1. **Should `focus.md` be committed to git?**
   - What we know: All other skill outputs are committed (daily files, tools.md, etc.). The `auto_push` flag controls whether to push after commit.
   - What's unclear: `focus.md` is ephemeral (regenerated each run), not a durable record. Committing it adds noise to the storage repo history.
   - Recommendation: Commit it anyway, following the established pattern. Consistency matters more than history noise. The git commit step follows the same pattern as all other skills.

2. **Parallel vs sequential tool enrichment for focus?**
   - What we know: `begin-the-day.md` and `run-tools.md` both use Task agents for parallel tool execution. The focus skill only queries tools whose tags appear in the daily file — potentially 1–3 tools.
   - What's unclear: The overhead of spawning Task agents vs sequential execution for 1–3 tools.
   - Recommendation: Use the same conditional logic as run-tools — "if only one tool, run directly; if multiple, spawn Task agents." This is already specified in run-tools.md and is proven.

3. **How to detect "first time today" items (D-11)?**
   - What we know: Carry-forward items have `(N times)` suffix (N >= 1). Items without this suffix are "first time today."
   - What's unclear: An item added by the user mid-day via `donna:add-task` also has no `(N times)` suffix. Should it get the freshness signal?
   - Recommendation: Yes — any item without a carry-forward counter is "new today" regardless of how it was added. The freshness signal is a mild positive boost, not a strong one.

## Sources

### Primary (HIGH confidence)
- `workflows/begin-the-day.md` — Task line format, carry-forward counter pattern, tool execution, config reading, git commit, print-brief step — direct source inspection
- `workflows/run-tools.md` — Type-aware tool execution, Task agent pattern, smart-merge, parallel execution — direct source inspection
- `workflows/done.md` — Task line stripping/normalization patterns — direct source inspection
- `stubs/claude-code/donna/run-tools.md`, `adjust-tool.md`, `begin-the-day.md` — Stub file format — direct source inspection
- `src/installer.cjs` — Success message string that must be updated — direct source inspection
- `test/stubs.test.cjs` — Test pattern for new stub + workflow — direct source inspection
- `CLAUDE.md` — SSH signing constraint, lint requirement, README update requirement — direct source

### Secondary (MEDIUM confidence)
- `.planning/PROJECT.md` — Confirmed Phase 03 scope and active items list
- `.planning/STATE.md` — Confirmed prior decisions and phase history

### Tertiary (LOW confidence)
- None — all findings verified against source files.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; existing stack fully inspected
- Architecture: HIGH — patterns sourced directly from existing skill workflows
- Pitfalls: HIGH — derived from code analysis and existing test patterns
- Validation: HIGH — test framework and existing test structure inspected directly

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (stable domain — no external dependencies to drift)
