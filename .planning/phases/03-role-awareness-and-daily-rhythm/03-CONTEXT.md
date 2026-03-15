# Phase 3: Role Awareness and Daily Rhythm - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Two new skills — `donna:set-role` (define role, research agent suggests recurring tasks and tools for approval) and `donna:begin-the-day` (morning ritual that carries forward open tasks and surfaces recurring tasks due today). Delivers role definition with persisted research, carry-forward logic, recurring task engine, and idempotent daily brief. External tool data in the daily brief belongs in Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Role input flow
- Two-stage sequence: first collect role + responsibilities, then research and validate before moving to tools
- Stage 1: Ask job title, then 2-3 guided follow-up questions (team size, direct reports, key responsibilities)
- Stage 2: Research agent runs, results presented as a concise summary; user can drill into categories (recurring tasks, tool suggestions) to approve/reject/modify
- When approving recurring tasks, user can add short notes (e.g. "make this biweekly") and Donna interprets and adjusts — no need for full inline editing
- Approved tools prompt the user to run `/donna:add-tool` (Phase 4) — just note them for now

### Re-run behavior
- Running `donna:set-role` again shows a menu asking intent: "It's messed up" (reset), "Got promoted / role changed" (diff-update), "Just want to refresh" (re-research current role)
- Reset: starts fresh, replaces role.md and recurring tasks
- Diff-update: shows what changed vs current role — added/removed recurring tasks — user approves the delta; preserves manually-added recurring tasks

### Research presentation
- Summary-then-drill-in: show a concise overview of what the researcher found, then let the user choose which categories to drill into for approval/modification
- Research findings persisted in `role-research.md` for reference

### Daily brief format
- Action-first layout: banner, then "Carried Forward" section, then "Due Today" (recurring) section
- No truncation — show all tasks, never hide anything
- Carried-forward tasks show inline counter: `- [ ] Follow up with Sarah (3 times)` — indicating how many times the task has been carried forward
- Terminal brief and daily file may differ in detail — file has more structure/metadata than what's printed

### Carry-forward logic
- Source: most recent previous daily file only (not all history)
- Open tasks are copied to today's file with carry-forward counter incremented
- Original tasks left in the previous day's file unchanged (historical record preserved)
- Counter stored inline in the task line: `(N times)` suffix
- `donna:done` strips the `(N times)` suffix when fuzzy-matching — counter is transparent to task completion

### Recurring task intervals
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

</decisions>

<specifics>
## Specific Ideas

- The set-role re-run menu mirrors the pattern from `donna:setup` (existing config detected → offer choices)
- Carry-forward counter format: `(3 times)` not `(3d)` — clarity over brevity
- Research summary should be concise enough to review quickly but detailed enough to drill into specific categories

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/add-task.md`: daily file creation pattern (ensure-daily-file step), config reading, Obsidian sync, git commit flow — begin-the-day will reuse the same daily file format
- `workflows/done.md`: fuzzy-matching pattern for task completion — needs to be updated to strip `(N times)` suffix
- `workflows/setup.md`: re-run detection menu pattern (check existing config → offer choices) — donna:set-role will follow the same pattern
- `src/output.cjs`: banner(), success(), fail(), info() formatting utilities
- `src/installer.cjs`: will need updates to copy new stubs (set-role, begin-the-day) and workflows

### Established Patterns
- Stub-workflow split: thin stubs in `stubs/claude-code/donna/` reference shared workflows in `~/.donna/workflows/`
- Config read from `~/.config/donna/config.md` with YAML frontmatter (storage_repo, daily_folder, auto_push)
- Daily file format: `daily/YYYY-MM-DD.md` with YAML frontmatter, `## Tasks` section, `- [ ] description` lines
- Conventional commit messages: `donna(skill-name): description`
- Obsidian sync for daily folder path
- AskUserQuestion for interactive flows

### Integration Points
- `~/.donna/workflows/` — new workflow files: `set-role.md`, `begin-the-day.md`
- `stubs/claude-code/donna/` — new stub files: `set-role.md`, `begin-the-day.md`
- Storage repo standing files: `role.md`, `role-research.md`, `recurring.md` (created by set-role, not by setup)
- `src/installer.cjs` — needs to copy new stubs and workflows
- `donna:done` workflow — needs update to handle `(N times)` suffix in fuzzy matching

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-role-awareness-and-daily-rhythm*
*Context gathered: 2026-03-15*
