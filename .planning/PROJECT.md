# Donna

## What This Is

A suite of Claude Code skills that act as a personal assistant for professionals. The system is role-aware (job role and recurring responsibilities configured via a setup skill), stores all state in markdown files in a user-chosen GitHub repository, and helps the user stay on top of tasks that fall outside of Jira — 1:1 follow-ups, stakeholder asks, async nudges, and self-initiated work that would otherwise be forgotten.

## Core Value

Never forget an important task again — the assistant knows your role, surfaces what needs attention each day, and captures everything that falls through the cracks outside your ticketing system.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] `/donna:setup` skill — first-time configuration: link git repo
- [ ] `/donna:set-role` skill — define job role, trigger research agent to surface typical responsibilities and commonly used tools, propose recurring tasks and tools for approval, store research as reference
- [ ] `/donna:add-tool` skill — declare available tools by name; Claude learns the tool (reads help output or uses training data) and stores knowledge in `tools.md`
- [ ] `/donna:begin-the-day` skill — morning routine: carry forward unfinished tasks from yesterday, surface recurring tasks due today, spawn parallel agents to pull data from each configured tool
- [ ] `/donna:add-task` skill — quickly capture a task, follow-up, or note
- [ ] `/donna:log-meeting` skill — post-meeting capture: who was there, decisions made, follow-ups committed to
- [ ] `/donna:next` skill — on-demand triage: given everything in the system, what should I do right now?
- [ ] Recurring task engine — tasks with interval definitions (e.g. "refine backlog every Monday"), surfaced by `begin-the-day`
- [ ] Hybrid storage structure — daily journal files (`daily/YYYY-MM-DD.md`) + standing files (`role.md`, `role-research.md`, `recurring.md`, `tools.md`, `people.md`, `config.md`)
- [ ] Git-backed persistence — all state committed to user's chosen GitHub repo after each skill run
- [ ] User-declared tools — user tells Donna which CLI tools are available; Donna learns them and invokes them as needed (no hardcoded integrations)

### Out of Scope

- Hardcoded job roles — the role is always user-defined, never assumed
- Real-time notifications — this is a pull model (user invokes skills), not push
- A UI or web interface — Claude Code terminal only
- Replacing Jira — this complements ticketing systems, doesn't compete with them

## Context

- Directly inspired by the get-shit-done (GSD) Claude Code skill suite — same philosophy: slash commands that do one thing well, stored state that survives context resets, research agents, structured markdown output
- Target user is a professional whose job generates many obligations outside of formal task tracking (1:1 follow-ups, stakeholder requests, recurring process work)
- Storage is a git repo of the user's choice — could be private, could be shared — giving durability and version history
- The role research pattern mirrors GSD's project researcher: spawn an agent, search the web for "what does a [role] actually do day-to-day?", synthesize findings, propose recurring tasks, store research for reference

## Constraints

- **Platform**: Claude Code skills only — must work as slash commands in the CLI
- **Storage**: Markdown files in git — no databases, no external services beyond what the user already has
- **Dependencies**: No required external tools — user declares tools via `/donna:add-tool`, all are optional
- **Style**: Follow GSD's aesthetic and structural patterns — banners, AskUserQuestion for interactive flows, agent spawning indicators, committed state at each step

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|----------|
| Skill prefix `donna:` | Namespaced like GSD's `gsd:` to avoid collisions and signal the suite | — Pending |
| Hybrid storage (daily + standing files) | Daily files capture the running log; standing files capture durable context (role, recurring tasks, people) | — Pending |
| Role research via web agent | User's role drives recurring task suggestions — research grounds them in reality rather than just user assumption | — Pending |
| User-declared tools, not hardcoded integrations | Tools are taught by the user, not baked in — keeps the system generic and extensible | — Pending |
| Parallel tool agents in begin-the-day | Each configured tool gets its own agent during daily brief — isolates tool logic and scales naturally | — Pending |
| XML tags for skill prompt structure | Follow GSD's pattern of using `<purpose>`, `<process>`, `<step>`, `<success_criteria>` etc. — Claude treats these as clear semantic boundaries, better than markdown headers for separating instructions | — Pending |

---
*Last updated: 2026-03-13 after initialization*
