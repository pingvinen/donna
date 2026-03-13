# Feature Landscape

**Domain:** Personal productivity / personal assistant tooling for professionals (CLI-based)
**Researched:** 2026-03-13 (revised)
**Confidence:** MEDIUM (based on training data knowledge of Things 3, OmniFocus, Todoist, Taskwarrior, Obsidian, Bullet Journal, and broader ecosystem)

## Table Stakes

Features users expect from any personal task/productivity system. Missing any of these and the tool feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quick task capture | Every tool from Things 3's Quick Entry to OmniFocus's Inbox does this. Users abandon tools where capture has friction. | Low | **UX contract:** single argument, zero required prompts, under 10 seconds from invocation to git commit. `donna:add-task` must create today's daily file if it doesn't exist — users who skip begin-the-day must not be blocked. |
| Task completion/checking off | Fundamental feedback loop. Todoist, Things 3, and every task app make this satisfying. | Low | Mark done, move to completed section in daily file. |
| Daily view / "today" list | Things 3's "Today" view, OmniFocus's Forecast, Todoist's "Today" — users need to see what's on their plate right now. | Medium | `donna:begin-the-day` covers this. **Output budget: ~40 lines max.** Ordering: carried forward → recurring due → from tools → new space. Bullet Journal's morning migration is the analog precedent — it's an intentional ceremony, not a data dump. |
| Carry-forward of incomplete tasks | Every serious tool handles this. If yesterday's undone tasks vanish, trust is destroyed. | Medium | Must be automatic in begin-the-day. Show what carried forward so user stays aware. Must handle multi-day gaps (weekend, vacation). |
| Recurring tasks | OmniFocus has sophisticated recurrence; Things 3 handles basics; Todoist supports natural language. | Medium | Interval definitions in `recurring.md`. Surface in begin-the-day. Support: daily, weekly-on-day, monthly, interval-from-completion. |
| Persistence across sessions | Every tool saves state. Extra critical for CLI with no always-running process. | Low | Git-backed markdown files. Already designed. |
| Search / find tasks | Users need to locate things captured days or weeks ago. | Medium | Grep across daily and standing files. Natural for CLI users. |
| Basic prioritization | Even simple priority (high/medium/low) is expected. Without it, the today list is a flat wall. | Low | Priority flag on tasks. Used by donna:next for triage ordering. |
| Context / tagging | GTD contexts, tags, or any way to slice by dimension (person, project, energy level). | Low | Lightweight `#tag` inline syntax. Don't over-engineer. |

## Differentiators

Features that set this CLI assistant apart. Not expected in every tool, but uniquely valuable here.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Role-aware recurring task suggestions | **No existing tool does this.** OmniFocus/Things/Todoist all present a blank recurring tasks screen. This system researches your job role and proposes recurring responsibilities you might forget. | High | The donna:set-role web research agent pattern. Competitive gap — turns "blank canvas" into pre-populated system. **Critical: approval gate (propose → user approves → commit) is non-negotiable.** AI-generated tasks without confirmation erode trust. |
| AI-powered triage / "what next" | Things 3 and OmniFocus show your list. Todoist does basic priority + due date sorting. This system reasons about urgency, role importance, and accumulated context. | High | donna:next. Goes beyond sorting — recommends with rationale. **Becomes much more valuable once people.md accumulates context** — can weight tasks by stakeholder importance. |
| Meeting follow-up capture with people tracking | Most task tools treat tasks as isolated. This captures who said what, links follow-ups to people, enables "what do I owe Sarah?" queries. | Medium | donna:log-meeting + `people.md`. The relational dimension is what distinguishes Donna — follow-ups linked to people at capture time. |
| Git-backed version history | No productivity app gives you `git log` on task history. Full audit trail, offline, rollback. | Low | Already designed. Developers especially appreciate this. |
| CLI-native workflow | Professionals in terminal lose flow switching to GUI. This stays in terminal. | Low | The entire design thesis. Taskwarrior proves demand but lacks AI reasoning. |
| Morning ritual as first-class concept | Bullet Journal's migration is powerful but manual. Most apps just show "overdue." Explicit begin-the-day ceremony. | Medium | The ceremony aspect matters — moment of intention-setting, not just a list dump. Running multiple times is safe (idempotent). |
| Complementary to Jira | Tools like Notion try to replace ticketing. This handles the 60% of obligations that never make it into Jira. | Low | Positioning differentiator more than a feature. |
| People-centric task views | OmniFocus has contexts but people-tracking is manual. Answer "what did I commit to in my 1:1 with Mike?" | Medium | Requires people.md + linking tasks to people. Natural extension of meeting capture. |
| Graceful degradation of integrations | Most tools either require integrations or don't have them. This works standalone but gets richer. | Low | **Integrations are enhancement, never foundation.** First begin-the-day must work with zero tools configured. Silent tool failures are an anti-pattern — every skip/failure must be visible in output. |

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong for this tool.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full project management (Gantt, dependencies, sprints) | That's Jira/Linear/Asana territory. Scope creep kills CLI tools. | Keep tasks flat or minimally nested. Projects are tags, not hierarchies. |
| Rich text editing / WYSIWYG | CLI tool. Markdown is the format. | Plain markdown, rendered by user's preferred viewer. |
| Push notifications / reminders | Pull model only. Building a daemon is massive scope for marginal value. | Morning ritual and on-demand triage are the "notification" system. |
| Calendar integration / scheduling | Google Calendar API is a maintenance nightmare and scope explosion. | Reference times in tasks but don't own the calendar. |
| Time tracking | Toggl, Clockify, Harvest own this. Muddies the value prop. | Users pair with a dedicated time tracker if needed. |
| Kanban boards / visual workflows | Requires a UI. CLI TUI boards are novelties, not daily drivers. | Status is implicit: tasks in today's file, completed, or carried forward. |
| AI-generated task content without approval | Research agent may propose recurring tasks, but unsolicited task creation destroys trust. | **Always require user confirmation** before saving AI-suggested tasks. The approval gate is non-negotiable. |
| Habit tracking with streaks | Adjacent but different product category. Dilutes professional task management focus. | Recurring tasks cover "do X every Monday." Don't add streak counters or gamification. |
| Multi-user collaboration | Assignments, comments, @mentions — that's a different product. | Single-user tool. Git handles sharing story if needed. |
| Natural language date parsing | Deceptively hard to get right. Todoist has invested years in this. | Use explicit, structured recurrence definitions. Clear beats clever. |
| Offline-first sync / conflict resolution | Building custom CRDT for markdown is massive over-engineering. | Git push/pull is the sync mechanism. Git merge handles conflicts. |
| Hardcoded tool integrations | Baking in specific tools limits extensibility and creates maintenance burden. | All integrations go through tools registry (donna:add-tool). User teaches Donna about their tools. |

## Feature Dependencies

```
donna:setup (config.md) ──────────────────────────────> everything else
    │
    ├──> donna:add-task ──> daily/YYYY-MM-DD.md          ← DAY ONE VALUE
    │         │
    │         v
    ├──> donna:begin-the-day ──> daily brief
    │         │        ^
    │         │        │
    │         │    recurring.md
    │         │        ^
    │         │        │
    ├──> donna:set-role ──> role.md + role-research.md    ← PARALLEL (not blocking)
    │
    ├──> donna:log-meeting ──> people.md + follow-up tasks
    │         │
    │         v
    └──> donna:next ──> AI triage (capstone)              ← REQUIRES ACCUMULATED DATA
              ^
              │
         people.md + daily files + recurring.md + tools.md
```

**Critical path:** `setup` → `add-task` (day one value) → `begin-the-day` → `log-meeting` → `next` (capstone requiring accumulated data)

**set-role is parallel** — useful but not blocking. Users don't need to set a role to start capturing tasks. Don't gate basic value behind long setup.

## Feature Prioritization Matrix

| Feature | User Value | Impl Cost | Priority |
|---------|-----------|-----------|----------|
| donna:setup | Foundation | Low | P0 |
| donna:add-task | High (daily use) | Low | P0 |
| Task completion | High (feedback loop) | Low | P0 |
| donna:begin-the-day (basic) | High (daily ritual) | Medium | P0 |
| donna:set-role | Medium (one-time, high impact) | High | P1 |
| Recurring tasks | Medium (daily surfacing) | Medium | P1 |
| donna:begin-the-day (with tools) | Medium (enrichment) | Medium | P2 |
| donna:log-meeting | Medium (meeting-heavy roles) | Medium | P1 |
| donna:next | High (capstone) | High | P2 |
| donna:add-tool | Medium (integration) | Medium | P2 |
| Search across history | Medium (retrieval) | Low | P1 |

## MVP Tiers

### v1: Daily Driver (Phase 1)
1. **donna:setup** — config, link repo, minimal setup
2. **donna:add-task** — quick capture (under 10 seconds to commit)
3. **donna:begin-the-day** — morning ritual with carry-forward
4. **Task completion** — mark tasks done
5. **Basic recurring tasks** — manual definition, surfaced in begin-the-day

This makes the tool usable as a daily driver. Capture, see your day, complete work, nothing falls through cracks.

### v1.x: Intelligence Layer (Phase 2)
6. **donna:set-role** — role definition + research agent
7. **donna:log-meeting** — meeting capture with people tracking
8. **donna:next** — AI triage with context
9. **people.md** — people-centric task views

This adds the AI intelligence that makes it more than "Taskwarrior with markdown."

### v2+: Integration and Depth (Phase 3)
10. **donna:add-tool** — declare external CLI tools
11. **Tool enrichment in begin-the-day** — pull Jira/GitHub/etc. data
12. **donna:relearn-tools** — keep tool knowledge current
13. **Search across history** — find tasks from past daily files

## Competitive Analysis: What to Emulate

### From Things 3
- **Quick Entry speed**: capture must be under 5 seconds from invocation to committed task
- **"Today" as primary view**: not "all tasks" — today's tasks, prominently
- **Clean completion**: satisfying feedback when marking done

### From OmniFocus
- **Review ritual**: periodic review of all commitments is built in
- **Perspectives (filtered views)**: slice tasks by person, tag, or project
- **Repeat-after-completion**: some recurrences reset from completion date, not calendar date

### From Obsidian / Roam
- **Daily notes as spine**: daily file is primary capture surface, everything links back
- **Cross-references**: mention a person in a task → findable from person's context
- **Plain text / markdown**: no proprietary lock-in

### From Todoist
- **Frictionless capture**: minimum viable fields (just the description)
- **Smart defaults**: capture at 9am = "today" task unless specified otherwise

### From Taskwarrior
- **CLI-native speed**: `task add` is one command, no menus
- **Filtering power**: `task project:work +urgent` style filtering
- **What NOT to emulate**: brutal learning curve, UDA configuration, overwhelming subcommands

### From Bullet Journal
- **Morning migration ritual**: intentional review of yesterday → plan today
- **Rapid logging**: minimal notation for capture speed
- **Monthly review**: stepping back to see patterns

## Sources

- Training data knowledge of Things 3, OmniFocus 3/4, Todoist, Obsidian, Notion, Roam Research, Taskwarrior, and Bullet Journal methodology
- Confidence: MEDIUM — mature, stable competitive landscape; core features haven't changed significantly
