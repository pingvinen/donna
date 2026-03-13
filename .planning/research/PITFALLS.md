# Domain Pitfalls

**Domain:** Personal productivity CLI tool (Claude Code skill suite with markdown-state persistence)
**Researched:** 2026-03-13
**Confidence:** MEDIUM (based on established patterns in productivity tooling, Claude Code skill design, and git-backed state management; web verification was unavailable)

## Critical Pitfalls

Mistakes that cause user abandonment or require significant rework.

---

### Pitfall 1: Capture Friction Kills Adoption

**What goes wrong:** The tool requires too many steps or too much context to capture a task. Users revert to Slack self-DMs, sticky notes, or "I'll remember it." Every second of friction between "I need to remember this" and "it's captured" loses users.

**Why it happens:** Developers design skills around data completeness (category, priority, due date, assignee) instead of speed. The `donna:add-task` skill asks three questions when the user just needs to dump a sentence.

**Consequences:** Users stop capturing tasks within the first week. The system becomes stale, which triggers a death spiral: stale data means `donna:begin-the-day` surfaces irrelevant content, which means the user stops invoking it entirely.

**Warning signs:**
- `donna:add-task` has more than one required interactive prompt
- Users need to switch context (open a different terminal, navigate to the repo) to capture
- Capture takes more than 10 seconds from invocation to completion

**Prevention:**
- `donna:add-task` should accept a single freeform string: `/donna:add-task Follow up with Sarah about API timeline`
- All metadata (priority, category, due date) is optional and inferred or deferred
- The skill should work from any directory, not just the state repo
- Commit happens silently in the background; user never waits for git

**Phase mapping:** Phase 1 (MVP). Get capture right first. Everything else depends on data being in the system.

---

### Pitfall 2: Morning Routine Becomes a Wall of Text

**What goes wrong:** `donna:begin-the-day` dumps everything -- carried-forward tasks, recurring items, Jira tickets, GitHub notifications -- in a single unstructured wall. The user's eyes glaze over. The skill feels like work, not like help.

**Why it happens:** The developer thinks "more information = more value." In reality, a morning routine skill competes with the user simply opening their calendar and Jira board. If it is not faster and more focused than what they already do, it loses.

**Consequences:** Users invoke `begin-the-day` a few times, feel overwhelmed, and stop. The skill becomes shelfware.

**Warning signs:**
- Output exceeds 40-50 lines on a typical day
- No visual hierarchy (everything looks equally important)
- User has to scroll to see all content
- Recurring tasks and carryover tasks are not distinguished from new items

**Prevention:**
- Strict information hierarchy: (1) overdue items, (2) today's commitments, (3) recurring tasks due, (4) optional enrichment from Jira/GitHub
- Cap the default view. Show top 5-7 items. Offer "show all" as an explicit expansion
- Use clear section headers and formatting (the GSD banner pattern works well here)
- Include a one-line summary at the top: "3 carried forward, 2 recurring, 1 follow-up due"

**Phase mapping:** Phase 2 (daily workflow). Design the output format carefully before building the logic.

---

### Pitfall 3: Markdown State Drift and Corruption

**What goes wrong:** Multiple skills read and write the same markdown files. A skill reads `recurring.md`, another skill modifies it concurrently (or the user edits it manually), and the next commit overwrites changes. Worse: a skill partially writes a file and crashes, leaving malformed markdown that breaks subsequent parsing.

**Why it happens:** Markdown files are not databases. There are no locks, no transactions, no schema enforcement. Claude Code skills run in separate contexts and have no shared memory. Git provides history but not concurrency control.

**Consequences:** Lost tasks (the worst possible failure for a "never forget" tool), corrupted files that require manual repair, or silent data loss where the user does not realize a task disappeared.

**Warning signs:**
- Two skills that can modify the same file (e.g., `add-task` and `begin-the-day` both writing to the daily file)
- No validation of markdown structure after writes
- Manual user edits to state files are not accounted for
- Git merge conflicts in state files

**Prevention:**
- **Single-writer principle:** Each file has at most one skill that writes to it at a time. Daily files are append-only during the day; only `begin-the-day` creates a new one
- **Read-before-write with git pull:** Every skill that writes state should pull first, read the current file, modify, write, commit. This is the closest thing to a transaction
- **Validate after write:** After writing a markdown file, re-read it and verify the structure parses correctly
- **Defensive parsing:** All markdown readers must tolerate malformed input -- skip bad sections rather than crashing
- **Idempotent operations:** Running a skill twice should not duplicate tasks or corrupt state

**Phase mapping:** Phase 1 (core infrastructure). The state management layer must be solid before building skills on top of it.

---

### Pitfall 4: Context Window Exhaustion from State Files

**What goes wrong:** As the user accumulates weeks of daily files, recurring tasks, role research, people notes, and meeting logs, the total state exceeds what Claude Code can read into a single context window. Skills start failing silently (reading truncated files) or erroring out.

**Why it happens:** The developer tests with 3 days of data. In production, users have 60+ daily files, a large `people.md`, extensive role research, and months of meeting notes. The system was never designed for data growth.

**Consequences:** Skills degrade over time. After 2-3 months of use, `donna:next` cannot read all context and makes poor recommendations. `donna:begin-the-day` misses carried-forward tasks from files it could not load. The tool becomes less useful precisely when it should be most valuable (when the user has invested in it).

**Warning signs:**
- Skills that read more than 3-4 files to perform their function
- No date-windowing on which daily files to load
- `role-research.md` grows unbounded
- Meeting logs are stored in a single file rather than per-date

**Prevention:**
- **Read only what you need:** `begin-the-day` reads yesterday's file and `recurring.md`, not all historical files. `donna:next` reads today's file, not the full archive
- **Time-windowed reads:** Never read more than 3-7 days of daily files. Older history is available via git but not loaded by default
- **Bounded file sizes:** Standing files (`people.md`, `recurring.md`) should have a practical cap. If `people.md` exceeds ~200 lines, consider splitting
- **Summary files:** Periodically generate `weekly-summary.md` that compresses daily files into key points, allowing skills to read summaries instead of raw data
- **Lazy loading pattern:** Read the index/summary first, then load specific files only if needed

**Phase mapping:** Phase 1 (architecture). Design file structure and read patterns with growth in mind from day one. Retrofitting is painful.

---

### Pitfall 5: External CLI Integration Brittleness

**What goes wrong:** The skill invokes `jira issue list` or `gh issue list` and the CLI is not installed, not authenticated, returns unexpected output format, times out, or has changed its API between versions. The skill crashes or produces garbage.

**Why it happens:** External CLIs are not under your control. They update independently, have authentication that expires (OAuth tokens, API keys), and their output format is not guaranteed stable (especially human-readable output vs. JSON).

**Consequences:** The skill fails when the user needs it most (Monday morning standup prep). Worse, it fails silently: the Jira section shows nothing, and the user assumes they have no Jira tasks when really the CLI just timed out.

**Warning signs:**
- Parsing human-readable CLI output instead of JSON
- No timeout on external CLI calls
- No distinction between "no results" and "command failed"
- Authentication errors surfaced as raw stderr to the user

**Prevention:**
- **Always use JSON output:** `jira issue list --output json`, `gh issue list --json number,title,state`
- **Timeout everything:** 10-second timeout on external CLI calls. If it times out, report it clearly: "Jira data unavailable (timeout)"
- **Distinguish failure modes:** "No Jira tasks found" vs. "Jira CLI not configured" vs. "Jira authentication expired" -- each gets a different, human-readable message
- **Graceful degradation is not optional:** Every feature that touches an external CLI must have a fallback path that works without it. Test the no-CLI path as the primary path
- **Version-pin expectations:** Document which CLI versions you test against. Check `jira --version` and `gh --version` during `donna:setup` and warn if untested
- **Cache external data:** If Jira data was fetched successfully, cache it in the daily file. If the next invocation fails, show stale data with a "last fetched: 2h ago" note rather than nothing

**Phase mapping:** Phase 3 (integrations). Build the entire core system without external CLIs first. Integrations are enhancement, not foundation.

---

### Pitfall 6: Skill Complexity Creep

**What goes wrong:** Each skill starts simple but accumulates edge cases, configuration options, and "just one more feature" additions. `donna:begin-the-day` eventually handles timezone logic, holiday detection, sprint boundaries, integration with three different tools, and custom sorting -- becoming a 500-line prompt that is fragile and hard to modify.

**Why it happens:** The developer (or the user) keeps saying "it would be nice if..." without recognizing that each addition increases the surface area for bugs and makes the skill harder for Claude to execute reliably within a single context window.

**Consequences:** Skills become unreliable. Claude starts missing instructions buried in long prompts. Behavior becomes inconsistent. The developer spends more time debugging edge cases than building new capabilities.

**Warning signs:**
- A skill prompt exceeds ~150 lines
- A skill has more than 3 conditional branches ("if Jira configured, if GitHub configured, if recurring tasks exist, if yesterday had carryover...")
- Users report inconsistent behavior ("sometimes it shows my Jira tasks, sometimes it doesn't")
- The skill file requires reading more than 5 state files

**Prevention:**
- **One skill, one job:** `begin-the-day` surfaces tasks. It does not also reorganize priorities, archive old tasks, or sync with external tools. Those are separate skills
- **Compose, don't consolidate:** If `begin-the-day` needs Jira data, it calls a helper that fetches Jira data -- not inline Jira logic in the main prompt
- **Prompt size budget:** Set a hard limit (e.g., 100 lines) per skill prompt. If you exceed it, the skill is doing too much
- **Feature gates, not feature flags:** New capabilities are new skills, not conditionals in existing skills. `/donna:begin-the-day` vs `/donna:begin-the-day-with-jira` is better than one skill with 5 integration toggles (though ideally the Jira integration is transparent when configured and absent when not)

**Phase mapping:** Every phase. This is a discipline, not a one-time fix. Review skill complexity at each milestone.

---

## Moderate Pitfalls

### Pitfall 7: The "Second Day Problem"

**What goes wrong:** `donna:begin-the-day` works great on day one (clean slate). On day two, it needs to carry forward unfinished tasks from yesterday. The logic for determining what is "unfinished" is ambiguous. Checked-off tasks vs. unchecked, tasks that were deferred vs. abandoned, tasks added late in the day -- the carryforward logic gets messy fast.

**Prevention:**
- Define explicit task states: `[ ]` (open), `[x]` (done), `[>]` (deferred to tomorrow), `[-]` (dropped). Only `[ ]` items carry forward
- Carryforward happens at `begin-the-day` time, not end-of-day. This avoids requiring the user to "close out" their day
- Carried-forward tasks are marked with origin date: `(from 03-12)` so the user can see how long something has lingered
- After 3 days of carryforward, flag the task: "This has been carried forward 3 times. Complete, defer, or drop?"

**Phase mapping:** Phase 2 (daily workflow). Core to the daily experience.

---

### Pitfall 8: Role Research Becomes Noise

**What goes wrong:** `/donna:set-role` spawns a research agent that returns 50 generic responsibilities for "Engineering Manager." The user approves some, ignores most, and the recurring task list becomes bloated with tasks like "Review team velocity metrics" that sound good but don't match their actual workflow.

**Prevention:**
- Research agent should propose 5-7 high-confidence recurring tasks, not 20+
- Frame proposals as questions: "Do you do 1:1s with direct reports? How often?" rather than asserting "You should do 1:1s weekly"
- Include a "none of these" option. The user's role may be non-standard
- Make recurring tasks easy to remove later. The first set is a hypothesis, not a commitment
- Store the raw research separately (`role-research.md`) from the approved recurring tasks (`recurring.md`)

**Phase mapping:** Phase 2 (role setup). The research quality directly impacts recurring task usefulness.

---

### Pitfall 9: Git Commit Noise

**What goes wrong:** Every skill invocation creates a git commit. After a week, the repo has 50+ commits with messages like "Update 2026-03-13.md" that tell the user nothing. The git history becomes useless for understanding what changed and when.

**Prevention:**
- Meaningful commit messages: "Add task: Follow up with Sarah about API timeline" not "Update daily file"
- Batch commits where possible: if `begin-the-day` creates a new daily file AND updates recurring tasks, that is one commit, not two
- Consider squashing daily commits periodically (weekly?) into a single "Week of 2026-03-10" commit -- but only if the user opts in
- The commit is infrastructure, not a feature. Users should never have to think about git unless they want to

**Phase mapping:** Phase 1 (infrastructure). Git commit patterns are set early and painful to change.

---

### Pitfall 10: People File Becomes a Mess

**What goes wrong:** `donna:log-meeting` adds people to `people.md` every time they appear in a meeting. After a month, the file has 40 entries, many duplicated (name variations: "Sarah", "Sarah Chen", "sarah.chen@company.com"), with no useful context beyond "was in a meeting."

**Prevention:**
- Normalize names on capture. Ask once: "Is this Sarah Chen (sarah.chen@company.com)?" and store the canonical name
- People entries should include: name, relationship/context (e.g., "PM on Platform team"), last interaction date
- Do not add someone to `people.md` just because they attended a meeting. Only add them if the user has a follow-up action related to them
- Set a soft cap: if `people.md` exceeds 30 entries, prompt the user to prune stale contacts

**Phase mapping:** Phase 2 (meeting workflow). Design the people data model before building meeting logging.

---

## Minor Pitfalls

### Pitfall 11: Timezone and Date Boundary Issues

**What goes wrong:** The user invokes `begin-the-day` at 11pm (late work session) and the skill creates tomorrow's file, or at 1am and it creates today's file when they meant to continue yesterday's session.

**Prevention:**
- Use the system date but allow override: "Starting day for 2026-03-13" with a confirmation
- If invoked before 4am, ask: "Are you starting a new day or continuing yesterday?"
- Store timezone in `config.md` during setup

**Phase mapping:** Phase 2 (daily workflow).

---

### Pitfall 12: Markdown Format Bikeshedding

**What goes wrong:** Excessive time spent designing the "perfect" markdown schema for daily files, task format, recurring task definitions. The format changes three times in the first month, breaking existing data.

**Prevention:**
- Pick a format, document it, and commit to it for the entire first version. It does not need to be perfect
- Use the simplest possible structure: `- [ ] Task text (metadata)` for tasks, `## Section` for organization
- Design for human readability first, machine parseability second. Users will open these files in their editor
- If the format must change, write a migration skill that updates all existing files

**Phase mapping:** Phase 1 (architecture). Decide once, early.

---

### Pitfall 13: Over-Engineering the Recurring Task Engine

**What goes wrong:** The developer builds a full cron-like syntax for recurring tasks ("every 2nd Tuesday", "last Friday of month", "biweekly starting March 3"). The implementation is complex, buggy, and 90% of users only need "daily", "weekly on Monday", and "monthly."

**Prevention:**
- Start with three intervals: daily, weekly (pick a day), monthly (pick a date). That covers 90% of use cases
- Store as plain English in `recurring.md`: `- [ ] Refine backlog | weekly | Monday` -- no cron syntax
- Add complex scheduling only if users actually request it. YAGNI applies strongly here

**Phase mapping:** Phase 2 (recurring tasks). Ship simple, expand if needed.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| State architecture (Phase 1) | File structure that does not scale past 30 days | Design read patterns with time-windowing from the start |
| State architecture (Phase 1) | Markdown format changes breaking existing data | Commit to a format early; document it; include version field |
| Capture skills (Phase 1) | Too much friction to add a task | Single-argument capture, no required prompts |
| Git infrastructure (Phase 1) | Commit noise making history useless | Meaningful commit messages from day one |
| Daily workflow (Phase 2) | Morning routine overwhelms rather than helps | Strict output budget (40 lines max default view) |
| Daily workflow (Phase 2) | Carryforward logic ambiguity | Explicit task states: open/done/deferred/dropped |
| Role setup (Phase 2) | Research agent proposes too many generic tasks | Cap at 5-7 proposals, frame as questions |
| Meeting logging (Phase 2) | People data deduplication | Normalize names on first capture |
| External integrations (Phase 3) | CLI failures crash the skill | JSON output, timeouts, graceful degradation |
| External integrations (Phase 3) | Authentication expiry at worst time | Cache last-good data, clear error messages |
| All phases | Skill prompt complexity creep | 100-line prompt budget, one skill one job |
| All phases | Context window exhaustion | Lazy loading, time-windowed reads, summary files |

## Sources

- Domain knowledge: patterns observed across productivity tool design (Todoist, Things, Notion, Obsidian task management)
- Claude Code skill architecture: patterns from GSD skill suite design and Claude Code context window behavior
- Git-backed state management: common failure modes in flat-file/git-based personal knowledge management systems (Obsidian vaults, wiki.js, git-based note systems)
- Confidence: MEDIUM -- findings are consistent with well-documented patterns but web verification was unavailable during this research session
