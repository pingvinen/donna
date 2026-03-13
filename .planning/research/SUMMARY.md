# Project Research Summary

**Project:** Personal Assistant Skills
**Domain:** CLI-native personal productivity / task management (Claude Code skill suite)
**Researched:** 2026-03-13
**Confidence:** MEDIUM

## Executive Summary

This project builds a personal assistant as a suite of Claude Code custom slash commands — markdown prompt files installed to `~/.claude/commands/` that operate on a git-backed markdown state repository. There is no traditional software stack: no build step, no package manager, no runtime process. The architecture is deliberately minimal. State lives in structured markdown files committed to git after every skill invocation. External integrations (GitHub CLI, Jira CLI) are optional enrichment, never foundational dependencies.

The recommended approach is a phased build that prioritizes capture and daily rhythm first, then adds the AI intelligence layer (role-aware triage, meeting follow-ups), and integrates optional external tooling last. This mirrors the critical path in the feature dependency graph: `donna:setup` must exist before everything, and every other skill depends on having data flowing in before intelligence can be applied to it. The key differentiators over existing tools (Things 3, Taskwarrior, OmniFocus) are role-aware recurring task suggestions via a research sub-agent and AI-powered triage — both of which require the daily data layer to be solid first.

The top risk is adoption failure caused by capture friction. Every productivity tool graveyard is filled with systems that asked users to do too much to add a task. The `donna:add-task` skill must work as a single freeform command from any directory, with all metadata optional. Secondary risks are context window exhaustion as state files grow over months (mitigated by time-windowed reads and bounded file sizes) and markdown state corruption from concurrent writes (mitigated by append-only daily files and a single-writer principle per standing file).

## Key Findings

### Recommended Stack

The platform is Claude Code itself. Skills are pure markdown files — no code, no dependencies, no compilation. All persistence is git-backed markdown in a user-chosen repository. This is not a constraint; it is the correct design. Markdown is human-readable, diff-friendly, editable outside Claude Code, and requires no schema migration when the format evolves.

**Core technologies:**
- Claude Code custom slash commands (`~/.claude/commands/donna:*.md`): skill definition format — native mechanism, each file IS the skill
- Git via Bash tool: state persistence and audit trail — every skill invocation commits changes, giving full history and rollback
- Markdown files: all state storage — no database, no JSON fragility, trivially human-editable
- `gh` CLI (optional): GitHub PR and issue integration — available on most developer machines, rich JSON output
- `jira` CLI (optional): Jira ticket integration — more fragmented ecosystem (go-jira vs atlassian-cli), lower confidence

**Critical design decision:** Skills must live at user-level (`~/.claude/commands/`), not project-level. They operate on an external state repo regardless of which project the user is currently in.

### Expected Features

**Must have (table stakes):**
- Quick task capture — zero friction, single freeform argument, under 10 seconds from invocation to commit
- Daily view / "today" list — the primary surface; not "all tasks" but curated today
- Carry-forward of incomplete tasks — automatic on `begin-the-day`; missed items must not disappear
- Recurring tasks — daily, weekly-on-day, monthly minimum; surfaced at morning ritual
- Task completion — mark done with checkbox; clean feedback loop
- Basic prioritization — priority flag used by triage
- Persistence across sessions — git-backed markdown handles this natively

**Should have (differentiators):**
- Role-aware recurring task suggestions — research sub-agent proposes recurring tasks from job role; no other tool does this
- AI-powered triage (`donna:next`) — recommends what to work on next with rationale, goes beyond list sorting
- Meeting follow-up capture with people tracking — links follow-ups to named people, enables "what do I owe Sarah?" queries
- Morning ritual as first-class ceremony — `begin-the-day` is an intentional daily moment, not just a dump
- Git-backed version history — developers appreciate `git log` on their work history
- Graceful degradation of integrations — works standalone, richer with Jira/`gh`

**Defer (v2+):**
- Calendar integration — Google Calendar API is a maintenance nightmare; reference times in task text instead
- Natural language date parsing — deceptively hard to get right; use structured recurrence instead
- Multi-user collaboration — single-user tool by design; git handles repo sharing if needed
- Habit tracking with streaks — separate product territory
- Push notifications / reminders — pull model only; morning ritual and on-demand triage are the notification system

### Architecture Approach

The system follows a skill-per-command architecture where each slash command is a self-contained markdown prompt file reading from and writing to a shared file-based state layer. Skills are stateless between invocations — all persistence lives in the filesystem. Data flows in one direction per invocation: read state, do work, write state, commit. No skill calls another skill at runtime; cross-skill dependencies are mediated entirely through shared files.

**Major components:**
1. `donna:setup` — bootstrap config, writes `~/.config/donna/config.md` with repo path and available CLI tools
2. `donna:set-role` — defines job role, spawns web research sub-agent, proposes recurring tasks for approval; writes `role.md`, `role-research.md`, `recurring.md`
3. `donna:begin-the-day` — morning ritual; reads all standing files + yesterday's journal; creates today's daily file with carry-forward, due recurring tasks, and optional external data
4. `donna:add-task` — single-argument quick capture; appends to today's daily file (creates it if absent)
5. `donna:log-meeting` — post-meeting capture; writes to today's daily file and updates `people.md`
6. `donna:next` — AI triage; reads today's file + standing files; recommends next action with rationale

**Key patterns:** Config guard on every skill (fail early if `donna:setup` not run), append-only daily files (prevent data loss from concurrent writes), standing file merge (never overwrite `people.md` or `recurring.md` from scratch), Read-Transform-Write-Commit lifecycle on every invocation.

### Critical Pitfalls

1. **Capture friction kills adoption** — `donna:add-task` must accept a single freeform string with no required follow-up prompts. If it asks questions, users abandon it within a week. All metadata is optional and inferred.

2. **Morning routine as wall of text** — `donna:begin-the-day` output must be capped at ~40 lines by default with clear visual hierarchy. Information overload causes users to stop invoking the skill. Design the output format before the logic.

3. **Markdown state drift and corruption** — Two skills can write to the same daily file. Enforce append-only writes, read-before-write, and idempotent operations. The daily file is the most critical artifact; losing tasks is unforgivable for a "never forget" tool.

4. **Context window exhaustion over time** — After 60+ daily files, skills that naively read all history will fail silently on truncated files. Design time-windowed reads (yesterday only for `begin-the-day`) and bounded standing files from day one. Retrofitting is painful.

5. **External CLI integration brittleness** — Always use JSON output flags, implement 10-second timeouts, and distinguish between "no results," "CLI missing," and "authentication expired." Graceful degradation is not optional — test the no-CLI path as the primary path.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation and Capture

**Rationale:** Nothing works without setup, and capture is the first behavior that must become habitual. The state file format and read patterns must be finalized here — format changes later are painful and break existing data. Git commit discipline must also be established early.

**Delivers:** A working daily driver for task capture and persistence. A professional can start capturing tasks immediately after setup.

**Addresses features:** `donna:setup` (persistence), `donna:add-task` (quick capture), task completion (checkbox marking), basic state file format specification

**Avoids pitfalls:**
- Capture friction (single-argument design, works from any directory)
- Markdown format bikeshedding (commit to format once, document it)
- Git commit noise (meaningful message format from day one)
- Context window exhaustion (time-windowed read patterns designed upfront)

**Research flag:** Standard patterns — no additional research needed. Claude Code custom command design is well-understood.

---

### Phase 2: Daily Rhythm and Intelligence

**Rationale:** Once data is flowing in, the daily ritual and AI intelligence layer can be built. This phase adds the features that make the tool more than Taskwarrior: role-awareness, meeting context, and intelligent prioritization. It also introduces the most UX-sensitive skill (`begin-the-day`) and the most technically complex (`donna:set-role` with its research sub-agent).

**Delivers:** A complete daily workflow — morning ritual, role-aware recurring tasks, meeting capture, and AI-powered next-action recommendations.

**Addresses features:** `donna:begin-the-day` (morning ritual, carry-forward, recurring tasks), `donna:set-role` (role definition + research agent), `donna:log-meeting` (meeting capture, people tracking), `donna:next` (AI triage), `people.md` (people-centric views)

**Avoids pitfalls:**
- Morning routine wall of text (strict 40-line output budget, clear hierarchy)
- Second day problem (explicit task states: open/done/deferred/dropped; only open carries forward)
- Role research noise (cap proposals at 5-7, frame as questions, store raw research separately)
- People file deduplication (normalize names on first capture, only add actionable contacts)
- Skill complexity creep (100-line prompt budget, one skill one job)

**Research flag:** The research sub-agent spawning pattern in `donna:set-role` should be verified against current Claude Code Task tool behavior before building. This is the most novel pattern in the project.

---

### Phase 3: External Integrations

**Rationale:** The entire core system should be built and validated without external CLIs. Integrations are enhancement, not foundation. Building them last ensures they are never blocking and always gracefully degradable.

**Delivers:** Richer morning ritual with GitHub PR review requests and Jira assigned issues surfaced automatically. Search across historical daily files.

**Addresses features:** Jira CLI integration, GitHub CLI integration, search across history, optional weekly/monthly review skill

**Avoids pitfalls:**
- External CLI brittleness (JSON output flags, timeouts, clear failure messages, stale data caching)
- Authentication expiry at worst time (cache last-good data in daily file, clear "last fetched" timestamps)

**Research flag:** The Jira CLI ecosystem is fragmented (go-jira vs atlassian-cli vs curl+REST). This phase likely needs targeted research to identify the current standard and its JSON output format before implementation.

---

### Phase Ordering Rationale

- **Setup before everything:** The config guard pattern means no other skill functions without `donna:setup`. It must be first and must be solid.
- **Capture before intelligence:** `donna:next` and `donna:begin-the-day` are only useful if there is data in the system. Users must form the capture habit before the intelligence layer has anything to reason about.
- **Daily rhythm and role setup in parallel:** `donna:add-task` (Phase 1) and `donna:set-role` (Phase 2) are largely independent. `donna:set-role` can be built alongside the daily workflow skills since its output (`recurring.md`) feeds into `donna:begin-the-day` but is not required for it to function.
- **Integrations last:** External CLIs are optional enrichment. Building them last prevents the entire system from being blocked on Jira CLI research and authentication debugging. The core value proposition (capture, triage, daily ritual) must not depend on them.
- **`donna:next` as capstone:** It reads everything — today's file, recurring tasks, role context. It should be built when all data sources exist and are stable. Building it early means rebuilding it as the data model evolves.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (`donna:set-role` sub-agent):** The Task tool spawning pattern for web research agents should be validated against current Claude Code behavior before writing the skill prompt. Spawn pattern, return mechanism, and file writing from sub-agents need confirmation.
- **Phase 3 (Jira CLI):** The Jira CLI ecosystem has no clear winner. Research needed to identify current standard CLI, its `--json` output format, and authentication approach before writing the integration code in `begin-the-day`.

Phases with standard patterns (research-phase not needed):
- **Phase 1 (setup + capture):** Custom slash commands, git commits, and markdown writes are well-documented patterns with direct precedent in the GSD skill suite.
- **Phase 2 (daily workflow, `donna:next`):** Reading markdown files, appending tasks, morning ritual output formatting — standard Claude Code skill patterns.
- **Phase 3 (GitHub CLI):** `gh` CLI is well-documented with stable JSON output. The integration pattern is straightforward.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Claude Code custom commands and git-backed markdown are the correct and only platform choice. No runtime dependencies, no alternatives worth considering. |
| Features | MEDIUM | Based on training data knowledge of Things 3, OmniFocus, Todoist, Taskwarrior, and Bullet Journal. Feature analysis is conservative and unlikely to have changed significantly, but not verified against 2026 versions. |
| Architecture | MEDIUM | Skill-per-command pattern with shared file state is directly modeled on GSD suite. Sub-agent Task tool behavior is based on training data — needs validation for the `donna:set-role` pattern specifically. |
| Pitfalls | MEDIUM | Consistent with well-documented failure modes in productivity tooling and flat-file state management. Not web-verified but patterns are stable and well-established. |

**Overall confidence:** MEDIUM

### Gaps to Address

- **Task tool / sub-agent behavior:** The `donna:set-role` research agent depends on spawning a sub-agent that writes to a specific file. The exact mechanism for passing file paths, the agent's tool access, and whether the parent skill can detect completion need to be validated before writing the skill. Test a simple sub-agent pattern first.
- **Jira CLI ecosystem:** Which CLI (go-jira, jira-cli, atlassian-cli, or raw `curl`) is current standard in 2026 is unknown. This should be researched at the start of Phase 3 planning, not assumed.
- **Config file location:** ARCHITECTURE.md recommends `~/.config/donna/config.md` as the bootstrap pointer. This should be decided and documented in Phase 1 — if it changes later, all skills need updating.
- **Recurring task complexity threshold:** FEATURES.md recommends starting with daily/weekly/monthly and adding complexity only if users request it. The Phase 2 implementation should explicitly leave this door open (simple storage format that can be extended) without building the complex case.

## Sources

### Primary (HIGH confidence)
- Claude Code documentation on custom slash commands (training data) — command file format, `$ARGUMENTS` handling, user-level vs project-level commands
- GSD (get-shit-done) skill suite — reference implementation for skill structure, commit patterns, sub-agent spawning, config guard pattern

### Secondary (MEDIUM confidence)
- Things 3, OmniFocus, Todoist, Taskwarrior, Obsidian, Roam Research, Bullet Journal methodology — feature landscape and competitive analysis
- Claude Code Agent/Task tool spawning patterns (training data) — sub-agent design for `donna:set-role`
- Git-backed personal knowledge management failure modes (Obsidian vaults, wiki.js) — pitfall patterns

### Tertiary (LOW confidence)
- Jira CLI ecosystem (`go-jira`, `jira-cli`, `atlassian-cli`) — fragmented, needs validation before Phase 3 implementation

---
*Research completed: 2026-03-13*
*Ready for roadmap: yes*
