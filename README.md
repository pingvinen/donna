# Donna

Your personal, digital version of Harvey Specter's amazing secretary.

Donna is an AI-powered personal assistant that manages the work that falls through the cracks — the 1:1 follow-ups, recurring process tasks, stakeholder requests, and self-initiated work that never makes it into Jira or Linear.

She lives inside your terminal. She knows your role, surfaces what needs attention each day, pulls data from your CLI tools, and captures tasks in seconds — all backed by plain markdown and git.

Donna is designed to be AI-agnostic, but currently only tested with [Claude Code](https://docs.anthropic.com/en/docs/claude-code). She works from any session, in any project — your tasks follow you wherever you work.

## Install

```bash
npx @pingvinen/donna-assistant
```

The installer copies skill files into `~/.claude/commands/donna/` and shared runtime into `~/.donna/`. Run it again to upgrade.

**Requirements:** Node.js 18+, an AI coding assistant (tested with Claude Code)

## Setup

```
/donna:setup
```

Donna will ask you for a **storage repo** — a git repository (local or remote) where all your tasks and daily files live. Everything is plain markdown, committed to git automatically. If you use [Obsidian](https://obsidian.md), you can open this repo as a vault for a free UI.

Then define your role so Donna can suggest recurring tasks relevant to your job:

```
/donna:set-role
```

## Daily workflow

### Start the day

```
/donna:begin-the-day
```

This is your morning ritual. Donna will:

- **Carry forward** open tasks from your last working day (handles weekends)
- **Surface recurring tasks** that are due today based on your role
- **Pull fresh data** from configured tools (GitHub PRs, Jira tickets, etc.)
- **Deduplicate** across all sources and give you a brief

### Capture tasks throughout the day

```
/donna:add-task Review Sarah's design doc before Thursday
```

One command, zero prompts, committed to git in seconds. Can also be called without arguments for a more conversational capture.

### Mark tasks done

```
/donna:done design doc
```

Fuzzy-matches by name. Run without arguments to pick from a list.

### Refresh tool data mid-day

```
/donna:run-tools
```

Re-pulls data from all configured tools. New items appear, resolved items get closed automatically. Your manually-marked tasks always win.

## External tools

Donna can pull tasks and status from external tools you already use. She supports four tool types:

- **CLI tools** — shell commands like `gh`, `jira`, `kubectl`
- **REST APIs** — HTTP endpoints like GitHub API, Slack API
- **GraphQL APIs** — GraphQL endpoints like Linear, GitHub GraphQL
- **MCP servers** — Claude Code MCP tools like linear, postgres

Register a tool with:

```
/donna:add-tool gh
```

Or call it without arguments — Donna will check your role and suggest tools typically associated with your job.

For CLI tools, Donna verifies installation and authentication, learns capabilities, and asks what scope to query. For REST and GraphQL APIs, Donna sets up secure secret management (via a gitignored `secrets.md` file) and validates API connectivity. MCP servers are configured through Claude Code settings.

When multiple tools are registered, Donna runs them in parallel — one agent per tool — so your morning brief stays fast regardless of how many tools you have.

Edit a tool's configuration (scope, capabilities, auth, command) at any time:

```
/donna:adjust-tool
```

If a CLI tool version is newer than what the AI model knows, Donna will re-learn its capabilities:

```
/donna:relearn-tools
```

## How state is stored

```
<your-storage-repo>/
  donna/
    role.md          # your job role definition
    recurring.md     # recurring task schedule
    tools.md         # registered tool configurations
  daily/
    2026-03-16.md    # today's tasks, tool data, notes
    2026-03-15.md
    ...
```

Every change is committed to git. Files are plain markdown with YAML frontmatter — human-readable, hand-editable, and version-controlled.

The storage repo is yours. Donna only writes to the `donna/` and `daily/` directories, so you're free to keep any other notes, files, or folder structures alongside it — great if you're already using the repo as an Obsidian vault or similar.

## Idempotent by design

Most commands are safe to run again. Want to update your role? Run `/donna:set-role` again. Added a new tool mid-day? Run `/donna:begin-the-day` again to pull its data in. Re-running a command updates state rather than duplicating it.

## Why not automate tool pulls?

Donna intentionally does not support automated periodic invocations of `/donna:run-tools` (e.g., via cron or background timers). Each tool pull runs inside an AI coding assistant session, which means:

- **Cost** -- every invocation consumes API tokens. A cron job running hourly would burn tokens even when you are not working.
- **Context** -- tool data is most useful when you are actively looking at it. Pulling data while you are away produces stale results by the time you return.
- **Conflicts** -- background runs could write to your daily file while you are editing it, causing git merge conflicts in your storage repo.

Instead, run `/donna:run-tools` on demand when you want fresh data, or let `/donna:begin-the-day` handle it as part of your morning routine.

## All commands

### Setup and configuration

| Command | What it does |
|---------|-------------|
| `/donna:setup` | First-time configuration (storage repo, directories) |
| `/donna:set-role` | Define your job role, get recurring task suggestions |

### Daily workflow

| Command | What it does |
|---------|-------------|
| `/donna:begin-the-day` | Morning brief with carry-forward, recurring tasks, tool data |
| `/donna:add-task` | Capture a task instantly |
| `/donna:done` | Mark a task complete |
| `/donna:focus` | Distill today's tasks into a short prioritized focus list |

### Tool management

| Command | What it does |
|---------|-------------|
| `/donna:add-tool` | Register an external tool (CLI, REST API, GraphQL API, MCP server) |
| `/donna:adjust-tool` | Edit a tool's configuration (scope, capabilities, auth, command) |
| `/donna:remove-tool` | Remove a registered tool from tools.md |
| `/donna:run-tools` | Refresh tool data mid-day |
| `/donna:relearn-tools` | Update CLI tool knowledge after upgrades |

### Help and feedback

| Command | What it does |
|---------|-------------|
| `/donna:help` | Conversational troubleshooting for config, storage, or skill issues |
| `/donna:contribute-idea` | Submit a feature idea or bug report via GitHub Issues |

## License

MIT
