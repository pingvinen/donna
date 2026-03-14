# Requirements: Donna

**Defined:** 2026-03-13
**Core Value:** Never forget an important task again — a personal assistant that knows your role, surfaces what needs attention each day, and captures everything that falls through the cracks outside your ticketing system.

## v1 Requirements

### Packaging & Distribution

- [x] **DIST-01**: Installer available as `npx donna-install` — detects installed providers (Claude Code initially), copies stubs to provider command directories and shared runtime to `~/.donna/`
- [x] **DIST-02**: `~/.donna/version.md` tracks installed version; installer shows changelog when upgrading
- [x] **DIST-03**: Migration system handles upgrades from any previous version to current — users may skip intermediate updates; migrations are cumulative (v1→v5 runs v1→v2, v2→v3, v3→v4, v4→v5)
- [x] **DIST-04**: Installer is idempotent and safe to re-run — preserves user state, only updates skill files and runtime
- [x] **DIST-05**: npm package contains stubs, workflows, templates, references, and installer script
- [x] **DIST-06**: `donna:setup` skill exists as a stub + workflow with a hello-world implementation (proves the full stub→workflow→execution pipeline)
- [x] **DIST-07**: PR validation workflow — GitHub Actions runs lint and verifies the package builds on every pull request
- [x] **DIST-08**: Release creation workflow — manually triggered GitHub Actions workflow determines version bump from conventional commit PR titles (semver 0.x.y while pre-stable), generates changelog, and creates a GitHub release
- [x] **DIST-09**: Deployment workflow — GitHub Actions reacts to a new GitHub release being created and publishes the package to npm

### Setup & Bootstrap

- [x] **SETUP-01**: User can run `/donna:setup` to configure the storage repo path, initialize the file structure, and store bootstrap config at `~/.config/donna/config.md`
- [x] **SETUP-02**: System creates and maintains bootstrap config (`~/.config/donna/config.md`) pointing to the storage repo — all other skills read this first

### Task Capture

- [ ] **TASK-01**: User can run `/donna:add-task <description>` to capture a task in a single command with no additional prompts — task is written to today's daily journal and committed immediately (< 10 seconds)
- [ ] **TASK-02**: User can mark a task as complete (done inline or via a skill invocation), updating the daily journal and committing the change

### Role Definition

- [ ] **ROLE-01**: User can run `/donna:set-role` to define their job role via interactive prompts
- [ ] **ROLE-02**: When setting role, a research agent is spawned to find what that role typically does day-to-day and what tools are commonly used (internet research), surfacing suggested recurring tasks and tools
- [ ] **ROLE-03**: Research findings, suggested recurring tasks, and suggested tools are presented for the user to approve, reject, or modify before being saved; approved tools prompt the user to run `/donna:add-tool`
- [ ] **ROLE-04**: Role definition is stored in `role.md` and research stored in `role-research.md` in the storage repo

### Daily Planning

- [ ] **DAILY-01**: User can run `/donna:begin-the-day` to receive a daily brief that carries forward all open tasks from the most recent previous daily file
- [ ] **DAILY-02**: `begin-the-day` surfaces recurring tasks that are due (based on role and approved recurring task list)
- [ ] **DAILY-03**: `begin-the-day` optionally pulls data from configured tools (e.g. assigned Jira tickets, GitHub PRs awaiting review) if the tool is declared and configured; gracefully skipped if not
- [ ] **DAILY-04**: `begin-the-day` is idempotent — safe to run multiple times in a day without duplicating tasks

### Tools Registry

- [ ] **TOOL-01**: User can run `/donna:add-tool` to declare a new tool via interactive prompts (name, CLI command, what tasks it helps with), after which Claude learns the tool by reading its help output and stores knowledge in `tools.md`
- [ ] **TOOL-02**: When adding a tool Claude already knows well, the learning step is skipped and knowledge is synthesized from training data instead
- [ ] **TOOL-03**: User can run `/donna:relearn-tools` to re-run the learning process for tools whose installed version has changed since last learned; tools at the same version are skipped

### Storage & Persistence

- [x] **STORE-01**: All state persists as markdown files in the user's configured git repo with a hybrid structure: daily journal files (`daily/YYYY-MM-DD.md`) plus standing files (`role.md`, `role-research.md`, `recurring.md`, `tools.md`, `config.md`, `people.md`)
- [ ] **STORE-02**: Every skill commits its changes to git immediately after writing, so state survives context resets
- [ ] **STORE-03**: Skills read only the files they need (not the full repo) to avoid context window exhaustion as the repo grows over time

## v2 Requirements

### Meeting Capture

- **MEET-01**: User can run `/donna:log-meeting` to capture meeting participants, decisions made, and follow-ups committed to
- **MEET-02**: Follow-ups from meetings are linked to people and stored in `people.md` for 1:1 follow-up tracking

### Triage

- **TRIAGE-01**: User can run `/donna:next` to get an AI-reasoned recommendation of what to work on right now, given all open tasks, recurring tasks due, and configured tool data

### Recurring Tasks (Advanced)

- **RECUR-01**: User can define recurring tasks with a named interval (e.g. "refine backlog — every Monday") stored in `recurring.md`
- **RECUR-02**: `begin-the-day` surfaces recurring tasks whose interval has elapsed since last completion

### Review

- **REVIEW-01**: User can run `/donna:end-the-day` to close out the day, mark remaining tasks as carried forward, and add notes on blockers

## Cross-Cutting Constraints

- **Obsidian compatibility**: All Donna runtime files (`~/.donna/`, storage repo) must use plain markdown with YAML frontmatter in a standard folder structure. Users should be able to open these directories as Obsidian vaults for a free human-friendly UI. No proprietary formats. Daily files should stay in a flat folder (Obsidian Calendar plugin is folder-sensitive). Archiving older daily files to subfolders is acceptable but may affect calendar views — design with this trade-off in mind.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Push notifications / reminders | Pull model only — user invokes skills; no daemon or scheduler |
| Web UI or mobile app | Claude Code terminal only |
| Natural language date parsing ("next Tuesday") | Adds complexity; explicit intervals are simpler and more reliable |
| Replacing Jira / project management hierarchies | Complements ticketing systems, doesn't compete |
| Real-time sync | Git commits are the sync mechanism; eventual consistency is fine |
| Hardcoded tool integrations | All integrations go through the tools registry (`/donna:add-tool`) |
| Multi-provider support beyond Claude Code | LOW confidence on other providers' `@` resolution; Claude Code first, others later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DIST-01 | Phase 1 | Complete |
| DIST-02 | Phase 1 | Complete |
| DIST-03 | Phase 1 | Complete |
| DIST-04 | Phase 1 | Complete |
| DIST-05 | Phase 1 | Complete |
| DIST-06 | Phase 1 | Complete |
| DIST-07 | Phase 1 | Complete |
| DIST-08 | Phase 1 | Complete |
| DIST-09 | Phase 1 | Complete |
| SETUP-01 | Phase 2 | Complete |
| SETUP-02 | Phase 2 | Complete |
| TASK-01 | Phase 2 | Pending |
| TASK-02 | Phase 2 | Pending |
| STORE-01 | Phase 2 | Complete |
| STORE-02 | Phase 2 | Pending |
| ROLE-01 | Phase 3 | Pending |
| ROLE-02 | Phase 3 | Pending |
| ROLE-03 | Phase 3 | Pending |
| ROLE-04 | Phase 3 | Pending |
| DAILY-01 | Phase 3 | Pending |
| DAILY-02 | Phase 3 | Pending |
| DAILY-04 | Phase 3 | Pending |
| STORE-03 | Phase 3 | Pending |
| TOOL-01 | Phase 4 | Pending |
| TOOL-02 | Phase 4 | Pending |
| TOOL-03 | Phase 4 | Pending |
| DAILY-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-03-13*
*Last updated: 2026-03-13 after roadmap restructure (added distribution phase, dropped log-meeting/next to v2)*
