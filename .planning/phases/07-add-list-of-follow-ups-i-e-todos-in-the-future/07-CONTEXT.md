# Phase 7: Add list of follow-ups i.e. todos in the future - Context

**Gathered:** 2026-06-17
**Status:** Ready for planning
**Source:** Issue #37

<domain>
## Phase Boundary

Add a follow-up system that lets the user schedule tasks for a future date. The user can tell Donna "remind me to do X in 2 months" or "remind me to do X on 2026-09-15". When Donna begins the day, due follow-ups are surfaced in the daily Tasks section and removed from the standing file. This complements the existing recurring task system (recurring.md) with a separate, date-specific follow-up mechanism.

</domain>

<decisions>
## Implementation Decisions

### File structure
- **D-01:** Follow-ups are stored in a new standing file: `donna/follow-ups.md`. This is separate from `donna/recurring.md` — recurring tasks use intervals, follow-ups use concrete dates. The two systems serve different purposes and have different parsing logic. Separate files keep each simple.

### Entry format
- **D-02:** Follow-up entries use the format: `- [ ] <description> | due: YYYY-MM-DD`. The date is always stored as a concrete ISO date. Natural language relative dates ("in 2 months", "in 3 weeks") are resolved to YYYY-MM-DD by the capture skill before writing to the file. No runtime relative-date parsing is needed — the standing file always contains resolved dates.
- **D-03:** When begin-the-day runs, it reads follow-ups.md and surfaces any items where `due <= today`. The item is appended to the `## Tasks` section in today's daily file as a regular `- [ ]` task. The item is then **removed** (not checked off) from follow-ups.md. The daily file now owns the task — carry-forward is handled by the existing begin-the-day mechanism if the task is not completed.

### Capture UX
- **D-04:** A new `/donna:follow-up` skill handles capture. The user writes something like `/donna:follow-up remind team about Q3 planning in 2 months`. The skill parses the description and time expression from the argument, resolves relative dates to YYYY-MM-DD (using node.js Date arithmetic), and appends the entry to `donna/follow-ups.md`. If no time expression is provided, `due` defaults to today. If no argument is provided, the skill asks for the task description and due date interactively.
- **D-05:** The skill writes to `donna/follow-ups.md` and commits the change via `donna-tools commit`. The file is created with YAML frontmatter and a `## Follow-ups` heading if it does not exist.

### Daily surfacing
- **D-06:** begin-the-day reads `donna/follow-ups.md` (alongside its existing read of `recurring.md`). Items with `due <= today` are appended to the daily `## Tasks` section in the same format as regular tasks (just the description, without the `| due:` suffix). Past-due items (where `due < today`) are surfaced with a `(overdue N days)` annotation appended to the task line. The items are then removed from follow-ups.md. This step runs **after** carry-forward and recurring-tasks processing, **before** tool data pull and deduplication — follow-up tasks are not special once they're on the daily file.
- **D-07:** The begin-the-day `git-commit` step includes follow-ups.md in its commit (when items were surfaced and the file was modified).

### Test coverage
- **D-08:** Tests cover: date resolution ("in 2 months" → correct YYYY-MM-DD), follow-ups.md file creation, entry parsing (`| due:` extraction), overdue annotation, and integration with begin-the-day (surfacing + removal).

### the agent's Discretion
- Exact error handling for unparseable time expressions
- Whether `donna/follow-ups.md` uses frontmatter (`---` block) or a simple heading
- Implementation details of the relative-date resolver (pure node.js, no external dependencies)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core system files
- `workflows/begin-the-day.md` — Current daily workflow; follow-up surfacing integrates at the recurring-tasks stage (step 6)
- `workflows/add-task.md` — Existing task capture; `/donna:follow-up` follows the same pattern (init, capture, write, commit)
- `workflows/done.md` — Task completion; follow-up items become regular daily tasks and must work with done
- `donna/recurring.md` (in storage repo, optional) — Existing recurring task format for reference; follow-ups.md follows a similar line-oriented format

### Bootstrap and tooling
- `src/donna-tools.cjs` — Centralized CLI; the follow-up skill uses `donna-tools init` and `donna-tools commit`
- `src/stubs/` — Stub template directory; new skill stub goes here
- `src/installer.cjs` — Installer; must register the new skill

### GitHub Issues
- Issue #37 — "Add list of follow-ups i.e. todos in the future" — the primary requirement source

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/add-task.md` — The capture pattern (init → get-input → ensure-file → append → commit → confirm) is directly reusable for `/donna:follow-up`. The follow-up skill adds date parsing but follows the same flow.
- `workflows/begin-the-day.md` §check-recurring — The recurring-task reading and parsing pattern mirrors follow-up reading. Both read a standing file, parse line-oriented entries, and produce task descriptions for the daily file.
- `src/donna-tools.cjs` — `init` and `commit` subcommands replace the bootstrap boilerplate in the new workflow.

### Established Patterns
- **Stub + workflow split:** The new skill needs a stub (src/stubs/ or src/providers/) and a workflow (workflows/follow-up.md). Follow existing Donna skill conventions.
- **Line-oriented standing files:** `donna/recurring.md` uses `- <description>: <interval>` format. `donna/tools.md` uses `## <name>` sections. `donna/follow-ups.md` follows with `- [ ] <description> | due: YYYY-MM-DD` — checkbox for Obsidian compatibility, pipe-separated metadata for parsing.
- **donna-tools commit:** All skills use `node ~/.donna/donna-tools.cjs commit` for git operations. Follow the identical pattern.

### Integration Points
- **begin-the-day §check-recurring:** Follow-up reading inserts a new step between recurring-task processing and tool-data pull. It reads follow-ups.md, filters by `due <= today`, appends matches to the task accumulator, and removes matched lines from the file.
- **Installer:** The new skill must be registered in `installer.cjs` following the existing skill registration pattern (stub copy + provider write).
- **README.md:** The new skill must be added to the skills list.

</code_context>

<specifics>
## Specific Ideas

- User explicitly wants follow-ups removed from the standing file when surfaced — not checked off, not left with a marker. The daily file becomes the sole owner of the task from that point forward.
- Relative date resolution happens at capture time, not at surfacing time. This keeps follow-ups.md clean and the runtime parsing simple.
- Follow-ups are surfaced in the same `## Tasks` section as everything else — no separate section. The user didn't want "a separate task list" and preferred integration with the existing flow.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-add-list-of-follow-ups-i-e-todos-in-the-future*
*Context gathered: 2026-06-17 via discuss-phase*