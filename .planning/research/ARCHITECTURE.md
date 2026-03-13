# Architecture Patterns

**Domain:** Claude Code personal assistant skill suite
**Researched:** 2026-03-13

## Recommended Architecture

The system follows a **skill-per-command architecture** where each slash command is a self-contained markdown prompt file that reads/writes to a shared state layer of markdown files in a user-chosen git repository. Skills are stateless between invocations -- all persistence lives in the file system.

### High-Level Structure

```
User's machine
  |
  +-- ~/.claude/commands/donna:*.md        <-- Skill prompt files (installed)
  |
  +-- [user-chosen-repo]/               <-- State repository
       +-- config.md                    <-- Setup config (repo path, tools, prefs)
       +-- role.md                      <-- Job role definition
       +-- role-research.md             <-- Research agent output
       +-- recurring.md                 <-- Recurring task definitions
       +-- people.md                    <-- People/relationship context
       +-- daily/
       |    +-- 2026-03-13.md           <-- Today's journal
       |    +-- 2026-03-12.md           <-- Yesterday's journal
       |    +-- ...
       +-- archive/                     <-- Completed/old items (optional)
```

### Component Boundaries

| Component | Responsibility | Reads From | Writes To |
|-----------|---------------|------------|-----------|
| `donna:setup` | Bootstrap config: link storage repo, detect CLIs, set preferences | User input | `config.md` |
| `donna:set-role` | Define job role, spawn research agent, propose recurring tasks | User input, web search | `role.md`, `role-research.md`, `recurring.md` |
| `donna:begin-the-day` | Morning routine: carry forward, surface recurring, pull external | `config.md`, `role.md`, `recurring.md`, `daily/{yesterday}.md`, Jira/GH CLIs | `daily/{today}.md` |
| `donna:add-task` | Quick task capture with metadata | User input, `people.md` | `daily/{today}.md` |
| `donna:log-meeting` | Post-meeting capture: attendees, decisions, follow-ups | User input, `people.md` | `daily/{today}.md`, `people.md` |
| `donna:next` | Triage: what should I do right now? | `daily/{today}.md`, `recurring.md`, `role.md` | (read-mostly, may reprioritize `daily/{today}.md`) |
| Research Agent | Sub-agent spawned by `donna:set-role` | Web search results | `role-research.md` |
| Git Commit Layer | Each skill commits after writing | All changed files | Git history |

### Data Flow

```
donna:setup --> config.md
                |
                v
donna:set-role --> role.md + role-research.md + recurring.md
                |              |                  |
                v              v                  v
donna:begin-the-day ----reads all standing files---->  daily/{today}.md
                     + yesterday's journal              |
                     + Jira/GH (if configured)          |
                                                        v
donna:add-task  ---------------------------------------->  daily/{today}.md
donna:log-meeting -------------------------------------->  daily/{today}.md + people.md
                                                        |
                                                        v
donna:next  <---------reads daily + standing files---------+
```

**Key principle:** Data flows in one direction per skill invocation. Each skill reads what it needs, does its work, writes results, and commits. No skill depends on another skill running in the same session.

## Skill File Structure (How Skills Are Built)

Each skill is a single markdown file installed into the Claude Code commands directory. Following the GSD pattern:

```
~/.claude/commands/
  donna:setup.md
  donna:set-role.md
  donna:begin-the-day.md
  donna:add-task.md
  donna:log-meeting.md
  donna:next.md
```

Each skill markdown file contains:

1. **System instructions** -- Role definition, constraints, behavioral rules
2. **File reading directives** -- Which state files to load at the start (`<files_to_read>` block or explicit Read instructions)
3. **Interaction flow** -- Steps the skill executes (read state, interact with user, write state, commit)
4. **Output format** -- How to structure written markdown
5. **Git commit instructions** -- Commit after each meaningful state change

### Skill Template Pattern

Every skill should follow this skeleton:

```markdown
# donna:{skill-name}

## Context Loading
- Read config.md to get storage repo path and available tools
- Read [relevant standing files]
- Read daily/{today}.md if it exists

## Execution
[Skill-specific logic]

## State Writing
- Write changes to [target files]
- Git add + commit with descriptive message

## Output
[What to display to the user]
```

## Config/Setup Layer

### Bootstrap Problem

The storage repo path must be known before any other skill can read/write state. This creates a bootstrap dependency:

**Solution:** `donna:setup` writes a config file to a **known location** that all other skills check first.

```
~/.claude/pa-config.json    <-- Bootstrap pointer (just the repo path)
```

OR (simpler, following GSD's pattern of keeping everything in the commands directory):

```
~/.claude/commands/pa-state/config.md   <-- Inline with skills
```

**Recommended approach:** Use a well-known path like `~/.config/donna/config.md` that every skill reads first. This file contains:

```markdown
# Donna Config

## Storage Repository
path: /Users/patrick/workspace/donna-storage

## Available Tools
- [x] gh (GitHub CLI)
- [ ] jira (Jira CLI)

## Preferences
timezone: America/New_York
workdays: Mon-Fri
```

### Config Guard Pattern

Every skill (except `donna:setup`) should start with:

```
1. Read ~/.config/donna/config.md
2. If missing: tell user to run /donna:setup first, then stop
3. Extract storage repo path
4. Read state files from that path
```

This prevents confusing errors when skills run before setup.

## Storage Repository File Formats

### config.md (in storage repo -- detailed config)

```markdown
# Configuration

## Tools
| Tool | Available | Path/Command |
|------|-----------|-------------|
| gh | yes | gh |
| jira | no | — |

## Integrations
github_org: my-company
jira_project: —
```

### role.md

```markdown
# My Role

**Title:** Senior Software Engineer
**Team:** Platform Team
**Manager:** Jane Smith
**Focus areas:** Infrastructure, developer experience, API platform

## Key Responsibilities
- Own the API gateway
- Mentor two junior engineers
- Represent platform team in architecture reviews
```

### recurring.md

```markdown
# Recurring Tasks

| Task | Frequency | Day(s) | Last Done | Source |
|------|-----------|--------|-----------|--------|
| Refine backlog | weekly | Monday | 2026-03-10 | user-defined |
| 1:1 with Jane | weekly | Wednesday | 2026-03-11 | user-defined |
| Review PRs | daily | — | 2026-03-12 | role-research |
| Update team metrics | monthly | 1st | 2026-03-01 | role-research |
```

### daily/YYYY-MM-DD.md

```markdown
# Thursday, March 13, 2026

## Carried Forward
- [ ] Follow up with Alex on API migration timeline (from Mar 12)

## Recurring Due Today
- [ ] Review PRs (daily)

## Tasks
- [ ] Prepare architecture review slides for Friday
- [x] Reply to Sarah's Slack about deploy schedule

## Meetings
### 10:00 — Platform sync
**Attendees:** Jane, Alex, Maria
**Decisions:** Moving to Kubernetes 1.29 next quarter
**Follow-ups:**
- [ ] Patrick: Draft migration plan by Friday
- [ ] Alex: Audit current resource limits

## Notes
- Slack conversation with product about Q2 priorities — they want search improvements
```

### people.md

```markdown
# People

| Name | Role/Context | Last Interaction | Notes |
|------|-------------|-----------------|-------|
| Jane Smith | Manager | 2026-03-11 (1:1) | Cares about team velocity metrics |
| Alex Chen | Teammate | 2026-03-12 (platform sync) | Owns Kubernetes migration |
| Sarah Lopez | DevOps | 2026-03-13 (Slack) | Deploy schedule contact |
```

## Sub-Agent Spawning Pattern

### When to Spawn

Only `donna:set-role` needs a research sub-agent. The pattern:

1. User provides their job role title and context
2. Main skill spawns a research agent with a focused prompt
3. Agent searches the web for: "What does a [role] actually do day-to-day?"
4. Agent writes findings to `role-research.md`
5. Main skill reads `role-research.md`, extracts recurring task suggestions
6. Main skill presents suggestions to user for approval
7. Approved tasks written to `recurring.md`

### Agent Spawning Implementation

Following GSD's pattern, the skill prompt instructs Claude to use the Agent tool (or Task tool) to spawn a sub-agent:

```
Spawn a research agent with the following instructions:
- Search for "[role title] daily responsibilities"
- Search for "[role title] recurring tasks weekly monthly"
- Search for "[role title] common meetings"
- Synthesize findings into structured output
- Write to {storage_repo}/role-research.md
```

The sub-agent has its own system prompt embedded in the spawning instruction. It writes directly to the storage repo and the parent skill reads the result.

### Agent Boundary Rules

- Sub-agents write to specific files only (no broad file access)
- Sub-agents do NOT commit to git (parent skill commits after reviewing)
- Sub-agents do NOT interact with the user (parent skill handles all interaction)

## External CLI Integration Pattern

### Graceful Degradation

Skills that use external CLIs (Jira, GitHub) must work without them:

```
1. Read config.md to check if tool is available
2. If available: run CLI command, parse output, incorporate
3. If unavailable: skip gracefully, note what was skipped
4. Never fail because an optional tool is missing
```

### CLI Interaction Examples

**GitHub (via `gh`):**
```bash
gh pr list --author @me --state open --json title,url,updatedAt
gh issue list --assignee @me --state open --json title,url,labels
```

**Jira (via `jira` CLI or API):**
```bash
jira issue list --assignee currentUser --status "In Progress" --plain
```

### Output Normalization

External data should be normalized into the daily journal format. A GitHub PR becomes a task line:

```markdown
- [ ] Review: "Fix auth timeout" (PR #423, updated 2h ago) [github]
```

## Patterns to Follow

### Pattern 1: Read-Transform-Write-Commit
**What:** Every skill follows the same lifecycle: read state files, do work (possibly interacting with user), write updated state files, git commit.
**When:** Always. Every skill invocation.
**Why:** Guarantees state durability. If Claude's context resets mid-session, the last commit is the recovery point.

### Pattern 2: Config Guard
**What:** Every skill (except setup) checks for config before proceeding.
**When:** First action of every non-setup skill.
**Why:** Prevents cryptic failures and gives clear remediation ("run /donna:setup first").

### Pattern 3: Idempotent Daily File Creation
**What:** `begin-the-day` creates today's daily file, but `add-task` and `log-meeting` also create it if it does not exist yet.
**When:** Any skill that writes to the daily file.
**Why:** User may skip `begin-the-day` and go straight to `add-task`. The system should not break.

### Pattern 4: Append-Only Daily Files
**What:** Tasks and meetings are appended to sections in the daily file, never rewritten from scratch.
**When:** `add-task`, `log-meeting` writing to an existing daily file.
**Why:** Prevents data loss if multiple skills run in the same day. Each skill preserves what is already there.

### Pattern 5: Standing File Merge
**What:** When updating standing files (people.md, recurring.md), merge new data with existing rather than overwriting.
**When:** `log-meeting` updating people.md, `set-role` updating recurring.md.
**Why:** Accumulated context is valuable. Never lose existing entries.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Cross-Skill Dependencies at Runtime
**What:** Skill A calling Skill B during execution.
**Why bad:** Claude Code skills are independent invocations. There is no reliable way to chain them in a single session. Each is a fresh context.
**Instead:** Skills share state through files. If skill A produces something skill B needs, it writes to a file that skill B reads on its next invocation.

### Anti-Pattern 2: Complex State in JSON
**What:** Storing state in JSON files instead of markdown.
**Why bad:** Markdown is human-readable, git-diffable, and editable by hand. JSON is fragile (one missing comma breaks parsing) and opaque in git diffs.
**Instead:** Use markdown with consistent structure (tables, headers, checkbox lists). Parse by convention, not by schema.

### Anti-Pattern 3: Monolithic Daily Files
**What:** Putting everything (config, role, recurring, daily) in one file.
**Why bad:** Every skill would read/write the entire file, causing merge conflicts and bloat. Skills that only need config would load irrelevant daily tasks.
**Instead:** Separate concerns into standing files (durable context) and daily files (ephemeral daily state).

### Anti-Pattern 4: Spawning Agents for Simple Tasks
**What:** Using sub-agents for anything other than web research.
**Why bad:** Agent spawning adds latency and complexity. Most skills just need to read files, interact with the user, and write files.
**Instead:** Only spawn agents when you need web search or parallel independent work. The only current use case is role research in `donna:set-role`.

### Anti-Pattern 5: Silent External CLI Failures
**What:** Running `gh` or `jira` and swallowing errors without informing the user.
**Why bad:** User does not know if their GitHub PRs were checked or not.
**Instead:** When a CLI call fails or is skipped, note it visibly: "Skipped GitHub PR check (gh CLI not configured)."

## Build Order (Dependency Graph)

Skills should be built in this order based on dependencies:

```
Phase 1: donna:setup
   |  (all other skills depend on config.md existing)
   v
Phase 2: donna:set-role + donna:add-task
   |  (set-role establishes role context; add-task is simple and independent)
   |  (set-role includes the research agent, which is the most complex sub-component)
   v
Phase 3: donna:begin-the-day
   |  (needs role.md, recurring.md, config.md, and yesterday's daily file)
   |  (this is where external CLI integration first appears)
   v
Phase 4: donna:log-meeting
   |  (needs people.md for context, writes to daily file and people.md)
   v
Phase 5: donna:next
   |  (needs everything: daily file, recurring.md, role.md)
   |  (this is the "capstone" -- it reads all state and synthesizes priority)
```

**Rationale:**
- `donna:setup` is the foundation. Nothing works without it.
- `donna:set-role` and `donna:add-task` can be built in parallel. `set-role` is complex (research agent) but establishes the role context everything else uses. `add-task` is simple and lets you start capturing tasks immediately.
- `donna:begin-the-day` is the daily driver but needs role and recurring data to be meaningful.
- `donna:log-meeting` needs the daily file pattern established and benefits from people.md.
- `donna:next` is the intelligence layer -- it reads everything and makes recommendations. Build it last when all data sources exist.

## Git Commit Strategy

### When to Commit
Every skill commits after completing its write operations. One commit per skill invocation.

### Commit Message Format
```
donna:{skill}: {what changed}

Examples:
donna:setup: initial configuration
donna:set-role: defined role as Senior Software Engineer
donna:begin-the-day: started daily journal for 2026-03-13
donna:add-task: captured "Follow up with Alex on API migration"
donna:log-meeting: logged Platform sync meeting
donna:next: reprioritized today's tasks
```

### Commit Scope
Each commit includes all files modified by that skill invocation. This keeps the git history a clean log of assistant interactions.

## Scalability Considerations

| Concern | At 1 week | At 3 months | At 1 year |
|---------|-----------|-------------|-----------|
| Daily files | 5-7 files, trivial | ~65 files, still fast | ~250 files, may want archival |
| People.md | 5-10 entries | 30-50 entries | 100+ entries, may need sections |
| Git repo size | Negligible | Negligible | Still small (text only) |
| begin-the-day speed | Instant | May slow if reading many past files | Should only read yesterday + standing files |
| Recurring task matching | Simple table scan | Still simple | Still simple (table won't exceed ~50 rows) |

**Key insight:** This system scales well because it is text-only and daily files are naturally partitioned by date. The only scaling concern is `begin-the-day` reading too many historical files -- constrain it to read only yesterday's file (or last workday's file) plus standing files.

## Sources

- PROJECT.md from the personal-assistant repository (primary source for requirements)
- GSD (get-shit-done) skill suite patterns (referenced in PROJECT.md as direct inspiration)
- Claude Code custom slash commands documentation (training data, MEDIUM confidence)
- Claude Code Agent/Task tool spawning patterns (training data, MEDIUM confidence)
