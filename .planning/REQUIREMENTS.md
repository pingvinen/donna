# Requirements: Personal Assistant Skills

**Defined:** 2026-03-13
**Core Value:** Never forget an important task again — a personal assistant that knows your role, surfaces what needs attention each day, and captures everything that falls through the cracks outside your ticketing system.

## v1 Requirements

### Setup & Bootstrap

- [ ] **SETUP-01**: User can run `/donna:setup` to configure the storage repo path, initialize the file structure, and declare which external tools are available
- [ ] **SETUP-02**: System creates and maintains a well-known bootstrap config (`~/.config/donna/config.md`) pointing to the storage repo — all other skills read this first

### Tools Registry

- [ ] **TOOL-01**: User can run `/donna:add-tool` to declare a new tool via interactive prompts (name, CLI command, what tasks it helps with), after which Claude learns the tool by reading its help output and stores knowledge in `tools.md`
- [ ] **TOOL-02**: When adding a tool Claude already knows well, the learning step is skipped and knowledge is synthesized from training data instead
- [ ] **TOOL-03**: User can run `/donna:relearn-tools` to re-run the learning process for tools whose installed version has changed since last learned; tools at the same version are skipped

### Role Definition

- [ ] **ROLE-01**: User can run `/donna:set-role` to define their job role via interactive prompts
- [ ] **ROLE-02**: When setting role, a research agent is spawned to find what that role typically does day-to-day (internet research), surfacing suggested recurring tasks
- [ ] **ROLE-03**: Research findings and suggested recurring tasks are presented for the user to approve, reject, or modify before being saved
- [ ] **ROLE-04**: Role definition is stored in `role.md` and research stored in `role-research.md` in the storage repo

### Task Capture

- [ ] **TASK-01**: User can run `/donna:add-task <description>` to capture a task in a single command with no additional prompts — task is written to today's daily journal and committed immediately
- [ ] **TASK-02**: User can mark a task as complete (done inline or via a skill invocation), updating the daily journal and committing the change

### Daily Planning

- [ ] **DAILY-01**: User can run `/donna:begin-the-day` to receive a daily brief that carries forward all open tasks from previous days
- [ ] **DAILY-02**: `begin-the-day` surfaces recurring tasks that are due (based on role and approved recurring task list)
- [ ] **DAILY-03**: `begin-the-day` optionally pulls data from configured tools (e.g. assigned Jira tickets, GitHub PRs awaiting review) if the tool is declared and configured; gracefully skipped if not
- [ ] **DAILY-04**: `begin-the-day` is idempotent — safe to run multiple times in a day without duplicating tasks

### Storage & Persistence

- [ ] **STORE-01**: All state persists as markdown files in the user's configured git repo with a hybrid structure: daily journal files (`daily/YYYY-MM-DD.md`) plus standing files (`role.md`, `role-research.md`, `recurring.md`, `tools.md`, `config.md`, `people.md`)
- [ ] **STORE-02**: Every skill commits its changes to git immediately after writing, so state survives context resets
- [ ] **STORE-03**: Skills read only the files they need (not the full repo) to avoid context window exhaustion as the repo grows over time

## v2 Requirements

### Recurring Tasks

- **RECUR-01**: User can define recurring tasks with a named interval (e.g. "refine backlog — every Monday") stored in `recurring.md`
- **RECUR-02**: `begin-the-day` surfaces recurring tasks whose interval has elapsed since last completion

### Meeting Capture

- **MEET-01**: User can run `/donna:log-meeting` to capture meeting participants, decisions made, and follow-ups committed to
- **MEET-02**: Follow-ups from meetings are linked to people and stored in `people.md` for 1:1 follow-up tracking

### Triage

- **TRIAGE-01**: User can run `/donna:next` to get an AI-reasoned recommendation of what to work on right now, given all open tasks, recurring tasks due, and configured tool data

### Review

- **REVIEW-01**: User can run `/donna:end-the-day` to close out the day, mark remaining tasks as carried forward, and add notes on blockers

## Out of Scope

| Feature | Reason |
|---------|--------|
| Push notifications / reminders | Pull model only — user invokes skills; no daemon or scheduler |
| Web UI or mobile app | Claude Code terminal only |
| Natural language date parsing ("next Tuesday") | Adds complexity; explicit intervals are simpler and more reliable |
| Replacing Jira / project management hierarchies | Complements ticketing systems, doesn't compete |
| Real-time sync | Git commits are the sync mechanism; eventual consistency is fine |
| Hardcoded tool integrations | All integrations go through the tools registry (`/donna:add-tool`) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SETUP-01 | Phase 1 | Pending |
| SETUP-02 | Phase 1 | Pending |
| TASK-01 | Phase 1 | Pending |
| TASK-02 | Phase 1 | Pending |
| STORE-01 | Phase 1 | Pending |
| STORE-02 | Phase 1 | Pending |
| ROLE-01 | Phase 2 | Pending |
| ROLE-02 | Phase 2 | Pending |
| ROLE-03 | Phase 2 | Pending |
| ROLE-04 | Phase 2 | Pending |
| DAILY-01 | Phase 2 | Pending |
| DAILY-02 | Phase 2 | Pending |
| DAILY-04 | Phase 2 | Pending |
| STORE-03 | Phase 2 | Pending |
| TOOL-01 | Phase 3 | Pending |
| TOOL-02 | Phase 3 | Pending |
| TOOL-03 | Phase 3 | Pending |
| DAILY-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap creation*
