# Donna

## What This Is

A suite of Claude Code skills that act as a personal assistant for professionals. Donna is role-aware (job role and recurring responsibilities configured via interactive setup), stores all state in markdown files in a user-chosen GitHub repository, and helps users stay on top of tasks that fall outside of Jira — 1:1 follow-ups, stakeholder asks, async nudges, and self-initiated work that would otherwise be forgotten. It includes 8 skills covering setup, task capture, role definition, daily planning, and external tool integration, distributed as an npm package with a full CI/CD pipeline.

## Core Value

Never forget an important task again — the assistant knows your role, surfaces what needs attention each day, and captures everything that falls through the cracks outside your ticketing system.

## Requirements

### Validated

- ✓ npm package with installer (`npx @pingvinen/donna-assistant`) — v1.0
- ✓ Version tracking and cumulative migration system — v1.0
- ✓ `/donna:setup` skill — interactive config, storage repo init, bootstrap config — v1.0
- ✓ `/donna:set-role` skill — role definition with web research agent, recurring task suggestions, tool suggestions — v1.0
- ✓ `/donna:add-tool` skill — declare CLI tools, auto-learn capabilities, store in tools.md — v1.0
- ✓ `/donna:begin-the-day` skill — carry-forward, recurring tasks, external tool data, idempotent — v1.0
- ✓ `/donna:add-task` skill — quick task capture with git commit — v1.0
- ✓ `/donna:done` skill — mark tasks complete with fuzzy matching — v1.0
- ✓ `/donna:relearn-tools` skill — version-aware tool re-learning — v1.0
- ✓ `/donna:refresh-tools` skill — pull fresh data from configured tools — v1.0
- ✓ Recurring task engine surfaced by begin-the-day — v1.0
- ✓ Hybrid storage (daily journals + standing files in donna/ subfolder) — v1.0
- ✓ Git-backed persistence — every skill commits after writing — v1.0
- ✓ User-declared tools with auto-learning (no hardcoded integrations) — v1.0
- ✓ CI/CD pipeline — PR validation, release creation, npm publish with OIDC provenance — v1.0
- ✓ Standing files subfolder with seamless migration for existing users — v1.0
- ✓ Multi-type tool system — REST API, GraphQL API, MCP server support alongside CLI tools — Phase 02
- ✓ Parallel tool execution in begin-the-day and run-tools — Phase 02
- ✓ Tool type field with heuristic backfill migration — Phase 02
- ✓ `/donna:adjust-tool` skill — edit tool config (scope, capabilities, auth, command, type) — Phase 02
- ✓ Secrets management via secrets.md for API auth — Phase 02
- ✓ GraphQL schema introspection in relearn-tools — Phase 02
- ✓ Capability format repair on type change in adjust-tool — Phase 02

### Active

- [ ] `/donna:log-meeting` — capture meeting participants, decisions, and follow-ups
- [ ] `/donna:next` — AI-reasoned recommendation of what to work on now
- [ ] `/donna:end-the-day` — close out the day, mark remaining tasks as carried forward
- [ ] Advanced recurring tasks with named intervals and completion tracking
- [ ] People tracking (`people.md`) for 1:1 follow-up management

### Out of Scope

- Hardcoded job roles — the role is always user-defined, never assumed
- Real-time notifications — this is a pull model (user invokes skills), not push
- A UI or web interface — Claude Code terminal only (Obsidian provides free UI for storage repo)
- Replacing Jira — this complements ticketing systems, doesn't compete with them
- Natural language date parsing — explicit intervals are simpler and more reliable

## Context

Shipped v1.0 with ~4,278 LOC across 46 files (TypeScript/CJS + workflow markdown).
Tech stack: Node.js CJS modules, GitHub Actions CI/CD, OIDC npm publishing.
9 skills: setup, set-role, add-task, done, begin-the-day, add-tool, adjust-tool, relearn-tools, refresh-tools.
Storage: hybrid daily journals + standing files in user's git repo.
Distribution: `npx @pingvinen/donna-assistant` with cumulative migration system.
Alpha testers using the package. Developed on personal machine, deployed to work laptop.

## Constraints

- **Platform**: AI coding assistant skills — must work as slash commands, provider-agnostic where possible
- **Storage**: Markdown files in git — no databases, no external services beyond what the user already has
- **Dependencies**: No required external tools — user declares tools via `/donna:add-tool`, all are optional
- **Style**: Follow GSD's aesthetic and structural patterns — banners, AskUserQuestion for interactive flows, agent spawning indicators, committed state at each step
- **Obsidian compatibility**: All files must be plain markdown with YAML frontmatter in standard folders — users can open as Obsidian vaults for free UI
- **SSH signing**: Git commits/pushes trigger 1Password unlock — must run in main context, never from subagents
- **Token resilience**: Stage changes early and often; commit at natural checkpoints, not only at the end

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|----------|
| Skill prefix `donna:` | Namespaced like GSD's `gsd:` to avoid collisions and signal the suite | ✓ Good |
| Hybrid storage (daily + standing files) | Daily files capture the running log; standing files capture durable context | ✓ Good |
| Role research via web agent | Research grounds recurring task suggestions in reality | ✓ Good |
| User-declared tools, not hardcoded integrations | Keeps the system generic and extensible | ✓ Good |
| Parallel tool agents in begin-the-day | Each tool gets its own agent — isolates tool logic and scales naturally | ✓ Good |
| XML tags for skill prompt structure | Claude treats these as clear semantic boundaries | ✓ Good |
| Stub-workflow split | Write logic once, install for multiple providers | ✓ Good |
| Provider-agnostic design | Installer copies stubs to provider-specific directories | ✓ Good |
| Shared runtime at ~/.donna/ | Workflows/templates live in provider-agnostic location | ✓ Good |
| Distribution-first development | Build packaging/CI/CD first, then real features | ✓ Good — caught CI issues early |
| Migration from any version | Users may skip intermediate updates | ✓ Good |
| donna:setup as hello-world | Real skill with stub proves pipeline, not throwaway | ✓ Good |
| No git operations from subagents | SSH signing requires interactive unlock | ✓ Good — enforced by design |
| Stage early, commit at checkpoints | Token exhaustion protection | ✓ Good |
| Standing files in donna/ subfolder | User owns repo root for their own notes | ✓ Good — clean separation |
| Carry-forward counter pattern | "(N times)" suffix tracks how long tasks have been open | ✓ Good — visible urgency signal |
| Tool-tagged tasks preserve suffix | `[tool](url)` kept on completed tasks for traceability | ✓ Good |

---
*Last updated: 2026-03-20 after Phase 02 tool-system-enhancements*
