# Feature Landscape

**Domain:** Personal productivity / personal assistant tooling for professionals (CLI-based)
**Researched:** 2026-03-13
**Confidence:** MEDIUM (based on training data knowledge of Obsidian, Things 3, OmniFocus, Notion, Roam, Todoist, Taskwarrior, and broader ecosystem; no live web verification available)

## Table Stakes

Features users expect from any personal task/productivity system. Missing any of these and the tool feels broken or incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Quick task capture | Every tool from Things 3's Quick Entry to OmniFocus's Inbox does this. Users abandon tools where capture has friction. | Low | Must be faster than opening a note app. Single command, minimal prompts. The `/pa:add-task` skill covers this. |
| Task completion/checking off | Fundamental feedback loop. Todoist, Things 3, and every task app make this satisfying. | Low | Mark done, move to completed section in daily file. |
| Daily view / "today" list | Things 3's "Today" view, OmniFocus's Forecast, Todoist's "Today" -- users need to see what's on their plate right now. | Medium | The `/pa:begin-the-day` skill covers this. Must aggregate: carried-forward tasks + recurring tasks due + manually scheduled items. |
| Carry-forward of incomplete tasks | Every serious tool handles this. If yesterday's undone tasks vanish, trust is destroyed. OmniFocus and Things 3 keep deferred items visible; Bullet Journal's "migration" ritual does this manually. | Medium | Must be automatic in `begin-the-day`. Show what carried forward so user stays aware. |
| Recurring tasks | OmniFocus has the most sophisticated recurrence engine (defer dates, repeat-after-completion vs repeat-on-schedule). Things 3 handles basics well. Todoist supports natural language recurrence. | Medium | Interval definitions stored in `recurring.md`. Surface in `begin-the-day`. Support at minimum: daily, weekly-on-day, monthly, and interval-from-completion. |
| Persistence across sessions | Every tool saves state. For a CLI tool, this is extra critical since there's no always-running process. | Low | Git-backed markdown files handle this. Already in the design. |
| Search / find tasks | Users need to locate things they captured days or weeks ago. Obsidian's search, Notion's search, Things 3's filtering. | Medium | Search across daily files and standing files. Grep over markdown is natural for CLI users. |
| Basic prioritization | Even simple priority (high/medium/low or 1-4 scale like OmniFocus) is expected. Without it, the "today" list is a flat wall of text. | Low | Priority flag on tasks. Used by `/pa:next` for triage ordering. |
| Context / tagging | GTD contexts (OmniFocus), tags (Things 3, Todoist), or any way to slice tasks by dimension (person, project, energy level). | Low | Lightweight tags in task markdown. Don't over-engineer -- simple `#tag` inline syntax. |

## Differentiators

Features that set this CLI assistant apart. Not expected in every tool, but uniquely valuable here.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Role-aware recurring task suggestions | No existing tool does this. OmniFocus/Things make you define your own recurring tasks from scratch. This system researches your job role and proposes recurring responsibilities you might forget. | High | The `/pa:set-role` web research agent pattern. Major differentiator -- turns "blank canvas" into a pre-populated system. |
| AI-powered triage / "what next" | Things 3 and OmniFocus show you your list and let you decide. Todoist has basic "priority + due date" sorting. This system can reason about urgency, role importance, time-of-day, and accumulated context. | High | The `/pa:next` skill. Goes beyond sorting -- it recommends with rationale. |
| Meeting follow-up capture with people tracking | Most task tools treat tasks as isolated. This system captures who said what, links follow-ups to people, and can surface "you owe X a response" patterns. | Medium | The `/pa:log-meeting` skill + `people.md` standing file. Notion databases can do this but require manual setup; this is built-in. |
| Git-backed version history | No productivity app gives you `git log` on your task history. Full audit trail, branch/merge for experiments, works offline. | Low | Already designed in. Developers especially appreciate this. |
| CLI-native workflow (no context switching) | Professionals who live in the terminal (engineers, devops, SREs) lose flow switching to a GUI app. This stays in the terminal. | Low | The entire design thesis. Taskwarrior proves there's demand but it lacks AI reasoning. |
| Morning ritual as a first-class concept | Bullet Journal's morning migration ritual is powerful but manual. Most apps just show "overdue." This system has an explicit `begin-the-day` ceremony that carries forward, surfaces recurring work, and optionally pulls from external tools. | Medium | The ceremony aspect matters -- it's a moment of intention-setting, not just a list dump. |
| Complementary to Jira (not competitive) | Tools like Notion try to replace your ticketing system. This explicitly does not -- it handles the 60% of professional obligations that never make it into Jira. | Low | Architectural decision, not a feature per se, but a key positioning differentiator. |
| People-centric task views | OmniFocus has "contexts" but people-tracking is manual. This system can answer "what do I owe Sarah?" or "what did I commit to in my 1:1 with Mike?" | Medium | Requires `people.md` + linking tasks to people. Natural extension of meeting capture. |
| Graceful degradation of integrations | Most tools either require integrations or don't have them. This works standalone but gets richer with Jira CLI / `gh`. | Low | Already designed. Important for adoption -- zero-config start, grow into integrations. |

## Anti-Features

Features to explicitly NOT build. These are tempting but wrong for this tool.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Full project management (Gantt, dependencies, sprints) | That's Jira/Linear/Asana territory. Scope creep kills CLI tools. OmniFocus's project nesting is its worst feature for most users. | Keep tasks flat or minimally nested. Projects are tags, not hierarchies. |
| Rich text editing / WYSIWYG | CLI tool. Markdown is the format. Trying to compete with Notion's editor is suicide. | Plain markdown, rendered by whatever the user's preferred viewer is. |
| Push notifications / reminders | The PROJECT.md explicitly says pull model. Building a daemon or notification system is massive scope for marginal value. | The morning ritual (`begin-the-day`) and on-demand triage (`next`) are the "notification" system. |
| Calendar integration / scheduling | Google Calendar API integration is a maintenance nightmare and scope explosion. Things 3 and Fantastical do this well already. | Reference times in tasks ("before 2pm standup") but don't try to own the calendar. |
| Time tracking | Toggl, Clockify, and Harvest own this. Adding timers to a CLI assistant muddies the value prop. | If users want this, they pair it with a dedicated time tracker. |
| Kanban boards / visual workflows | Requires a UI. CLI tools that try to do TUI boards (like taskell) are novelties, not daily drivers. | Status is implicit: tasks are in today's file (active), completed, or carried forward. |
| Multi-user collaboration | Sharing a git repo is possible but building collaboration features (assignments, comments, @mentions) is a different product. | Single-user tool. If a team wants shared visibility, they share the repo -- but the tool doesn't manage permissions or notifications. |
| Natural language date parsing | Todoist does "every second Tuesday" well because they've invested years in NLP. Reimplementing this is a trap -- it's deceptively hard to get right. | Use explicit, structured recurrence definitions (e.g., `interval: weekly`, `day: monday`). Clear beats clever. |
| Habit tracking | Habitica, Streaks, and dozens of apps do this. Recurring tasks overlap slightly, but dedicated habit tracking (streaks, statistics, gamification) is scope creep. | Recurring tasks cover the "do X every Monday" case. Don't add streak counters or habit analytics. |
| Offline-first sync / conflict resolution | Git handles this adequately. Building a custom CRDT or sync engine for markdown files is massive over-engineering. | Git push/pull is the sync mechanism. Conflicts are handled by git's merge. |

## Feature Dependencies

```
config.md (pa:setup) --> everything else (all skills need config)
    |
    v
role.md (pa:set-role) --> recurring.md (role research proposes recurring tasks)
    |                          |
    v                          v
people.md (populated by pa:log-meeting) --> pa:next (people context for triage)
    |                          |
    v                          v
daily/YYYY-MM-DD.md (pa:begin-the-day) --> pa:next (today's tasks are input)
    ^                          ^
    |                          |
pa:add-task (writes to today)  recurring engine (surfaces due tasks)
    ^
    |
pa:log-meeting (creates follow-up tasks)
```

**Critical path:** `pa:setup` --> `pa:set-role` --> `pa:begin-the-day` --> `pa:add-task` / `pa:log-meeting` --> `pa:next`

**Independent of role:** `pa:add-task` can work immediately after `pa:setup`. Users don't need to set a role to start capturing tasks. This is important for onboarding -- don't gate basic value behind a long setup.

## MVP Recommendation

### Phase 1: Capture and Daily Rhythm (minimum viable daily driver)

Prioritize:
1. **pa:setup** -- config, link repo, minimal setup (table stakes: persistence)
2. **pa:add-task** -- quick capture with priority and optional tags (table stakes: capture)
3. **pa:begin-the-day** -- morning ritual with carry-forward (table stakes: daily view, carry-forward)
4. **Task completion** -- mark tasks done within daily file (table stakes: completion)
5. **Basic recurring tasks** -- manual definition, surfaced in begin-the-day (table stakes: recurrence)

This phase makes the tool usable as a daily driver. A professional can capture tasks, see their day, complete work, and have nothing fall through the cracks.

### Phase 2: Intelligence and Context

6. **pa:set-role** -- role definition + research agent for recurring task suggestions (differentiator: role-awareness)
7. **pa:log-meeting** -- meeting capture with people and follow-ups (differentiator: people tracking)
8. **pa:next** -- AI triage with priority, context, and role awareness (differentiator: intelligent triage)
9. **people.md** -- people-centric task views (differentiator: relationship tracking)

This phase adds the AI intelligence layer that makes the tool more than "Taskwarrior with markdown."

### Phase 3: Integration and Polish

10. **Jira CLI integration** -- pull assigned issues into daily view (table stakes for teams using Jira)
11. **GitHub CLI integration** -- pull PRs, issues, review requests (table stakes for developers)
12. **Search across history** -- find tasks from past daily files (table stakes: search)
13. **Weekly/monthly review skill** -- summarize accomplishments, surface patterns (differentiator: reflection)

Defer entirely:
- **Calendar integration**: too much scope, marginal value for CLI users
- **Natural language dates**: use structured recurrence instead
- **Multi-user features**: single-user tool, git handles sharing

## Competitive Analysis: What to Emulate

### From Things 3
- **Quick Entry speed**: capture must be under 5 seconds from invocation to committed task
- **"Today" as the primary view**: not "all tasks" -- today's tasks, prominently
- **Clean completion**: satisfying feedback when marking done

### From OmniFocus
- **Review ritual**: periodic review of all commitments is built into the methodology
- **Perspectives (filtered views)**: ability to slice tasks by person, tag, or project
- **Repeat-after-completion**: some recurrences should reset from completion date, not calendar date

### From Obsidian / Roam
- **Daily notes as the spine**: the daily file is the primary capture surface, everything links back to it
- **Backlinks / cross-references**: when you mention a person in a task, that should be findable from the person's context
- **Plain text / markdown as the format**: no proprietary lock-in

### From Todoist
- **Frictionless capture**: minimum viable fields to create a task (just the description)
- **Smart defaults**: if you capture at 9am, it's a "today" task unless you say otherwise

### From Taskwarrior (CLI predecessor)
- **CLI-native speed**: `task add` is fast because it's one command, no menus
- **Filtering power**: `task project:work +urgent` style filtering is powerful for power users
- **What NOT to emulate**: Taskwarrior's learning curve is brutal. UDA configuration, custom reports, and the sheer number of subcommands overwhelm new users. Keep it simple.

### From Bullet Journal (analog method)
- **Morning migration ritual**: the intentional act of reviewing yesterday and planning today
- **Rapid logging**: minimal notation for capture speed
- **Monthly review**: stepping back to see patterns

## Sources

- Training data knowledge of Things 3, OmniFocus 3/4, Todoist, Obsidian, Notion, Roam Research, Taskwarrior, and Bullet Journal methodology
- Confidence: MEDIUM -- based on extensive training data but not verified against current (2026) versions of these tools
- The competitive landscape for task management is mature and stable; core features have not changed significantly in recent years, so training data is likely still accurate for feature analysis
