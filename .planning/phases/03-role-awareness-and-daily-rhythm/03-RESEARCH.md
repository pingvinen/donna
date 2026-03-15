# Phase 3: Role Awareness and Daily Rhythm - Research

**Researched:** 2026-03-15
**Domain:** Claude Code workflow files, recurring task scheduling, carry-forward logic, idempotency patterns
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Role input flow**
- Two-stage sequence: first collect role + responsibilities, then research and validate before moving to tools
- Stage 1: Ask job title, then 2-3 guided follow-up questions (team size, direct reports, key responsibilities)
- Stage 2: Research agent runs, results presented as a concise summary; user can drill into categories (recurring tasks, tool suggestions) to approve/reject/modify
- When approving recurring tasks, user can add short notes (e.g. "make this biweekly") and Donna interprets and adjusts — no need for full inline editing
- Approved tools prompt the user to run `/donna:add-tool` (Phase 4) — just note them for now

**Re-run behavior**
- Running `donna:set-role` again shows a menu asking intent: "It's messed up" (reset), "Got promoted / role changed" (diff-update), "Just want to refresh" (re-research current role)
- Reset: starts fresh, replaces role.md and recurring tasks
- Diff-update: shows what changed vs current role — added/removed recurring tasks — user approves the delta; preserves manually-added recurring tasks

**Research presentation**
- Summary-then-drill-in: show a concise overview of what the researcher found, then let the user choose which categories to drill into for approval/modification
- Research findings persisted in `role-research.md` for reference

**Daily brief format**
- Action-first layout: banner, then "Carried Forward" section, then "Due Today" (recurring) section
- No truncation — show all tasks, never hide anything
- Carried-forward tasks show inline counter: `- [ ] Follow up with Sarah (3 times)` — indicating how many times the task has been carried forward
- Terminal brief and daily file may differ in detail — file has more structure/metadata than what's printed

**Carry-forward logic**
- Source: most recent previous daily file only (not all history)
- Open tasks are copied to today's file with carry-forward counter incremented
- Original tasks left in the previous day's file unchanged (historical record preserved)
- Counter stored inline in the task line: `(N times)` suffix
- `donna:done` strips the `(N times)` suffix when fuzzy-matching — counter is transparent to task completion

**Recurring task intervals**
- Stored in `recurring.md` with human-readable named-day intervals: "every Monday", "every weekday", "first Monday of month", "every other Friday"
- Format: `- Task description: interval` (one line per task)
- Recurring tasks due today are auto-added to the daily file as checkable tasks
- Idempotency via post-processing deduplication: build the full daily file (carry forward + recurring + existing), then deduplicate by task description in one pass — handles all duplicate sources with a single mechanism

### Claude's Discretion
- Research agent implementation pattern (Task tool spawning vs alternative — flagged concern in STATE.md needs investigation)
- Due-date logic for recurring tasks (calendar match vs last-completed tracking)
- Daily file YAML frontmatter fields and metadata structure
- Exact deduplication algorithm
- Storage format details for `role.md` and `role-research.md`
- How "every other Friday" and similar complex intervals are tracked

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ROLE-01 | User can run `/donna:set-role` to define their job role via interactive prompts | Two-stage collection flow using AskUserQuestion; re-run detection mirrors setup.md pattern |
| ROLE-02 | Research agent spawned to find recurring tasks and tools for that role | Workflow-driven inline research loop (AskUserQuestion + WebSearch steps) is the reliable pattern; `context: fork` subagent is an alternative requiring investigation |
| ROLE-03 | Research findings presented for approve/reject/modify before save | Summary-then-drill AskUserQuestion flow; approved tools noted for Phase 4 |
| ROLE-04 | Role stored in `role.md`, research in `role-research.md` in storage repo | Plain markdown with YAML frontmatter; Write tool + git commit, same as Phase 2 |
| DAILY-01 | `/donna:begin-the-day` carries forward open tasks from most recent previous daily file | Previous-file lookup via Bash glob/sort; carry-forward counter `(N times)` suffix |
| DAILY-02 | `begin-the-day` surfaces recurring tasks due today | Date math against `recurring.md` intervals; calendar-match approach sufficient for Phase 3 intervals |
| DAILY-04 | `begin-the-day` is idempotent — safe to run multiple times | Single-pass deduplication by task description after assembling full task list |
| STORE-03 | Skills read only the files they need (not the full repo) | Each workflow reads exactly: config.md, today's daily file, recurring.md, role.md — never globs the full repo |
</phase_requirements>

---

## Summary

Phase 3 adds two new skills — `donna:set-role` and `donna:begin-the-day` — using the same stub-workflow architecture established in Phase 2. The tech domain is entirely Claude Code workflow files (markdown with `<step>` tags), bash date arithmetic, and plain markdown storage. No new npm packages are needed.

The key open question flagged in STATE.md — whether the Task/Agent tool can be used inside a workflow file to spawn a research subagent — has been resolved through documentation review. The answer is: **use an inline research loop rather than spawning a subagent.** Workflow files (`.md` files read via `@` reference) run in the main conversation context. The Claude Code skill system's `context: fork` and `Agent` tool are features of SKILL.md frontmatter, not of workflow content. A workflow step that instructs Claude to "research X using WebSearch and synthesize findings" is the correct, reliable, and already-proven pattern for inline research.

The recurring task scheduling domain is straightforward for the intervals required in Phase 3. Calendar-match logic (compare today's day-of-week/date to an interval string) covers all specified patterns. "Every other Friday" requires tracking last-run state, which the YAML frontmatter of `recurring.md` can store per-task. The carry-forward counter and idempotency deduplication are pure string manipulation with no external dependencies.

**Primary recommendation:** Implement both workflows as `<step>`-structured markdown files following the exact pattern of `setup.md`, `add-task.md`, and `done.md`. The research agent for `set-role` is an inline workflow step that uses WebSearch, not a forked subagent.

---

## Standard Stack

### Core

| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Node.js built-ins | >=18 | Installer updates (stubs copy) | Already the project runtime |
| Claude Code workflow markdown | Current | Skill execution engine | Project convention established in Phase 2 |
| Bash `date` | OS-provided | Date arithmetic, file lookup | Used in add-task.md and done.md already |
| `git -C <repo>` | OS-provided | Commit storage changes | Established pattern in every workflow |

### Supporting

| Library / Tool | Version | Purpose | When to Use |
|----------------|---------|---------|-------------|
| AskUserQuestion | Claude tool | Interactive multi-step flows | Every interactive step in set-role and begin-the-day |
| WebSearch | Claude tool | Role research agent step | The inline research step in set-role Stage 2 |
| Write / Read | Claude tools | File creation and reading | All storage operations |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Inline research loop (WebSearch step) | `context: fork` subagent via SKILL.md | Fork requires rewriting stubs as full SKILL.md files, adds context isolation complexity, and cannot use AskUserQuestion in background mode. Inline is simpler and matches existing pattern. |
| Calendar-match interval logic | Last-completed tracking | Last-completed is more accurate for "every 2 weeks" but requires per-task state. Calendar-match covers all Phase 3 intervals with no state beyond today's date. Phase 3 only. |
| `(N times)` inline counter | Separate carry-forward metadata file | Inline is Obsidian-visible, human-readable, and matches the locked decision. No separate file needed. |

**Installation:** No new packages required for Phase 3.

---

## Architecture Patterns

### Recommended Project Structure (additions to existing)

```
workflows/
├── add-task.md           # Existing
├── done.md               # Existing — needs (N times) strip update
├── setup.md              # Existing
├── set-role.md           # NEW: two-stage role definition
└── begin-the-day.md      # NEW: morning ritual

stubs/claude-code/donna/
├── add-task.md           # Existing
├── done.md               # Existing
├── setup.md              # Existing
├── set-role.md           # NEW
└── begin-the-day.md      # NEW

test/
├── stubs.test.cjs        # Existing — extend with new stub tests
├── setup-workflow.test.cjs # Existing
├── set-role-workflow.test.cjs   # NEW
└── begin-the-day-workflow.test.cjs  # NEW

[storage-repo]/
├── daily/YYYY-MM-DD.md   # Existing daily file format
├── role.md               # NEW: role definition (YAML frontmatter + prose)
├── role-research.md      # NEW: research findings (plain markdown)
└── recurring.md          # NEW: recurring task list
```

### Pattern 1: Stub Structure (established — no change)

**What:** A thin `.md` file in `stubs/claude-code/donna/` with YAML frontmatter and an `@~/.donna/workflows/<name>.md` reference. The `@` syntax loads the full workflow into Claude's context.

**When to use:** Every Donna skill. Unchanged from Phase 2.

```markdown
---
name: donna:set-role
description: Define your job role, research recurring tasks, and build your daily rhythm
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
  - WebSearch
---

<objective>
Run the Donna set-role workflow.
</objective>

<execution_context>
@~/.donna/workflows/set-role.md
</execution_context>
```

Note: `WebSearch` must be listed in `allowed-tools` for the research step to work without permission prompts.

### Pattern 2: Re-run Detection Menu (established — replicate)

**What:** Check if the standing file already exists before proceeding. If yes, present a menu via AskUserQuestion. Mirrors `setup.md`'s re-run flow.

**When to use:** `set-role.md` — check for `role.md` existence at step start.

```markdown
<step name="check-existing-role">
Run via Bash:
```bash
test -f <storage_repo>/role.md && echo "exists" || echo "missing"
```

If "exists", proceed to re-run menu (step: rerun-menu).
If "missing", proceed to first-run setup (step: ask-role).
</step>

<step name="rerun-menu">
Use AskUserQuestion:
```
Your role is already defined. What would you like to do?

1. Something got messed up — start fresh (reset)
2. Got promoted or changed roles — update (diff-update)
3. Just want to refresh the research — re-research current role
4. Cancel
```
</step>
```

### Pattern 3: Previous-Daily-File Lookup

**What:** Find the most recent daily file before today using Bash, not by scanning all files. Read only that one file.

**When to use:** `begin-the-day.md` carry-forward step.

```bash
# Get today's date
TODAY=$(date +%Y-%m-%d)
DAILY_DIR="<storage_repo>/<daily_folder>"

# Find the most recent previous file (sorted, last before today)
PREV_FILE=$(ls "$DAILY_DIR"/*.md 2>/dev/null \
  | sort \
  | grep -v "$TODAY" \
  | tail -1)
```

If `PREV_FILE` is empty, there is no previous file — skip carry-forward.

This reads at most two files: the previous daily file and today's daily file. Satisfies STORE-03.

### Pattern 4: Carry-Forward Counter

**What:** Open tasks from the previous day are appended to today's file with a `(N times)` suffix. If a task already has `(N times)`, increment N. If no suffix, start at `(1 times)`.

**Regex logic (conceptual):**
```
If task ends with " (N times)" → change to " (N+1 times)"
If task has no suffix          → append " (1 times)"
Strip suffix for fuzzy-match   → remove " (\d+ times)" before comparing in done.md
```

The `done.md` fuzzy-match step needs one additional line: strip the `(N times)` suffix from the task description before matching against the user's input.

### Pattern 5: Recurring Task Due-Date Logic

**What:** Parse interval strings from `recurring.md` and compare against today's date.

**Intervals to support (Phase 3):**

| Interval string | Logic |
|-----------------|-------|
| `every Monday` | `day_of_week == Monday` |
| `every weekday` | `day_of_week in Mon-Fri` |
| `first Monday of month` | `day_of_week == Monday && day_of_month <= 7` |
| `every other Friday` | Requires last-run tracking (see below) |

**Calendar-match implementation:**
```bash
DAY_OF_WEEK=$(date +%A)      # "Monday", "Friday", etc.
DAY_OF_MONTH=$(date +%d)     # "01"-"31"
MONTH=$(date +%m)
```

**"Every other Friday" tracking:** Store `last_run: YYYY-MM-DD` in YAML frontmatter on each task line in `recurring.md`. On begin-the-day, compute days since last_run; if >= 14 days, task is due. This requires `recurring.md` to use YAML-style metadata per task rather than the simple `- Task: interval` format.

**Recommended approach for Phase 3:** Use a two-part format in `recurring.md`:
```markdown
---
# recurring tasks metadata (per-task last_run tracking)
---

- Review sprint backlog: every Monday
- Check team Slack: every weekday
- 1:1 prep notes: every other Friday | last_run: 2026-03-06
- Quarterly review: first Monday of month
```

The `| last_run: YYYY-MM-DD` suffix is only required for "every other N" intervals. Simpler intervals use calendar-match only.

### Pattern 6: Idempotency via Single-Pass Deduplication

**What:** Assemble the full task list (existing today's file tasks + carry-forward + recurring due today), then deduplicate by normalized task description in one pass before writing.

**Normalization:** Strip `- [ ] `, strip `- [x] `, strip `(N times)` suffix, lowercase, trim whitespace. Compare normalized forms.

**Algorithm:**
1. Collect existing tasks from today's file (both open and closed)
2. Collect carry-forward tasks (open only from previous file)
3. Collect recurring tasks due today
4. Normalize all descriptions; keep first occurrence of each, prefer existing over incoming
5. Write deduplicated task list to today's file

Running begin-the-day twice produces identical output because step 4 discards duplicates.

### Anti-Patterns to Avoid

- **Reading all daily files:** Only ever read the most recent previous file. Never scan the full `daily/` directory's file contents. File listing is fine; file reading must be targeted.
- **Mutating the previous daily file:** The carry-forward step reads the previous file and writes only to today's file. The previous file is never modified. Historical record is preserved.
- **Storing recurring state inside today's daily file:** The `last_run` tracking for "every other" intervals belongs in `recurring.md`, not in daily files.
- **Using `context: fork` in workflow files:** Workflow `.md` files are loaded via `@` reference into the main conversation. They don't have frontmatter that controls subagent behavior. Inline steps are the correct pattern.
- **Spawning a real internet research subagent from within a workflow step:** A workflow step that says "use WebSearch to research X" works reliably. A step that says "spawn a Task to do research" relies on Claude's agentic behavior and may not work consistently in all Claude Code versions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recurring task interval scheduling | Custom cron-like parser | Simple bash date comparison + `recurring.md` strings | Phase 3 intervals are simple enough for direct comparison; full cron syntax is out of scope (REQUIREMENTS.md Out of Scope) |
| Fuzzy task matching | Edit distance / ML matcher | Claude's natural language understanding in the done.md pattern | Already working in Phase 2; just add `(N times)` strip |
| Role research | Custom web scraper | WebSearch tool step in set-role workflow | Claude Code provides WebSearch; no custom HTTP client needed |
| Interactive approval flows | Custom UI | AskUserQuestion with options | Already used throughout Phase 2 |
| File deduplication | External library | In-workflow normalization logic (string ops) | Trivial string comparison; no library justified |

**Key insight:** This phase is almost entirely workflow authoring (markdown + step logic), not code. The only code changes are in `installer.cjs` (add new stubs to the copy step) and `done.md` (strip counter suffix). Everything else is new `.md` files.

---

## Common Pitfalls

### Pitfall 1: WebSearch Not in Allowed-Tools

**What goes wrong:** The research step in `set-role.md` calls WebSearch but the stub doesn't list it in `allowed-tools` → Claude prompts for permission on every research call, breaking the flow.

**Why it happens:** `allowed-tools` in stub frontmatter controls which tools Claude can use without per-use approval. WebSearch is not in the existing stubs.

**How to avoid:** Add `- WebSearch` to the `allowed-tools` list in `stubs/claude-code/donna/set-role.md`.

**Warning signs:** User sees "Do you want to allow WebSearch?" prompts mid-research.

### Pitfall 2: Previous File Lookup Finds Today's File

**What goes wrong:** `ls | sort | tail -1` finds today's file (same date) → carry-forward reads today's file as the source → tasks loop back.

**Why it happens:** If `begin-the-day` has already created today's daily file before the lookup step.

**How to avoid:** Explicitly exclude today's date in the lookup:
```bash
grep -v "$(date +%Y-%m-%d)"
```
The lookup must happen after reading today's date, and the exclusion must be explicit.

### Pitfall 3: Counter Increment on Already-Counted Tasks

**What goes wrong:** Running `begin-the-day` twice: first run adds `(1 times)`, second run adds `(2 times)` to a task that was only carried forward once.

**Why it happens:** Deduplication step not comparing normalized (counter-stripped) descriptions.

**How to avoid:** Normalization in the deduplication pass MUST strip `(N times)` before comparing. Tasks that already exist in today's file (with any counter) are treated as already-present and not re-added.

### Pitfall 4: Done Workflow Fails to Match Carry-Forward Tasks

**What goes wrong:** User runs `/donna:done "Follow up with Sarah"` but the task is stored as `- [ ] Follow up with Sarah (3 times)` → fuzzy match fails.

**Why it happens:** `done.md` fuzzy-match doesn't account for the counter suffix added by begin-the-day.

**How to avoid:** Update `done.md` mark-complete step: when fuzzy-matching, strip ` (\d+ times)$` from stored task descriptions before comparing to the user's input. When writing the completed task, strip the suffix: `- [x] Follow up with Sarah` (clean, no counter).

### Pitfall 5: Role Research Produces Low-Quality Results Without Guided Prompting

**What goes wrong:** WebSearch step with a vague query returns generic results → suggested recurring tasks are too generic to be useful.

**Why it happens:** Research step doesn't use the collected role details (title, team size, responsibilities) to construct a targeted query.

**How to avoid:** The research step must construct the query using all collected stage-1 data: `"[job title] with [N] direct reports responsibilities daily tasks recurring [industry context]"`.

### Pitfall 6: Recurring Tasks Appear Even When Already Closed Today

**What goes wrong:** User closes a recurring task midday, then runs `begin-the-day` again → task reappears as open.

**Why it happens:** Deduplication keyed on task description matches `- [x] Task` (closed) against `- [ ] Task` (new recurring) as different entries.

**How to avoid:** Deduplication must normalize both open (`- [ ]`) and closed (`- [x]`) prefixes. If a task exists in any state (open or closed) in today's file, it must not be re-added from the recurring list.

---

## Code Examples

### Carry-Forward Counter: Increment Logic

```markdown
<!-- In begin-the-day.md, carry-forward step -->
For each open task `- [ ] <description>` in the previous daily file:

1. Check if description ends with ` (N times)` pattern (e.g., ` (1 times)`, ` (3 times)`)
2. If yes: extract N, increment to N+1, replace the suffix
3. If no: append ` (1 times)` to the description
4. The resulting task: `- [ ] <description> (N+1 times)` or `- [ ] <description> (1 times)`

Example:
  Previous: `- [ ] Follow up with Sarah`        → Today: `- [ ] Follow up with Sarah (1 times)`
  Previous: `- [ ] Follow up with Sarah (1 times)` → Today: `- [ ] Follow up with Sarah (2 times)`
  Previous: `- [ ] Follow up with Sarah (2 times)` → Today: `- [ ] Follow up with Sarah (3 times)`
```

### Recurring Task Due-Check (Bash)

```bash
# Source: established bash date patterns
TODAY_DOW=$(date +%A)         # "Monday", "Tuesday", ...
TODAY_DOM=$(date +%-d)        # Day of month as integer (1-31), no leading zero

# "every Monday" → due if today is Monday
is_due_every() {
  local interval="$1"
  local day="${interval#every }"  # "Monday"
  [ "$TODAY_DOW" = "$day" ]
}

# "every weekday" → due Mon-Fri
is_due_weekday() {
  case "$TODAY_DOW" in
    Monday|Tuesday|Wednesday|Thursday|Friday) return 0;;
    *) return 1;;
  esac
}

# "first Monday of month" → day is Monday AND day_of_month <= 7
is_due_first_weekday_of_month() {
  local day="$1"  # "Monday"
  [ "$TODAY_DOW" = "$day" ] && [ "$TODAY_DOM" -le 7 ]
}

# "every other Friday" → days since last_run >= 14
is_due_every_other() {
  local last_run="$1"  # "YYYY-MM-DD"
  local today=$(date +%Y-%m-%d)
  local days=$(( ($(date -d "$today" +%s) - $(date -d "$last_run" +%s)) / 86400 ))
  [ "$days" -ge 14 ]
}
```

Note: `date -d` is GNU date syntax (Linux). On macOS (where Donna runs), use `date -j -f "%Y-%m-%d"` instead. Since the workflow runs via Bash inside Claude Code on macOS, use:

```bash
# macOS-compatible days-since calculation
last_run_epoch=$(date -j -f "%Y-%m-%d" "$last_run" "+%s")
today_epoch=$(date +%s)
days=$(( (today_epoch - last_run_epoch) / 86400 ))
```

### role.md Format

```markdown
---
job_title: Engineering Manager
team_size: 8
direct_reports: 5
key_responsibilities:
  - Team performance and growth
  - Sprint planning and delivery
  - Stakeholder communication
  - Hiring and interviews
updated: 2026-03-15
---

# Role: Engineering Manager

[Prose summary of the role as described by the user, written naturally.]
```

### role-research.md Format

```markdown
---
researched: 2026-03-15
role: Engineering Manager
---

# Role Research: Engineering Manager

## Summary
[2-3 sentence overview of what was found]

## Recurring Task Suggestions

### Daily
- [ ] Check team Slack and unblock blockers
- [ ] Review open PRs assigned to team

### Weekly
- [ ] 1:1 with each direct report
- [ ] Sprint review / retrospective prep
- [ ] Review hiring pipeline

### Monthly
- [ ] Performance review prep
- [ ] Team health survey

## Tool Suggestions
- Jira (sprint management)
- Greenhouse (hiring)
- GitHub (PR reviews)

## Notes
[Any additional context from research]
```

### recurring.md Format

```markdown
---
# Recurring tasks — managed by donna:set-role
---

- Review sprint backlog: every Monday
- Check team Slack: every weekday
- 1:1 prep notes: every other Friday | last_run: 2026-03-14
- Quarterly review: first Monday of month
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `Task` tool in Claude Code | Renamed to `Agent` tool (v2.1.63) | January 2026 | Old `Task(...)` references still work as aliases, but new code should use `Agent` terminology |
| Workflow files only | Skills with `context: fork` option | 2025-2026 | Forks are for SKILL.md files, not workflow `.md` files; workflow pattern unchanged |
| `.claude/commands/` | `.claude/skills/` (commands still work) | 2025 | Donna uses `~/.donna/workflows/` + stubs, unaffected by this change |

**Deprecated/outdated:**
- `Task` tool name: still works as alias, but Agent is the current name per Claude Code docs v2.1.63+. Donna workflows that say "use the Task tool" should say "use the Agent tool" or avoid the naming entirely by describing the behavior ("research and return findings").

---

## Open Questions

1. **"Every other Friday" last_run update**
   - What we know: The begin-the-day workflow must update `last_run` in `recurring.md` when it adds an "every other" task to today's file.
   - What's unclear: Whether Claude's Write tool can reliably do an in-place partial update of a specific line in `recurring.md` without corrupting the file.
   - Recommendation: Read the full `recurring.md`, update the relevant line in memory, write the full file back. Same pattern as done.md's mark-complete step. No partial file update needed.

2. **Stage 2 Research Quality vs Token Cost**
   - What we know: WebSearch inside a workflow step will consume tokens from the main conversation context. A role research pass (3-5 searches, synthesis) could be substantial.
   - What's unclear: Whether this is a practical problem for users or just a theoretical concern.
   - Recommendation: The set-role workflow is not time-sensitive (not a frequent operation). Token cost is acceptable. Keep research focused with targeted queries (using collected role details). Document this in the workflow step as a note about expected duration.

3. **Deduplication: task text normalization edge cases**
   - What we know: Deduplication normalizes task descriptions by stripping checkbox prefix and `(N times)` suffix.
   - What's unclear: What if a recurring task and a carried-forward task have slightly different wording (e.g., "Review PRs" vs "Review pull requests")?
   - Recommendation: Use exact string match after normalization, not fuzzy. If they're different strings, they're treated as different tasks. Fuzzy deduplication is YAGNI at this stage.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in test runner (`node:test`) |
| Config file | None — uses `npm test` script: `node --test 'test/*.test.cjs'` |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ROLE-01 | `set-role` stub exists with correct frontmatter | unit | `npm test -- --test-name-pattern "stub: stubs/claude-code/donna/set-role"` | Wave 0 |
| ROLE-01 | `set-role` workflow file exists and references config | unit | `npm test -- --test-name-pattern "workflow: workflows/set-role"` | Wave 0 |
| ROLE-02 | Workflow contains WebSearch step | unit | `npm test -- --test-name-pattern "set-role.*WebSearch"` | Wave 0 |
| ROLE-03 | Workflow contains approval flow (AskUserQuestion) | unit | `npm test -- --test-name-pattern "set-role.*AskUserQuestion"` | Wave 0 |
| ROLE-04 | Workflow contains role.md write step | unit | `npm test -- --test-name-pattern "set-role.*role\.md"` | Wave 0 |
| DAILY-01 | `begin-the-day` stub exists with correct frontmatter | unit | `npm test -- --test-name-pattern "stub.*begin-the-day"` | Wave 0 |
| DAILY-01 | Workflow contains carry-forward step | unit | `npm test -- --test-name-pattern "begin-the-day.*carry"` | Wave 0 |
| DAILY-02 | Workflow references recurring.md | unit | `npm test -- --test-name-pattern "begin-the-day.*recurring"` | Wave 0 |
| DAILY-04 | Workflow contains deduplication step | unit | `npm test -- --test-name-pattern "begin-the-day.*dedup"` | Wave 0 |
| STORE-03 | Workflows read specific files, not full repo | unit | `npm test -- --test-name-pattern "targeted file reads"` | Wave 0 |
| (cross-cut) | Installer copies new stubs | unit | Extend `installer.test.cjs` — check set-role.md and begin-the-day.md are copied | Extend existing |
| (cross-cut) | `done.md` strips `(N times)` suffix | unit | Extend `stubs.test.cjs` — check done.md workflow contains counter strip logic | Extend existing |

Note: Node's `--test-name-pattern` flag filters by describe/it block names. The pattern above represents expected test naming in the new test files, not existing behavior.

### Sampling Rate
- **Per task commit:** `npm test`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `test/set-role-workflow.test.cjs` — stub and workflow existence checks for ROLE-01 through ROLE-04
- [ ] `test/begin-the-day-workflow.test.cjs` — stub and workflow existence checks for DAILY-01, DAILY-02, DAILY-04, STORE-03
- [ ] Extend `test/installer.test.cjs` — verify new stubs are copied (set-role.md, begin-the-day.md)
- [ ] Extend `test/stubs.test.cjs` — verify done.md now contains counter-strip logic

---

## Sources

### Primary (HIGH confidence)
- [Claude Code Slash Commands / Skills docs](https://code.claude.com/docs/en/slash-commands) — `allowed-tools`, `context: fork`, `@` reference resolution, AskUserQuestion
- [Claude Code Subagents docs](https://code.claude.com/docs/en/sub-agents) — Agent tool rename from Task (v2.1.63), subagent limitations (cannot spawn subagents), foreground vs background AskUserQuestion behavior
- Existing codebase (`workflows/setup.md`, `workflows/add-task.md`, `workflows/done.md`) — established patterns directly applicable

### Secondary (MEDIUM confidence)
- WebSearch result: Task tool renamed to Agent in Claude Code v2.1.63 (January 2026), verified against official sub-agents doc
- WebSearch result: `context: fork` skills run in isolated subagent context, cannot use AskUserQuestion in background — verified against official skills doc

### Tertiary (LOW confidence)
- macOS `date -j -f` syntax for date arithmetic — standard macOS behavior, confirmed by established bash knowledge, not doc-verified

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new packages; all tools are Claude Code builtins or bash
- Architecture: HIGH — patterns directly derived from existing codebase + official docs
- Pitfalls: HIGH — deduced from code review of done.md, add-task.md, and official subagent docs
- Research agent pattern: HIGH — official docs confirm workflow inline steps are the reliable pattern; `context: fork` is SKILL.md-only

**Research date:** 2026-03-15
**Valid until:** 2026-04-15 (Claude Code evolves fast; verify subagent docs if planning is delayed significantly)
