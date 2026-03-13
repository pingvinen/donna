# Architecture Patterns

**Domain:** AI coding assistant personal productivity skill suite (provider-agnostic)
**Researched:** 2026-03-13 (revised)

## Recommended Architecture

The system follows a **stub-workflow split architecture** where thin provider-specific stubs delegate to shared workflow files. Skills are stateless between invocations — all persistence lives in markdown files in a user-chosen git repository.

### High-Level Structure

```
Source repository (npm package)
  |
  +-- stubs/
  |    +-- claude-code/donna/        <-- Claude Code stubs
  |    +-- opencode/donna/           <-- OpenCode stubs
  |    +-- gemini/donna/             <-- Gemini stubs (future)
  |    +-- codex/donna/              <-- Codex stubs (future)
  +-- workflows/                     <-- Actual skill logic (XML-tagged)
  +-- templates/                     <-- File format templates
  +-- references/                    <-- Shared knowledge docs
  +-- bin/install.js                 <-- Installer script

User's machine (after install)
  |
  +-- ~/.donna/                              <-- Shared runtime (provider-agnostic)
  |    +-- workflows/
  |    |    +-- setup.md
  |    |    +-- set-role.md
  |    |    +-- begin-the-day.md
  |    |    +-- add-task.md
  |    |    +-- add-tool.md
  |    |    +-- log-meeting.md
  |    |    +-- next.md
  |    +-- templates/
  |    |    +-- daily.md
  |    |    +-- tools-entry.md
  |    |    +-- role.md
  |    +-- references/
  |    |    +-- journal-conventions.md
  |    |    +-- tool-learning.md
  |    +-- version.md                        <-- Installed version (for updates)
  |
  +-- ~/.claude/commands/donna/              <-- Claude Code stubs
  |    +-- setup.md
  |    +-- begin-the-day.md
  |    +-- add-task.md
  |    +-- ...
  |
  +-- ~/.config/opencode/commands/donna/     <-- OpenCode stubs (if installed)
  |    +-- ...
  |
  +-- ~/.config/donna/
  |    +-- config.md                         <-- Bootstrap config → state repo path
  |
  +-- [user-chosen-repo]/                    <-- State repository
       +-- config.md                         <-- Preferences
       +-- role.md                           <-- Job role definition
       +-- role-research.md                  <-- Research agent output
       +-- recurring.md                      <-- Recurring task definitions
       +-- tools.md                          <-- Learned tool knowledge
       +-- people.md                         <-- People/relationship context
       +-- daily/
       |    +-- 2026-03-13.md
       |    +-- 2026-03-12.md
       +-- archive/                          <-- Completed/old items (optional)
```

## Multi-Provider Support

Donna is provider-agnostic. The installer detects which providers are available and copies stubs to appropriate directories. The runtime (`~/.donna/`) and state repo are shared across providers.

| Provider | Stub Location | Stub Format | Confidence |
|----------|--------------|-------------|------------|
| Claude Code | `~/.claude/commands/donna/` | YAML frontmatter + `@` reference | HIGH (verified against GSD) |
| OpenCode | `~/.config/opencode/commands/donna/` | TBD (similar frontmatter expected) | LOW (unverified) |
| Gemini | `~/.gemini/commands/donna/` | TBD | LOW (unverified) |
| Codex | TBD | TBD | LOW (unverified) |

**Strategy:** Build and validate Claude Code first. The stub-workflow split makes adding providers mechanical — write new stubs only, never touch workflows. Validate each provider's `@` reference resolution before declaring support.

## Stub-Workflow Split

### Stub (Provider-Specific)

Thin files in provider command directories. Contains only metadata and a reference to the shared workflow.

```yaml
---
name: donna:begin-the-day
description: Morning routine — carry forward tasks, surface recurring, pull tool data
argument-hint: ""
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Agent
---
```

```xml
<objective>
Morning routine: carry forward open tasks, surface recurring due today, pull data from configured tools.
</objective>

<execution_context>
@~/.donna/workflows/begin-the-day.md
</execution_context>

<process>
Execute the begin-the-day workflow from @~/.donna/workflows/begin-the-day.md end-to-end.
</process>
```

**YAML frontmatter fields:**

| Field | Required | Purpose |
|-------|----------|---------|
| `name` | Yes | Skill display name |
| `description` | Yes | One-line description shown in help |
| `argument-hint` | No | Placeholder hint for arguments |
| `allowed-tools` | No | Restrict which tools the skill can use |
| `agent` | No | If true, runs as a sub-agent |

### Workflow (Provider-Agnostic)

Full skill logic in `~/.donna/workflows/`. Uses XML tags for semantic structure:

```xml
<purpose>
Morning routine: carry forward open tasks, surface recurring tasks due today,
spawn tool agents for configured tools.
</purpose>

<process>

<step name="load_config">
Read ~/.config/donna/config.md to get storage repo path.
If missing: tell user to run /donna:setup first, then stop.
</step>

<step name="carry_forward">
Read yesterday's daily file. Find uncompleted tasks. Write to today's file.
</step>

<step name="surface_recurring">
Read recurring.md. Find tasks due today. Add to today's file.
</step>

<step name="pull_tools">
Read tools.md. For each configured tool, spawn a parallel agent.
Each agent runs relevant commands and returns a summary.
</step>

<step name="present_brief">
Display the daily brief: carried forward, recurring, tool data, open space.
Output budget: ~40 lines max.
</step>

<step name="commit">
Git commit all changes.
</step>

</process>

<success_criteria>
- [ ] Today's daily file created with carried-forward tasks
- [ ] Recurring tasks due today surfaced
- [ ] Tool data pulled (if tools configured)
- [ ] Changes committed to git
- [ ] Idempotent: safe to run multiple times
</success_criteria>
```

**Why XML tags over markdown headers:** Claude treats XML tags as clear semantic boundaries for instruction parsing. `<step name="carry_forward">` creates unambiguous structure that the model follows more reliably than `## Step: Carry Forward`.

### Templates and References

**Templates** (`~/.donna/templates/`) — standardized formats for files Donna creates:
- `daily.md` — daily journal structure
- `tools-entry.md` — tool entry format for tools.md
- `role.md` — role definition structure

**References** (`~/.donna/references/`) — shared knowledge used by multiple workflows:
- `journal-conventions.md` — daily file structure, section ordering, task format
- `tool-learning.md` — how to learn a tool (help output vs training data)

Templates and references are `@`-referenced by workflows, keeping each workflow focused while sharing conventions.

## Component Boundaries and Data Flow

### What Each Skill Reads and Writes

| Skill | Reads | Writes | Spawns Agent? |
|-------|-------|--------|---------------|
| `donna:setup` | User input | `~/.config/donna/config.md`, state repo init | No |
| `donna:set-role` | User input, web search | `role.md`, `role-research.md`, `recurring.md` | Yes — research agent |
| `donna:add-tool` | User input, tool `--help` or training data | `tools.md` | No |
| `donna:add-task` | User input ($ARGUMENTS) | `daily/{today}.md` | No |
| `donna:begin-the-day` | `config.md`, `role.md`, `recurring.md`, `tools.md`, `daily/{yesterday}.md` | `daily/{today}.md` | Yes — parallel tool agents |
| `donna:log-meeting` | User input, `people.md` | `daily/{today}.md`, `people.md` | No |
| `donna:next` | `daily/{today}.md`, `recurring.md`, `role.md`, `people.md` | (read-mostly, may reprioritize) | No |

### Data Flow Diagram

```
donna:setup ──> ~/.config/donna/config.md ──> (all skills read this first)
                                               │
                                               v
donna:set-role ──> role.md + role-research.md + recurring.md
   │ (spawns research agent)
   v
donna:add-tool ──> tools.md
   │
   v
donna:begin-the-day ──reads standing files──> daily/{today}.md
   │ (spawns parallel tool agents)     ^          │
   │                                   │          v
   │                              yesterday   donna:add-task ──> daily/{today}.md
   │                                          donna:log-meeting ──> daily/{today}.md + people.md
   │                                               │
   v                                               v
donna:next <──reads daily + standing files──────────+
```

**Key principle:** Data flows in one direction per skill invocation. Each skill reads → works → writes → commits. No skill depends on another running in the same session.

## Bootstrap and Config Layer

### Bootstrap Problem

Skills need the state repo path before they can read anything. Solution: `donna:setup` writes to a well-known, provider-agnostic location.

**`~/.config/donna/config.md`:**
```markdown
# Donna Configuration

## Storage
repo: /Users/username/donna-data

## Preferences
timezone: Europe/Copenhagen
workdays: Mon-Fri
```

### Config Guard Pattern

Every skill (except setup) starts with:
1. Read `~/.config/donna/config.md`
2. If missing → tell user to run `/donna:setup`, stop
3. Extract storage repo path
4. Read state files from that path

## Agent Spawning Patterns

### donna:set-role — Research Agent

1. User provides job role title and context
2. Main skill spawns a research agent
3. Agent searches web for role responsibilities, recurring tasks, common tools
4. Agent writes findings to `role-research.md`
5. Main skill reads findings, presents suggestions to user
6. User approves/rejects/modifies recurring tasks and tool suggestions
7. Approved tasks → `recurring.md`; approved tools → prompt to run `/donna:add-tool`

### donna:begin-the-day — Parallel Tool Agents

1. Read `tools.md` to get configured tools
2. For each relevant tool, spawn a parallel agent
3. Each agent runs CLI commands, parses output, returns normalized summary
4. Main skill stitches summaries into daily brief
5. If no tools configured → skip gracefully, no errors
6. If tool agent fails → report visibly ("gh: auth expired")

### Agent Boundary Rules

- Sub-agents write to specific files only (no broad access)
- Sub-agents do NOT commit to git (parent skill commits)
- Sub-agents do NOT interact with the user (parent handles all interaction)
- Sub-agents return normalized output, not raw CLI dumps

## Build Order

Skills should be built in this order based on dependencies:

```
Phase 1: Foundation and Capture
  donna:setup ──> donna:add-task
  (config.md)    (daily file write + git commit)
  Day one value: user can capture and complete tasks immediately.

Phase 2: Role Awareness and Daily Rhythm
  donna:set-role ──> donna:begin-the-day
  (research agent)  (carry forward + recurring + idempotent)
  The daily driver loop. Role context enriches recurring suggestions.

Phase 3: External Tool Enrichment
  donna:add-tool ──> tool agents in begin-the-day
  (tools.md)        (parallel agents pulling external data)
  Enhancement layer. Works without it, richer with it.
```

**Key ordering rationale:**
- `donna:add-task` works immediately after setup — don't gate basic value behind role definition
- `donna:set-role` is valuable but not blocking — users can start capturing before defining their role
- `donna:begin-the-day` is the daily driver but needs recurring.md to be meaningful
- Tool agents are pure enhancement — begin-the-day works perfectly without them

## Architectural Patterns

### Pattern 1: Read-Transform-Write-Commit
Every skill follows: read state → do work → write state → git commit. Guarantees durability.

### Pattern 2: Config Guard
Every non-setup skill checks config first. Prevents cryptic failures.

### Pattern 3: Idempotent Daily File Creation
Any skill that writes to daily file creates it if missing. User may skip begin-the-day.

### Pattern 4: Append-Only Daily Files
Tasks and meetings are appended, never rewritten. Prevents data loss across multiple skill runs.

### Pattern 5: Standing File Merge
When updating standing files, merge new data with existing. Never lose accumulated context.

## Anti-Patterns

### Cross-Skill Dependencies at Runtime
Skills are independent invocations. No skill calls another. Share state through files.

### Complex State in JSON
Markdown is human-readable, git-diffable, hand-editable. JSON breaks on a missing comma.

### Monolithic State Files
Separate standing files (durable) from daily files (ephemeral). Skills read only what they need.

### Spawning Agents for Simple Tasks
Only spawn for web search, parallel tool data, or isolated work. Most skills are inline.

### Silent Tool Failures
Every tool skip/failure must be visible: "Skipped gh (not found)" or "gh: auth expired".

## Git Commit Strategy

### Commit Message Format
```
donna:{skill}: {what changed}

Examples:
donna:setup: initial configuration
donna:set-role: defined role as Senior Software Engineer
donna:begin-the-day: daily journal for 2026-03-13
donna:add-task: captured "Follow up with Alex"
donna:log-meeting: logged Platform sync
```

One commit per skill invocation. Always new commits, never amend.

## Scalability

| Concern | At 1 week | At 3 months | At 1 year |
|---------|-----------|-------------|-----------|
| Daily files | 5-7 files | ~65 files | ~250 files, may want archival |
| People.md | 5-10 entries | 30-50 entries | 100+ entries, may need sections |
| Git repo size | Negligible | Negligible | Still small (text only) |
| begin-the-day speed | Instant | May slow reading many files | Constrain to yesterday + standing files |
| Context window | Trivial | Watch standing file growth | Skills must read selectively |

**Key insight:** Scales well because text-only and naturally date-partitioned. Only concern is begin-the-day reading too many historical files — constrain to yesterday (or last workday) + standing files.

## Sources

- GSD skill suite as reference implementation (HIGH confidence — direct code inspection of stubs and workflows)
- Claude Code custom command documentation (HIGH confidence)
- PROJECT.md architecture decisions (stub-workflow split, multi-provider, XML tags)
- OpenCode/Gemini/Codex command formats (LOW confidence — unverified)
