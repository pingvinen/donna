# Technology Stack

**Project:** Personal Assistant Skills
**Researched:** 2026-03-13

## Recommended Stack

This is not a traditional software project with runtime dependencies. The "stack" is Claude Code's skill system itself: markdown command files, built-in tools, CLI integrations, and file-based state. There is no build step, no package manager, no deployment pipeline.

### Core Platform

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Claude Code | Latest (CLI) | Runtime environment for all skills | Only platform that supports custom slash commands; the project is exclusively Claude Code skills | HIGH |
| Custom Slash Commands (`.claude/commands/*.md`) | N/A | Skill definition format | Native mechanism for user-defined slash commands; filename = command name, content = prompt instructions | HIGH |
| Markdown files in Git | N/A | All persistent state | Durable, version-controlled, human-readable, diff-friendly; no external database needed | HIGH |
| Git (via Bash tool) | 2.x | State persistence and version history | Every skill run commits state changes, giving full audit trail and rollback capability | HIGH |

### External CLI Integrations (Optional)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `gh` (GitHub CLI) | 2.x | Pull GitHub issues, PRs, notifications | Already installed on most dev machines; rich JSON output via `gh api`; graceful skip if absent | HIGH |
| `jira` (Jira CLI / go-jira) | 1.x | Pull Jira tickets assigned to user | Community standard CLI for Jira; `jira list` and `jira view` provide structured output | MEDIUM |
| `atlassian` CLI tools | Varies | Confluence, Bitbucket integration | Less standardized than gh/jira; may need `curl` + Atlassian REST API instead of dedicated CLI | LOW |

### Built-in Claude Code Tools (Used by Skills)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Read** | Load markdown state files | Every skill run starts by reading current state |
| **Write** | Create/overwrite markdown state files | When creating new daily files, updating standing files |
| **Edit** | Surgically modify existing files | Appending tasks to lists, updating checkboxes, modifying sections |
| **Bash** | Run git commands, invoke external CLIs | `git add/commit`, `gh issue list`, `jira list`, date calculations |
| **Glob** | Find files by pattern | Locating daily files (`daily/2026-*.md`), listing standing files |
| **Grep** | Search file contents | Finding tasks by keyword, locating mentions of a person |
| **WebSearch** | Research the web | Used by `/pa:set-role` to research job responsibilities |
| **WebFetch** | Fetch specific URLs | Pulling specific reference pages during role research |
| **Task** (sub-agent) | Spawn independent agent threads | Role research, complex triage calculations, parallel information gathering |

## Skill File Structure

### How Custom Commands Work

Each skill is a single markdown file in `.claude/commands/`:

```
.claude/commands/
  pa:setup.md
  pa:set-role.md
  pa:begin-the-day.md
  pa:add-task.md
  pa:log-meeting.md
  pa:next.md
```

**File naming convention:** `pa:<skill-name>.md` becomes `/pa:<skill-name>` in Claude Code.

**File content is pure markdown prompt text.** There is no frontmatter, no YAML header, no structured metadata. The entire file is the system prompt that Claude Code executes when the user invokes the command.

### Command Argument Handling

The `$ARGUMENTS` placeholder in a command file captures everything the user types after the command name:

```markdown
# /pa:add-task

Add a task to today's daily file.

User input: $ARGUMENTS

[... rest of instructions ...]
```

Invoked as: `/pa:add-task Follow up with Sarah about the API decision`

`$ARGUMENTS` resolves to: `Follow up with Sarah about the API decision`

### Skill Prompt Anatomy (Recommended Pattern)

Based on the GSD skill suite pattern that this project models after:

```markdown
# Role / Identity Block
You are a personal assistant skill that [does X].

# Context Loading Instructions
Read the following files to understand current state:
- Read `{repo_path}/config.md` for user configuration
- Read `{repo_path}/role.md` for the user's job role
- Read `{repo_path}/daily/YYYY-MM-DD.md` for today's journal (if it exists)

# Core Logic
[Step-by-step instructions for what the skill does]

# Output Format
[How to structure the output shown to the user]

# State Mutation Instructions
[What files to create/update and how to commit them]

# Error Handling
[What to do if files are missing, CLIs unavailable, etc.]
```

### Key Patterns

**1. State File Discovery via Bash (date calculations):**
```markdown
Use the Bash tool to get today's date: `date +%Y-%m-%d`
Then read `{repo_path}/daily/{today}.md` if it exists.
```

**2. Graceful CLI Detection:**
```markdown
Check if `gh` is available: `which gh 2>/dev/null`
If available, pull GitHub data. If not, skip gracefully and note it was skipped.
```

**3. Git Commit After State Changes:**
```markdown
After updating files, commit all changes:
`git -C {repo_path} add -A && git -C {repo_path} commit -m "pa: [skill-name] - [summary of changes]"`
```

**4. Sub-Agent Spawning (Task Tool):**
```markdown
Use the Task tool to spawn a research agent with the following instructions:
"Research what a [role title] typically does day-to-day. Search for common responsibilities,
recurring tasks, and stakeholder interactions. Write findings to {repo_path}/role-research.md"
```

## State Storage Architecture

### File Layout in User's Chosen Repo

```
{user-chosen-repo}/
  config.md          # Setup: repo path, available CLIs, preferences
  role.md            # User's job role definition and approved recurring tasks
  role-research.md   # Research output from /pa:set-role
  recurring.md       # Recurring task definitions with intervals
  people.md          # People the user interacts with, context notes
  daily/
    2026-03-13.md    # Today's journal: tasks, meetings, notes
    2026-03-12.md    # Yesterday's journal
    ...
```

### Markdown State File Format (Recommended)

Use simple, parseable markdown -- not complex structures. Skills need to reliably read/write these files using Read, Write, and Edit tools.

```markdown
# Daily Journal: 2026-03-13

## Tasks
- [ ] Follow up with Sarah about API decision
- [x] Review PR #423
- [ ] Prepare slides for Thursday all-hands

## Meetings
### 10:00 - Sprint Planning
**Attendees:** Sarah, Mike, Priya
**Decisions:** Moving auth to phase 2
**Follow-ups:**
- [ ] Sarah to share updated timeline
- [ ] I need to update the roadmap doc

## Notes
- Heard from VP that Q3 priorities may shift
```

**Why this format:**
- Checkboxes (`- [ ]` / `- [x]`) are universally understood, trivially parseable
- H2/H3 sections are easy targets for Edit tool section replacement
- No custom syntax to learn or break
- Git diffs are clean and readable

## Sub-Agent Patterns

### When to Use the Task Tool

| Scenario | Use Task Tool? | Rationale |
|----------|---------------|-----------|
| Role research (web search + synthesis) | YES | Long-running, independent work; main thread stays responsive |
| Complex triage ("what should I do next?") | MAYBE | Only if analyzing many files; simple triage can be inline |
| Pulling data from multiple CLIs | NO | Sequential CLI calls are fine inline; no benefit from parallelism |
| Reading/updating state files | NO | Core skill logic; must be in main thread to control flow |

### Task Tool Invocation Pattern

Within a skill prompt, instruct Claude Code to use the Task tool:

```markdown
Spawn a sub-agent using the Task tool with these instructions:
- Description: "Research typical responsibilities for a {role_title}"
- Instructions: Search the web for "{role_title} daily responsibilities",
  "{role_title} recurring tasks", "{role_title} stakeholder management".
  Synthesize findings into a structured markdown document.
  Write the output to {repo_path}/role-research.md using the Write tool.
```

The Task tool creates an independent agent thread with its own tool access. The parent skill waits for it to complete, then continues.

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Command format | `.claude/commands/*.md` (pure markdown) | MCP server with custom tools | Massive overengineering; skills are prompts not code; MCP adds complexity with zero benefit for this use case |
| State storage | Markdown files in git | SQLite / JSON files | Markdown is human-readable, diff-friendly, editable outside Claude Code; JSON is harder to read/edit by hand; SQLite is opaque |
| State format | Simple markdown with checkboxes and headers | YAML frontmatter + markdown body | Frontmatter adds parsing complexity; skills use Read/Edit tools which work on plain text; no structured query needs that justify YAML |
| External CLI integration | Bash tool calling `gh`/`jira` directly | MCP servers for GitHub/Jira | Direct CLI calls are simpler, more transparent, easier to debug; MCP servers add a dependency layer; `gh` and `jira` CLIs are already powerful |
| Sub-agent spawning | Task tool (built-in) | Custom orchestration code | Task tool is purpose-built for this; no custom code needed |
| Command location | Project `.claude/commands/` | User `~/.claude/commands/` | Project-level means skills travel with the repo; user-level means they work across repos. **Decision: use user-level (`~/.claude/commands/`) because these skills operate on an external repo, not the repo they live in** |

## Critical Design Decision: Command Location

**Recommendation: User-level commands in `~/.claude/commands/`**

The personal assistant skills are invoked from ANY project the user is working in. They operate on the user's chosen personal-assistant repo, not the current working directory. This means:

1. Skills must live in `~/.claude/commands/` (user-level), not `.claude/commands/` (project-level)
2. The `config.md` file stores the path to the user's PA repo
3. Every skill reads `config.md` first to discover the repo path
4. All file operations use absolute paths to the PA repo

This mirrors GSD's approach: GSD commands live in `~/.claude/commands/` and operate on whatever project is in the current directory. PA commands live in `~/.claude/commands/` and operate on the configured PA repo.

## What NOT to Use

| Anti-Pattern | Why Avoid |
|--------------|-----------|
| **MCP servers for state management** | Massive overengineering. Read/Write/Edit tools handle markdown files perfectly. MCP adds a server process, connection management, and failure modes for zero benefit. |
| **JSON or YAML state files** | Humans need to read and occasionally hand-edit state. Markdown with checkboxes and headers is the most ergonomic format for a productivity tool. |
| **Complex parsing logic in skill prompts** | Keep state files simple enough that "read the file and understand it" is sufficient. No regex parsing instructions, no custom delimiters. |
| **Hardcoded paths in skill files** | Always read `config.md` for the repo path. Never assume `~/personal-assistant/` or any fixed location. |
| **Interactive multi-turn flows within a single skill** | Each skill should do one thing and complete. If user input is needed mid-flow, use the AskUser pattern (Bash tool or direct question) but keep it to 0-1 questions per skill run. |
| **npm/pip/any package dependencies** | There is no code to install. Skills are markdown files. The only "dependencies" are the CLIs the user already has (git, gh, jira). |
| **Database of any kind** | Git + markdown IS the database. Version history IS the audit log. `git log` IS the query engine for historical state. |

## Installation

There is no installation in the traditional sense. Setup consists of:

```bash
# 1. Create a repo for PA state (one-time)
mkdir ~/personal-assistant-data && cd ~/personal-assistant-data && git init

# 2. Copy skill files to user-level commands (one-time)
cp skills/*.md ~/.claude/commands/

# 3. Run setup skill (one-time)
# In Claude Code: /pa:setup
# This creates config.md pointing to the data repo
```

Alternatively, skills could be distributed as a git repo that the user clones, with a setup script that symlinks `.md` files into `~/.claude/commands/`.

## Version Compatibility Notes

| Component | Version Constraint | Notes |
|-----------|-------------------|-------|
| Claude Code | Any version supporting custom commands | Custom commands have been stable since early Claude Code releases |
| Git | 2.x | Standard; any modern git works |
| `gh` CLI | 2.x | Optional; `gh issue list --json` and `gh api` are the key features used |
| Jira CLI | go-jira 1.x or atlassian-cli | Optional; less standardized than gh; may need skill-level adaptation |

## Sources

- Claude Code documentation on custom slash commands (training data, HIGH confidence)
- GSD skill suite as reference implementation (referenced in PROJECT.md, HIGH confidence for patterns)
- GitHub CLI documentation for `gh` command patterns (training data, HIGH confidence)
- Jira CLI ecosystem is more fragmented -- go-jira, jira-cli, atlassian-cli all exist with varying maturity (MEDIUM confidence)
