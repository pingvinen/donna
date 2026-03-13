# Roadmap: Personal Assistant Skills

## Overview

This project delivers a suite of Claude Code slash commands that act as a personal assistant for professionals. The build follows a capture-first strategy: establish the storage foundation and task capture habit (Phase 1), layer on role-aware daily planning (Phase 2), then enrich with optional external tool integrations (Phase 3). Each phase delivers a complete, usable capability -- the system is valuable from the end of Phase 1.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation and Capture** - Setup, storage, task capture -- the daily-driver loop of adding and completing tasks
- [ ] **Phase 2: Role Awareness and Daily Rhythm** - Role definition with research agent, morning ritual, carry-forward, recurring tasks
- [ ] **Phase 3: External Tool Enrichment** - Tool registry skills and external data (Jira, GitHub) surfaced in the daily brief

## Phase Details

### Phase 1: Foundation and Capture
**Goal**: User can set up the assistant, capture tasks instantly, mark them done, and trust that everything persists in git
**Depends on**: Nothing (first phase)
**Requirements**: SETUP-01, SETUP-02, TASK-01, TASK-02, STORE-01, STORE-02
**Success Criteria** (what must be TRUE):
  1. User can run `/pa:setup` from any directory and end up with a configured storage repo, initialized file structure, and a bootstrap config at the well-known path
  2. User can run `/pa:add-task buy milk` and see it appear in today's daily journal file, committed to git, in under 10 seconds
  3. User can mark a task as complete and see the change reflected in the daily journal and committed to git
  4. All state files follow the hybrid structure (daily journals + standing files) and every skill invocation results in a git commit
**Plans**: TBD

Plans:
- [ ] 01-01: TBD
- [ ] 01-02: TBD

### Phase 2: Role Awareness and Daily Rhythm
**Goal**: User has a complete daily workflow -- define their role, get role-grounded recurring task suggestions, and run a morning ritual that carries forward open tasks and surfaces what is due
**Depends on**: Phase 1
**Requirements**: ROLE-01, ROLE-02, ROLE-03, ROLE-04, DAILY-01, DAILY-02, DAILY-04, STORE-03
**Success Criteria** (what must be TRUE):
  1. User can run `/pa:set-role` to define their job role and receive researched recurring task suggestions that they can approve, reject, or modify before anything is saved
  2. Role definition persists in `role.md` and research findings persist in `role-research.md` in the storage repo
  3. User can run `/pa:begin-the-day` and see a concise daily brief that includes all open tasks carried forward from previous days plus any recurring tasks due today
  4. Running `/pa:begin-the-day` multiple times in the same day does not duplicate tasks or corrupt the daily journal
  5. Skills read only the files they need, not the full repo, so the system remains performant as daily files accumulate over weeks and months
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: External Tool Enrichment
**Goal**: User can declare external CLI tools (GitHub CLI, Jira CLI) and have their data surfaced automatically in the morning ritual
**Depends on**: Phase 2
**Requirements**: TOOL-01, TOOL-02, TOOL-03, DAILY-03
**Success Criteria** (what must be TRUE):
  1. User can run `/pa:add-tool` to declare an external CLI tool, and Claude learns that tool's capabilities by reading its help output (or from training data for well-known tools), storing the knowledge in `tools.md`
  2. User can run `/pa:relearn-tools` and only tools whose version has changed are re-learned; unchanged tools are skipped
  3. When external tools are configured, `/pa:begin-the-day` pulls relevant data (e.g. assigned Jira tickets, GitHub PRs awaiting review) and includes it in the daily brief
  4. When no external tools are configured, `/pa:begin-the-day` works exactly as before with no errors or degradation
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation and Capture | 0/0 | Not started | - |
| 2. Role Awareness and Daily Rhythm | 0/0 | Not started | - |
| 3. External Tool Enrichment | 0/0 | Not started | - |
