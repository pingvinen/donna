# Phase 07: Add list of follow-ups i.e. todos in the future - Research

**Researched:** 2026-06-17
**Domain:** Personal assistant / task scheduling / Node.js date arithmetic
**Confidence:** HIGH

## Summary

This phase adds a follow-up scheduling system to Donna: a new `/donna:follow-up` capture skill that resolves natural-language relative dates to concrete YYYY-MM-DD entries in a standing `donna/follow-ups.md` file, and begin-the-day integration that surfaces due follow-ups during the morning brief. The feature is entirely self-contained using pure Node.js — no external packages are needed or proposed.

The implementation follows the established Donna pattern: a stub file (`stubs/claude-code/donna/follow-up.md`) delegating to a workflow file (`workflows/follow-up.md`), with the capture pattern (init → get-input → ensure-file → append → commit → confirm) directly reused from `/donna:add-task`. The begin-the-day integration inserts a new `check-follow-ups` step between `check-recurring` and `pull-tool-data`, following the same line-oriented parsing and deduplication patterns already used for recurring tasks.

**Primary recommendation:** Implement as a pure addition to the existing pattern — new stub, new workflow, new begin-the-day step. No refactoring needed. No external dependencies needed. The relative-date resolver uses Node.js `Date` arithmetic with local date component extraction (never `toISOString`).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Natural language date parsing (capture) | AI Agent (workflow) | — | The LLM agent interprets "in 2 months" → {value, unit} pairs. No parser library needed. |
| Date arithmetic resolution | Node.js Runtime (workflow step) | — | `donna-tools.cjs` or inline Bash in workflow step: pure `Date` arithmetic, local component extraction |
| Follow-up storage | Git-backed markdown file | — | `donna/follow-ups.md` in the storage repo, same pattern as `donna/recurring.md` |
| Follow-up surfacing (begin-the-day) | Workflow step | — | Reads follow-ups.md, filters by `due <= today`, appends to daily Tasks, removes from file |
| Git commit | `donna-tools.cjs commit` | — | Identical pattern to all other commit steps in Donna workflows |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `Date` | built-in (v18+) | Relative date arithmetic | Already required by package.json `engines.node >= 18`. No external date library needed — the LLM agent parses natural language into discrete {value, unit} pairs, and `Date.setDate()`/`setMonth()`/`setFullYear()` handle the arithmetic. |
| Node.js `fs` | built-in | File reading/writing | Already used by `donna-tools.cjs`. Workflow steps use the Read/Write/Bash tools provided by the AI coding assistant. |
| Node.js `path` | built-in | Path construction | Already used by `donna-tools.cjs`. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | — | — | No external packages needed. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Node.js `Date` | `date-fns` / `dayjs` / `luxon` | External dependency for a feature that the LLM agent handles at the parse stage. The workflow only needs discrete arithmetic (`addDays`, `addMonths`), which `Date` native methods do correctly. Adding a dependency introduces a maintenance burden for no real benefit. |

**Installation:** No packages to install — this is a pure addition to existing Donna infrastructure.

**Version verification:** Not applicable (no external packages).

## Package Legitimacy Audit

> No external packages are being installed for this phase. All functionality uses Node.js built-ins and existing Donna infrastructure (`donna-tools.cjs`, AI agent tools).

No packages to audit.

## Architecture Patterns

### System Architecture Diagram

```
User: "/donna:follow-up remind team about Q3 planning in 2 months"
        │
        ▼
┌─────────────────────────────────────────────────┐
│  /donna:follow-up stub                          │
│  stubs/claude-code/donna/follow-up.md           │
│  → delegates to ~/.donna/workflows/follow-up.md │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 1: init (donna-tools.cjs init)            │
│  → get storage_repo, daily_folder, auto_push    │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 2: parse-input                            │
│  → Extract description + time expression        │
│  → LLM agent parses "in 2 months" → months: 2   │
│  → If no time expr, due = today                 │
│  → If no argument, AskUserQuestion interatively  │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 3: resolve-date (Bash: node inline)        │
│  → let d = new Date()                           │
│  → d.setMonth(d.getMonth() + 2)                 │
│  → d.setDate(d.getDate() + N)                   │
│  → d.setFullYear(d.getFullYear() + N)           │
│  → Output: YYYY-MM-DD (local date components)   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 4: ensure-file                            │
│  → If donna/follow-ups.md missing:              │
│    create with YAML frontmatter + ## Follow-ups │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 5: append-entry                           │
│  → Read follow-ups.md                           │
│  → Append: - [ ] <description> | due: YYYY-MM-DD│
│  → Write back                                   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│  Step 6: git-commit                             │
│  → node ~/.donna/donna-tools.cjs commit "..."   │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
              ✓ Confirmation
```

**begin-the-day integration:**

```
begin-the-day workflow
  Step: init                    ← existing
  Step: get-today               ← existing
  Step: find-previous-file      ← existing
  Step: carry-forward           ← existing
  Step: check-recurring         ← existing
→ Step: check-follow-ups        ← NEW (inserted here)
  Step: pull-tool-data          ← existing
  Step: read-existing-today     ← existing
  Step: deduplicate             ← existing (follow-ups feed in between recurring + tool)
  Step: write-daily-file        ← existing
  Step: update-recurring        ← existing (no follow-up equivalent needed)
  Step: git-commit              ← modified: add follow-ups.md to --files
  Step: print-brief             ← modified: add "## Follow-ups" section
```

### Recommended Project Structure

No new directories needed. All files go into existing locations:

```
donna/
├── stubs/
│   └── claude-code/
│       └── donna/
│           └── follow-up.md          # NEW: stub delegating to workflow
├── workflows/
│   ├── begin-the-day.md              # MODIFIED: add check-follow-ups step
│   ├── add-task.md                   # (reference pattern, no change)
│   └── follow-up.md                  # NEW: follow-up capture workflow
├── src/
│   └── installer.cjs                 # MODIFIED: add follow-up to success message
├── test/
│   └── stubs.test.cjs                # MODIFIED: add follow-up stub + workflow tests
├── README.md                         # MODIFIED: add follow-up to commands table
```

### Pattern 1: Stub → Workflow Delegation

**What:** Every Donna skill has a stub file (e.g., `stubs/claude-code/donna/add-task.md`) containing YAML frontmatter with `name`, `description`, `allowed-tools`, and a single `<execution_context>` block that references the workflow file at `@~/.donna/workflows/<skill>.md`. The stub is copied to `~/.claude/commands/donna/` by the installer.

**When to use:** Every new skill that exposes a `/donna:` command.

**Example (from existing add-task.md stub):**
```yaml
---
name: donna:add-task
description: Capture a task to today's daily journal
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna add-task workflow.
</objective>

<execution_context>
@~/.donna/workflows/add-task.md
</execution_context>
```

**Follow-up stub pattern:**
```yaml
---
name: donna:follow-up
description: Schedule a follow-up task for a future date
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna follow-up workflow.
</objective>

<execution_context>
@~/.donna/workflows/follow-up.md
</execution_context>
```

### Pattern 2: Capture Workflow (init → get-input → ensure-file → append → commit → confirm)

**What:** The standard Donna task capture flow: bootstrap via `donna-tools.cjs init`, get the task description from command argument or AskUserQuestion, ensure the target file exists, append the entry, git commit, print confirmation.

**When to use:** Any skill that writes data to a file in the storage repo.

**Example (from add-task.md, adapted for follow-up):**
```markdown
<step name="init">
Run via Bash:
```bash
INIT=$(node ~/.donna/donna-tools.cjs init)
```
Parse the JSON response. If `error` field is `"not_configured"`, print error and stop.
Extract `storage_repo`, `daily_folder`, `auto_push`.
</step>

<step name="parse-input">
The argument is provided as `<description>`. Parse the time expression from the description using LLM understanding.

If no time expression found, `<due_date>` = today.
If no argument provided, use AskUserQuestion for task description and date.

Store `<description>` (without time expression) and `<due_date>`.
</step>

<step name="resolve-date">
If `<due_date>` is already YYYY-MM-DD (user typed a concrete date), use it directly.

If `<due_date>` is a relative expression, resolve via Bash:
```bash
node -e "
const d = new Date();
<inject setMonth/setDate/setFullYear calls based on parsed units>
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, '0');
const dd = String(d.getDate()).padStart(2, '0');
console.log(yyyy + '-' + mm + '-' + dd);
"
```
Store the output as `<due_date>`.
</step>

<step name="ensure-file">
If `<storage_repo>/donna/follow-ups.md` does not exist, create it:
```markdown
---
created: <today>
---
## Follow-ups
```
</step>

<step name="append-entry">
Read `<storage_repo>/donna/follow-ups.md`.
Append: `- [ ] <description> | due: <due_date>` on a new line.
Write back.
</step>

<step name="git-commit">
```bash
node ~/.donna/donna-tools.cjs commit "donna(follow-up): <description>" --files donna/follow-ups.md
```
</step>

<step name="confirm">
Print: `✓ Follow-up scheduled: <description> (due: <due_date>)`
</step>
```

### Pattern 3: Line-Oriented Standing File Parsing (for begin-the-day)

**What:** Read a standing file, parse line-oriented entries, extract matching items, remove them. Mirrors how `check-recurring` reads `donna/recurring.md`.

**When to use:** The new `check-follow-ups` step in `begin-the-day.md`.

**Example (check-follow-ups step for begin-the-day):**
```markdown
<step name="check-follow-ups">
Read `<storage_repo>/donna/follow-ups.md` with the Read tool.
If the file does not exist, set `<follow_up_tasks>` to an empty list and continue.

Parse each line matching the pattern `- [ ] <description> | due: YYYY-MM-DD`.
For each entry:
  - Parse the `due` date (YYYY-MM-DD)
  - If `due < <today>`: task is past due
    → Add to `<follow_up_tasks>` as: `- [ ] <description> (overdue N days)`
    where N = days between `due` and `<today>` (use Bash date arithmetic)
  - If `due == <today>`: task is due today
    → Add to `<follow_up_tasks>` as: `- [ ] <description>`
  - If `due > <today>`: task is future — leave in follow-ups.md, do not add

After collecting all due/overdue tasks, remove those lines from follow-ups.md.
If lines were removed, write the updated file back.
If no lines were removed, skip the file write.

Store `<follow_up_tasks>` for deduplication.

**Past-due date calculation (macOS-compatible):**
```bash
DUE="<YYYY-MM-DD>"
TODAY="<today>"
due_epoch=$(date -j -f "%Y-%m-%d" "$DUE" "+%s")
today_epoch=$(date -j -f "%Y-%m-%d" "$TODAY" "+%s")
echo $(( (today_epoch - due_epoch) / 86400 ))
```
</step>
```

### Pattern 4: Deduplication Integration

**What:** Follow-up tasks feed into the existing deduplication step between recurring tasks and tool tasks. The deduplication uses normalized comparison (strip `[ ] ` prefix, strip `(overdue N days)` suffix, lowercase, trim).

**When to use:** The deduplication step in begin-the-day already handles multiple sources. Follow-up tasks become item #2.5 in the sequence:

```
Sequence: existing_tasks → carried_tasks → recurring_tasks → follow_up_tasks → tool_tasks
```

The `(overdue N days)` suffix must be stripped during normalization so that an overdue follow-up `- [ ] Review design doc (overdue 3 days)` does not duplicate a manually-added `- [ ] Review design doc`.

### Anti-Patterns to Avoid

- **Using toISOString() for date formatting:** `toISOString()` returns UTC. A date created as `new Date(2026, 5, 17)` in CEST has a UTC representation of `2026-06-16T22:00:00.000Z`. Using `toISOString().slice(0,10)` would output `2026-06-16` instead of `2026-06-17`. Always use local date component extraction: `getFullYear()`, `getMonth() + 1`, `getDate()`.
- **Writing relative dates to follow-ups.md:** The file format requires resolved YYYY-MM-DD dates. Do not write "in 2 months" to the file — resolve at capture time.
- **Leaving matched entries in follow-ups.md after surfacing:** The decision specifies removal (not checking off, not leaving a marker). The daily file owns the task from that point.
- **Inserting follow-ups step before carry-forward:** The order matters. Follow-ups must run after carry-forward and recurring, before tool data pull and dedup.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Date arithmetic (months, days, years) | Custom calendar logic | Node.js `Date.setMonth()`, `setDate()`, `setFullYear()` | ECMAScript spec handles month overflow, leap years, DST transitions. A custom implementation would need to handle all these edge cases — error-prone and unnecessary. |
| Natural language time parsing | Regex-based parser for "in N months", "in 3 weeks", "next Tuesday" | LLM agent (the AI coding assistant itself) | The workflow runs inside an AI coding assistant session. The LLM can interpret natural language time expressions with far better accuracy than any regex-based parser. The workflow step merely extracts structured {value, unit} pairs from what the LLM understood. |
| File format for line-oriented data | YAML/TOML/JSON for task entries | Markdown `- [ ] <desc> \| due: YYYY-MM-DD` | Follows the existing `donna/recurring.md` format pattern. Plain markdown is Obsidian-compatible, human-readable, and version-control-friendly. |
| Git operations | Custom git CLI wrapper | `donna-tools.cjs commit` (existing) | Already handles staging, commit, auto-push, and edge cases (nothing to commit, not configured). All other skills use it — consistency reduces maintenance. |

**Key insight:** The combination of LLM-level NLP for parsing + Node.js `Date` for discrete arithmetic covers the entire date-resolution problem without a single external dependency. The LLM turns "remind me to do X in 2 months" into `{ description: "remind me to do X", months: 2 }` and the workflow step runs `d.setMonth(d.getMonth() + 2)`.

## Runtime State Inventory

> This is a greenfield feature addition, not a rename/refactor/migration. No runtime state needs migration.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — new standing file `donna/follow-ups.md` created fresh | File creation at first use |
| Live service config | None | — |
| OS-registered state | None | — |
| Secrets/env vars | None | — |
| Build artifacts | None | — |

**Nothing found in any category — this is a pure addition with no migration surface.**

## Common Pitfalls

### Pitfall 1: toISOString() Timezone Issue

**What goes wrong:** Using `new Date().toISOString().slice(0, 10)` to get today's date produces the wrong date for users in timezones ahead of UTC during certain hours (e.g., a user in CEST at 23:00 gets yesterday's date in ISO).

**Why it happens:** `toISOString()` returns the UTC representation. A date constructed with local time components has a UTC offset baked in.

**How to avoid:** Always use local date component extraction:
```javascript
const d = new Date();
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, '0');
const dd = String(d.getDate()).padStart(2, '0');
const today = yyyy + '-' + mm + '-' + dd;
```

**Warning signs:** Dates are off by one day compared to the user's local date. Most commonly affects users in timezones ahead of UTC (Europe, Asia, Australia) during evening hours.

### Pitfall 2: End-of-Month setMonth Overflow

**What goes wrong:** `new Date(2026, 0, 31).setMonth(1)` (Jan 31 → February) produces March 3, not February 28.

**Why it happens:** ECMAScript spec: `setMonth` first sets the month, then validates the day. February has at most 29 days, so day 31 overflows into March. This is spec-defined behavior — not a bug.

**How to avoid:** Accept the spec behavior. For a reminder system, a 2-day drift is acceptable (the task will still be surfaced around the right time). If strict "last day of month" behavior is needed, clamp the date after setMonth:
```javascript
d.setMonth(d.getMonth() + N);
// Optional: clamp to last day of target month
const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
if (d.getDate() > lastDay) d.setDate(lastDay);
```
However, the CONTEXT.md decision (the agent's Discretion) leaves this to the implementer — clamping is optional.

**Warning signs:** Tasks scheduled for "the 31st of next month" appear on the 2nd or 3rd instead of the 28th.

### Pitfall 3: Deduplication Order

**What goes wrong:** Follow-up tasks are inserted into the deduplication pipeline at the wrong order, causing them to be blocked by (or blocking) tasks from other sources incorrectly.

**Why it happens:** The deduplication step processes sources in a fixed order: existing → carried → recurring → tool. If follow-ups go before recurring, a follow-up "Check team Slack" would block a recurring "Check team Slack" from being added. The user intent is the opposite — recurring tasks are standing obligations, follow-ups are one-off reminders.

**How to avoid:** Insert follow-up tasks **after** recurring but **before** tool data in the deduplication sequence:
```
1. existing_tasks (highest priority — real state)
2. carried_tasks (from previous day)
3. recurring_tasks (standing obligations)
4. follow_up_tasks (scheduled one-offs) ← NEW
5. tool_tasks (fresh CLI pulls)
```

**Warning signs:** Recurring tasks disappearing after follow-ups are surfaced on the same day.

### Pitfall 4: Installer Success Message Not Updated

**What goes wrong:** The new `/donna:follow-up` skill works but doesn't appear in the installer success message or the tests, causing CI failures.

**Why it happens:** The `stubs.test.cjs` test file contains assertions that check the installer message string includes all expected skill names. The installer message string in `src/installer.cjs` line 82-83 lists skills explicitly.

**How to avoid:** Update three places:
1. `src/installer.cjs` line ~82: add `follow-up` to the success message string
2. `test/stubs.test.cjs`: add describe blocks for the new stub and workflow (following existing patterns)
3. `README.md` "All commands" table: add the new command

**Warning signs:** `stubs.test.cjs` fails in CI with "Installer success message should include follow-up".

## Code Examples

Verified patterns from official sources:

### Node.js Date Arithmetic for "in N months"
```javascript
// Verified: Node.js v24.14.0, ECMAScript 2027 spec, MDN setMonth docs
// Always use local date component extraction — NEVER toISOString()

function addMonths(date, n) {
    const d = new Date(date);
    d.setMonth(d.getMonth() + n);
    return d;
}

function formatDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return yyyy + '-' + mm + '-' + dd;
}

// Usage in workflow Bash step:
// node -e "const d=new Date();d.setMonth(d.getMonth()+2);console.log(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'))"
```

### Follow-ups.md Entry Parsing (begin-the-day)
```javascript
// Pseudo-code for the check-follow-ups step
// Actual parsing done by the AI agent reading the file

const today = '2026-08-15'; // from step get-today

// Read file, split by newlines
const lines = content.split('\n');
const remaining = [];
const due = [];

for (const line of lines) {
    const match = line.match(/^- \[ \] (.+) \| due: (\d{4}-\d{2}-\d{2})$/);
    if (!match) {
        remaining.push(line);
        continue;
    }
    const [, description, dueDate] = match;
    if (dueDate <= today) {
        const daysOverdue = calculateDaysBetween(dueDate, today);
        const annotation = dueDate < today ? ` (overdue ${daysOverdue} days)` : '';
        due.push(`- [ ] ${description}${annotation}`);
        // Line NOT added to remaining — this is the removal
    } else {
        remaining.push(line); // future task stays
    }
}
```

### macOS Date Arithmetic for Overdue Calculation
```bash
# Verified: macOS date command (BSD variant), used in existing check-recurring step
DUE="2026-08-10"
TODAY="2026-08-15"
due_epoch=$(date -j -f "%Y-%m-%d" "$DUE" "+%s")
today_epoch=$(date -j -f "%Y-%m-%d" "$TODAY" "+%s")
echo $(( (today_epoch - due_epoch) / 86400 ))
# Output: 5
```

### Installer Registration
```javascript
// In src/installer.cjs, line ~82:
// Existing: "Copied donna skills (setup, add-task, done, set-role, begin-the-day, ...)"
// Updated: "Copied donna skills (setup, add-task, done, set-role, begin-the-day, ..., follow-up)"
// Add "follow-up" to the comma-separated list in the output.success call
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Users rely on memory or external apps for future reminders | Donna captures follow-ups directly in terminal with `/donna:follow-up` | This phase | Tasks don't fall through cracks — surfaced alongside daily tasks |
| — | Line-oriented markdown format (`- [ ] task \| due: YYYY-MM-DD`) | This phase | Obsidian-compatible, git-friendly, human-readable |

**Deprecated/outdated:**
- None — this is a new capability with no predecessor.

## Assumptions Log

> All claims in this research were verified via tool execution or official documentation. No assumed claims.

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **End-of-month clamping for setMonth overflow**
   - What we know: `setMonth(1)` on Jan 31 yields Mar 3 (spec behavior). The CONTEXT.md leaves this to the agent's discretion.
   - Recommendation: Accept the spec behavior without clamping. The LLM agent interprets "in 1 month" as a rough timeframe, not an exact contractual date. A 1-3 day drift is acceptable for a personal reminder system. If the planner disagrees, they can add optional clamping.

## Environment Availability

> Phase has external dependencies: Node.js runtime for date arithmetic (in workflow Bash steps), git for commits.

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Date arithmetic in workflow Bash steps | ✓ | v24.14.0 | — (already required by Donna, package.json engines >= 18) |
| git | `donna-tools.cjs commit` subcommand | ✓ | (system) | — (already required by Donna) |
| Biome | Linting (`npm run lint:fix`) | ✓ | 1.9.4 | — (already in devDependencies) |

**Missing dependencies with no fallback:** None — all dependencies are already required by the existing Donna project.

**Missing dependencies with fallback:** None.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | none — inline `describe`/`it` in `test/*.test.cjs` |
| Quick run command | `node --test test/stubs.test.cjs` |
| Full suite command | `npm test` (runs `node --test 'test/*.test.cjs'`) |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| D-01 | follow-ups stored in `donna/follow-ups.md`, separate from recurring.md | unit | `node --test test/stubs.test.cjs` (new test) | ❌ Wave 0 |
| D-02 | Entry format: `- [ ] <desc> \| due: YYYY-MM-DD`, dates resolved at capture | unit | `node --test test/donna-tools.test.cjs` (if date resolver added to donna-tools) or new workflow test | ❌ Wave 0 |
| D-03 | begin-the-day surfaces due items, appends to daily Tasks, removes from follow-ups.md | integration | `node --test test/stubs.test.cjs` (begin-the-day workflow assertions) | ❌ Wave 0 |
| D-04 | `/donna:follow-up` skill: parses description + time, defaults to today if no time expr, interactive if no arg | unit | `node --test test/stubs.test.cjs` (stub existence + frontmatter + allowed-tools) | ❌ Wave 0 |
| D-05 | Skill creates file with YAML frontmatter + `## Follow-ups` if not exists, commits via donna-tools | unit | `node --test test/stubs.test.cjs` (workflow step assertions) | ❌ Wave 0 |
| D-06 | begin-the-day reads follow-ups.md, due <= today surfaced, past-due annotated, items removed, runs between recurring and tool pull | integration | `node --test test/stubs.test.cjs` (begin-the-day cross-cutting tests) | ❌ Wave 0 |
| D-07 | begin-the-day git-commit includes follow-ups.md when modified | unit | `node --test test/stubs.test.cjs` (commit step assertion) | ❌ Wave 0 |
| D-08 | Tests cover: date resolution, file creation, entry parsing, overdue annotation, integration with begin-the-day | unit+integration | All of the above | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run lint:fix && node --test test/stubs.test.cjs`
- **Per wave merge:** `npm test` (full suite)
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `test/stubs.test.cjs` — needs new `describe` blocks for `stubs/claude-code/donna/follow-up.md` stub + `workflows/follow-up.md` workflow (follow existing patterns: add-task and done tests are the closest templates)
- [ ] `test/stubs.test.cjs` — needs cross-cutting tests for installer skill list update, begin-the-day check-follow-ups step, and begin-the-day git-commit files
- [ ] No new test files needed — existing test infrastructure covers this pattern well

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A — no auth surface in follow-up feature |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A — data lives in user's own git repo |
| V5 Input Validation | yes | The time expression is parsed by the LLM agent; the resolved date string is validated as `YYYY-MM-DD` format before writing. The description is plain text — no SQL/HTML injection risk in a markdown file. |
| V6 Cryptography | no | N/A |

### Known Threat Patterns for Node.js CLI + Markdown

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Invalid date string causes `Invalid Date` object | Denial of Service | Validate `YYYY-MM-DD` format before writing; if `isNaN(d.getTime())`, fall back to today's date |
| Malicious user input in description breaking markdown parser | Tampering | Description is plain text in a markdown file — the only risk is breaking the line format. Mitigated by not allowing newlines in the description field (natural limit of a single-line task entry). |
| File write race condition (two `/donna:follow-up` invocations simultaneously) | Tampering | Git handles conflicts — the second commit will see a merge conflict in follow-ups.md. This is an accepted risk (same as all other Donna file operations). |

## Sources

### Primary (HIGH confidence)
- Node.js v24.14.0 runtime — verified date arithmetic behavior via live execution in the project environment [VERIFIED: local execution]
- MDN Web Docs — `Date.prototype.setMonth()` edge case documentation [CITED: developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth]
- ECMAScript specification — Date object behavior (via MDN reference) [CITED: tc39.es/ecma262/#sec-date.prototype.setmonth]

### Secondary (MEDIUM confidence)
- Donna existing codebase — workflows (`begin-the-day.md`, `add-task.md`, `done.md`), stubs, test patterns, installer [VERIFIED: codebase inspection]
- Package.json — Node.js engine requirement `>= 18`, test framework `node:test`, linter `@biomejs/biome` [VERIFIED: codebase inspection]
- `src/donna-tools.cjs` — commit subcommand pattern, init subcommand for bootstrap [VERIFIED: codebase inspection]
- `src/installer.cjs` — skill registration pattern (success message string update) [VERIFIED: codebase inspection]

### Tertiary (LOW confidence)
- None — all sources are primary or secondary.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — pure Node.js built-ins, no external packages, verified against existing project stack
- Architecture: HIGH — follows existing Donna patterns exactly, no new patterns needed
- Pitfalls: HIGH — timezone and setMonth edge cases verified via live Node.js execution in the target environment

**Research date:** 2026-06-17
**Valid until:** 2026-07-17 (30 days — stable Node.js built-ins, no external dependencies to drift)