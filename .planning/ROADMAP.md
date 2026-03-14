# Roadmap: Donna

## Overview

This project delivers Donna, a suite of AI coding assistant slash commands that act as a personal assistant for professionals. The build follows a distribution-first strategy: establish the packaging pipeline with a stub skill (Phase 1), then build capture and storage (Phase 2), layer on role-aware daily planning (Phase 3), then enrich with external tool integrations (Phase 4). Every phase produces distributable artifacts — nothing is useful unless it can be installed.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Packaging and Distribution** - npm package, installer, stub donna:setup skill, version tracking, migration system, CI/CD pipeline
- [ ] **Phase 2: Foundation and Capture** - Real donna:setup, add-task, task completion, hybrid storage, git persistence
- [ ] **Phase 3: Role Awareness and Daily Rhythm** - Role definition with research agent, morning ritual, carry-forward, recurring tasks
- [ ] **Phase 4: External Tool Enrichment** - Tool registry skills and external data surfaced in the daily brief

## Phase Details

### Phase 1: Packaging and Distribution
**Goal**: Anyone can run `npx @pingvinen/donna-assistant` and get a working (stub) donna:setup skill in Claude Code, with version tracking and a migration system that handles upgrades from any previous version
**Depends on**: Nothing (first phase)
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04, DIST-05, DIST-06, DIST-07, DIST-08, DIST-09
**Success Criteria** (what must be TRUE):
  1. Running `npx @pingvinen/donna-assistant` on a machine with Claude Code copies the donna:setup stub to `~/.claude/commands/donna/` and shared runtime to `~/.donna/`
  2. Running `/donna:setup` in Claude Code loads the workflow from `~/.donna/workflows/setup.md` and produces a hello-world response (proving stub->workflow->execution pipeline)
  3. `~/.donna/version.md` exists after install and contains the installed version
  4. Running `npx @pingvinen/donna-assistant` again on a machine with an older version upgrades correctly, running all necessary migrations
  5. Running `npx @pingvinen/donna-assistant` on an already-current machine is a safe no-op (idempotent)
  6. PRs trigger a GitHub Actions workflow that lints and verifies the package builds
  7. A manually triggered workflow determines version bump from conventional commit PR titles, creates a GitHub release with changelog (using 0.x.y semver)
  8. Creating a GitHub release triggers a deployment workflow that publishes the package to npm
**Plans**: TBD

### Phase 2: Foundation and Capture
**Goal**: User can set up the assistant, capture tasks instantly, mark them done, and trust that everything persists in git
**Depends on**: Phase 1
**Requirements**: SETUP-01, SETUP-02, TASK-01, TASK-02, STORE-01, STORE-02
**Success Criteria** (what must be TRUE):
  1. User can run `/donna:setup` from any directory and end up with a configured storage repo, initialized file structure, and bootstrap config at `~/.config/donna/config.md`
  2. User can run `/donna:add-task buy milk` and see it appear in today's daily journal file, committed to git, in under 10 seconds
  3. User can mark a task as complete and see the change reflected in the daily journal and committed to git
  4. All state files follow the hybrid structure (daily journals + standing files) and every skill invocation results in a git commit
  5. `donna:add-task` creates today's daily file if it doesn't exist (doesn't require begin-the-day first)
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Role Awareness and Daily Rhythm
**Goal**: User has a complete daily workflow — define their role, get role-grounded recurring task suggestions, and run a morning ritual that carries forward open tasks and surfaces what is due
**Depends on**: Phase 2
**Requirements**: ROLE-01, ROLE-02, ROLE-03, ROLE-04, DAILY-01, DAILY-02, DAILY-04, STORE-03
**Success Criteria** (what must be TRUE):
  1. User can run `/donna:set-role` to define their job role and receive researched recurring task suggestions that they can approve, reject, or modify before anything is saved
  2. Role definition persists in `role.md` and research findings persist in `role-research.md` in the storage repo
  3. User can run `/donna:begin-the-day` and see a concise daily brief (~40 lines max) that includes all open tasks carried forward from the most recent previous daily file plus any recurring tasks due today
  4. Running `/donna:begin-the-day` multiple times in the same day does not duplicate tasks or corrupt the daily journal
  5. Skills read only the files they need, not the full repo, so the system remains performant as daily files accumulate
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: External Tool Enrichment
**Goal**: User can declare external CLI tools (GitHub CLI, Jira CLI) and have their data surfaced automatically in the morning ritual
**Depends on**: Phase 3
**Requirements**: TOOL-01, TOOL-02, TOOL-03, DAILY-03
**Success Criteria** (what must be TRUE):
  1. User can run `/donna:add-tool` to declare an external CLI tool, and Claude learns that tool's capabilities by reading its help output (or from training data for well-known tools), storing the knowledge in `tools.md`
  2. User can run `/donna:relearn-tools` and only tools whose version has changed are re-learned; unchanged tools are skipped
  3. When external tools are configured, `/donna:begin-the-day` pulls relevant data (e.g. assigned Jira tickets, GitHub PRs awaiting review) and includes it in the daily brief
  4. When no external tools are configured, `/donna:begin-the-day` works exactly as before with no errors or degradation
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Packaging and Distribution | 1/3 | In Progress | - |
| 2. Foundation and Capture | 0/0 | Not started | - |
| 3. Role Awareness and Daily Rhythm | 0/0 | Not started | - |
| 4. External Tool Enrichment | 0/0 | Not started | - |
