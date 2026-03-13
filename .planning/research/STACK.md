# Technology Stack

**Project:** Donna
**Researched:** 2026-03-13 (revised)

## Recommended Stack

This is not a traditional software project with runtime dependencies. The "stack" is the AI coding assistant's skill system: YAML frontmatter stubs, XML-tagged workflow files, built-in tools, and file-based state. There is no build step, no package manager, no deployment pipeline.

### Core Platform

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Claude Code | Latest (CLI) | Primary runtime environment | Best-documented custom command support; reference implementation target | HIGH |
| OpenCode | Latest | Secondary provider | Growing adoption; similar command model | LOW (unverified) |
| Gemini CLI | Latest | Secondary provider | Google ecosystem reach | LOW (unverified) |
| Codex CLI | Latest | Secondary provider | OpenAI ecosystem reach | LOW (unverified) |
| Markdown files in Git | N/A | All persistent state | Durable, version-controlled, human-readable, diff-friendly | HIGH |
| Git (via Bash tool) | 2.x | State persistence and version history | Every skill run commits state; full audit trail and rollback | HIGH |

**Multi-provider strategy:** Build and validate Claude Code first. The stub-workflow split makes adding providers mechanical — write stubs only, never touch workflows. Validate each provider's `@` reference resolution before declaring support.

### External CLI Integrations (Optional)

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| `gh` (GitHub CLI) | 2.x | Pull GitHub issues, PRs, notifications | Rich JSON output via `gh api`; graceful skip if absent | HIGH |
| `jira` (Jira CLI / go-jira) | 1.x | Pull Jira tickets assigned to user | Community standard CLI; `jira list` provides structured output | MEDIUM |
| `atlassian` CLI tools | Varies | Confluence, Bitbucket integration | Less standardized; may need `curl` + REST API | LOW |

### Built-in AI Assistant Tools (Used by Skills)

| Tool | Purpose | When to Use |
|------|---------|-------------|
| **Read** | Load markdown state files | Every skill run starts by reading current state |
| **Write** | Create/overwrite markdown state files | Creating new daily files, updating standing files |
| **Edit** | Surgically modify existing files | Appending tasks, updating checkboxes, modifying sections |
| **Bash** | Run git commands, invoke external CLIs | `git add/commit`, `gh issue list`, date calculations |
| **Glob** | Find files by pattern | Locating daily files (`daily/2026-*.md`), listing standing files |
| **Grep** | Search file contents | Finding tasks by keyword, locating mentions of a person |
| **WebSearch** | Research the web | Used by `/donna:set-role` to research job responsibilities |
| **WebFetch** | Fetch specific URLs | Pulling reference pages during role research |
| **Agent/Task** (sub-agent) | Spawn independent agent threads | Role research, parallel tool data gathering in begin-the-day |

## Skill File Architecture: Stub-Workflow Split

### Overview

Skills use a two-layer architecture:
1. **Stubs** — thin provider-specific files with YAML frontmatter + one `@` reference to a shared workflow
2. **Workflows** — provider-agnostic logic files using XML tags for semantic structure

This means logic is written once and installed for multiple providers.

### Stub Format (Provider-Specific)

Stubs live in provider command directories (e.g., `~/.claude/commands/donna/`).

```yaml
---
name: donna:setup
description: First-time configuration — link storage repo
argument-hint: "[repo-path]"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---
```

```xml
<objective>
Configure Donna's storage repo and initialize file structure.
</objective>

<execution_context>
@~/.donna/workflows/setup.md
</execution_context>

<process>
Execute the setup workflow from @~/.donna/workflows/setup.md end-to-end.
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

### Workflow Format (Provider-Agnostic)

Workflows live in `~/.donna/workflows/` and contain all skill logic using XML tags:

```xml
<purpose>
First-time configuration: link git repo, initialize file structure.
</purpose>

<process>

<step name="discover_repo">
Ask the user for their storage repo path, or detect if $ARGUMENTS contains one.
</step>

<step name="initialize">
Create the hybrid file structure in the repo...
</step>

</process>

<success_criteria>
- [ ] config.md created at ~/.config/donna/config.md
- [ ] Storage repo initialized with standing files
- [ ] First git commit made
</success_criteria>
```

**Why XML tags over markdown headers:** Claude treats XML tags as clear semantic boundaries for instruction parsing. Markdown headers (`## Step 1`) blend with content; XML tags (`<step name="discover_repo">`) create unambiguous structure that the model follows more reliably.

### Directory Layout

```
~/.donna/                          # Shared runtime (provider-agnostic)
  workflows/
    setup.md                       # Full logic for donna:setup
    set-role.md                    # Full logic for donna:set-role
    begin-the-day.md               # Full logic for donna:begin-the-day
    add-task.md                    # Full logic for donna:add-task
    add-tool.md                    # Full logic for donna:add-tool
    log-meeting.md                 # Full logic for donna:log-meeting
    next.md                        # Full logic for donna:next
  templates/
    daily-journal.md               # Template for daily files
    role-research.md               # Template for research output
  references/
    commit-patterns.md             # Git commit conventions
    file-formats.md                # State file format reference

~/.claude/commands/donna/          # Claude Code stubs
  setup.md                         # Thin stub → @~/.donna/workflows/setup.md
  set-role.md
  begin-the-day.md
  add-task.md
  ...

~/.config/opencode/commands/donna/ # OpenCode stubs (same structure)
  ...

~/.config/donna/
  config.md                        # Bootstrap config → points to state repo
```

### Bootstrap Config

`~/.config/donna/config.md` is at a well-known fixed path, solving the bootstrapping paradox: skills need to know the state repo path before they can read anything from it.

```markdown
# Donna Configuration

## Storage
repo: /Users/username/donna-data

## Providers
- claude-code
- opencode
```

Every skill reads this file first to discover the state repo path, then operates on that repo using absolute paths.

## State Storage Architecture

### File Layout in User's Chosen Repo

```
{user-chosen-repo}/
  config.md          # Preferences, available CLIs
  role.md            # User's job role definition and approved recurring tasks
  role-research.md   # Research output from /donna:set-role
  recurring.md       # Recurring task definitions with intervals
  tools.md           # Declared tools and learned knowledge
  people.md          # People the user interacts with, context notes
  daily/
    2026-03-13.md    # Today's journal: tasks, meetings, notes
    2026-03-12.md    # Yesterday's journal
    ...
```

### Markdown State File Format

Use simple, parseable markdown — not complex structures. Skills use Read/Edit tools which work on plain text.

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

## Key Patterns

**1. Date calculations (cross-platform):**
```bash
# macOS (BSD date)
date -v-1d +%Y-%m-%d

# Linux (GNU date)
date -d yesterday +%Y-%m-%d

# Portable approach in skills:
yesterday=$(date -v-1d +%Y-%m-%d 2>/dev/null || date -d yesterday +%Y-%m-%d)
```

**2. Graceful CLI Detection:**
```bash
which gh 2>/dev/null && echo "available" || echo "not-installed"
```

**3. Git Commit After State Changes:**
```bash
git -C {repo_path} add -A && git -C {repo_path} commit -m "donna: [skill-name] - [summary]"
```

**4. Sub-Agent Spawning:**
Skills instruct Claude to use the Agent/Task tool for independent work (role research, parallel tool data gathering). The parent skill waits for completion, then continues.

## Installer Pattern

```bash
# npx-style one-liner
npx donna-install

# What the installer does:
# 1. Copy workflows, templates, references to ~/.donna/
# 2. Detect installed providers (Claude Code, OpenCode, etc.)
# 3. Copy provider-specific stubs to each provider's commands directory
# 4. Write ~/.donna/version.md for update tracking
# 5. Prompt user to run /donna:setup in their preferred provider
```

Manual alternative:
```bash
git clone <donna-repo> /tmp/donna-install
cp -r /tmp/donna-install/workflows ~/.donna/workflows
cp -r /tmp/donna-install/templates ~/.donna/templates
cp -r /tmp/donna-install/stubs/claude-code/* ~/.claude/commands/donna/
```

## Sub-Agent Patterns

### When to Use Sub-Agents

| Scenario | Use Sub-Agent? | Rationale |
|----------|---------------|-----------|
| Role research (web search + synthesis) | YES | Long-running, independent work |
| Parallel tool data gathering (begin-the-day) | YES | Each tool gets its own agent, isolates failures |
| Complex triage ("what should I do next?") | MAYBE | Only if analyzing many files |
| Reading/updating state files | NO | Core skill logic; must be in main thread |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Skill architecture | Stub-workflow split | Single monolithic command files | Logic duplication across providers; can't update logic without updating every provider |
| Command format | YAML frontmatter stubs + XML workflows | Pure markdown everything | YAML gives structured metadata; XML gives semantic instruction boundaries |
| State storage | Markdown files in git | SQLite / JSON files | Markdown is human-readable, diff-friendly, editable outside AI assistants |
| State format | Simple markdown with checkboxes | YAML frontmatter + body | Frontmatter adds parsing complexity; no structured query needs justify it |
| External CLI integration | Bash tool calling `gh`/`jira` directly | MCP servers for GitHub/Jira | Direct CLI calls are simpler, more transparent, easier to debug |
| Runtime location | `~/.donna/` (provider-agnostic) | Inside provider directories | Provider-agnostic location means one copy of logic, not N |
| Bootstrap config | `~/.config/donna/config.md` | Environment variable | File is discoverable, editable, version-trackable |

## What NOT to Use

| Anti-Pattern | Why Avoid |
|--------------|-----------|
| **YAML frontmatter in workflow files** | Only stubs use YAML frontmatter. Workflows use XML tags. Mixing formats creates confusion about which layer you're in. |
| **MCP servers for state management** | Massive overengineering. Read/Write/Edit tools handle markdown files perfectly. |
| **JSON or YAML state files** | Humans need to read and hand-edit state. Markdown with checkboxes is the most ergonomic format. |
| **Amending git commits** | Always create new commits. Amending loses history and can cause conflicts if the repo is shared. |
| **Sub-agents interacting with users** | Sub-agents write files and return results. Only the main skill thread interacts with the user. |
| **Assuming GNU date on macOS** | Use portable date patterns or try BSD first with GNU fallback. |
| **npm/pip/any runtime dependencies** | Skills are markdown files. The only "dependencies" are CLIs the user already has. |
| **Hardcoded paths in skill files** | Always read bootstrap config for the repo path. Never assume a fixed location. |
| **Complex parsing logic in skill prompts** | Keep state files simple enough that "read and understand" is sufficient. |

## Version Compatibility Notes

| Component | Version Constraint | Notes |
|-----------|-------------------|-------|
| Claude Code | Any with custom commands | Custom commands have been stable since early releases |
| Git | 2.x | Standard; any modern git works |
| `gh` CLI | 2.x | Optional; `gh issue list --json` and `gh api` are key features |
| Jira CLI | go-jira 1.x | Optional; less standardized than gh |

## Sources

- GSD skill suite as reference implementation (HIGH confidence — direct code inspection)
- Claude Code custom command documentation (HIGH confidence)
- GitHub CLI documentation (HIGH confidence)
- Jira CLI ecosystem (MEDIUM confidence — fragmented)
- OpenCode/Gemini/Codex command formats (LOW confidence — unverified)
