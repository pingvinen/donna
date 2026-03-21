# Roadmap: Donna

## Milestones

- ✅ **v1.0 MVP** — Phases 1-4 (shipped 2026-03-16)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-4) — SHIPPED 2026-03-16</summary>

- [x] Phase 1: Packaging and Distribution (3/3 plans) — completed 2026-03-14
- [x] Phase 2: Foundation and Capture (2/2 plans) — completed 2026-03-14
- [x] Phase 3: Role Awareness and Daily Rhythm (2/2 plans) — completed 2026-03-15
- [x] Phase 3.1: Standing Files Subfolder (4/4 plans) — completed 2026-03-15
- [x] Phase 4: External Tool Enrichment (3/3 plans) — completed 2026-03-15

See: `.planning/milestones/v1.0-ROADMAP.md` for full details.

</details>

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Packaging and Distribution | 4/4 | Complete   | 2026-03-16 | 2026-03-14 |
| 2. Foundation and Capture | 4/4 | Complete   | 2026-03-16 | 2026-03-14 |
| 3. Role Awareness and Daily Rhythm | v1.0 | 1/2 | In Progress|  |
| 3.1 Standing Files Subfolder | v1.0 | 4/4 | Complete | 2026-03-15 |
| 4. External Tool Enrichment | v1.0 | 3/3 | Complete | 2026-03-15 |

### Phase 1: Low-hanging documentation stuff for users and alpha testers

**Goal:** Add developer documentation (CONTRIBUTING.md), human-friendly upgrade changelog in the installer, and two new skills (donna:help for troubleshooting, donna:contribute-idea for feedback via GitHub Issues)
**Requirements**: DOC-01 (CONTRIBUTING.md), DOC-02 (installer changelog), DOC-03 (donna:help skill), DOC-04 (donna:contribute-idea skill)
**Depends on:** Phase 0
**Plans:** 4/4 plans complete

Plans:
- [x] 01-01-PLAN.md — CONTRIBUTING.md and installer changelog system
- [x] 01-02-PLAN.md — donna:help and donna:contribute-idea skills (stubs + workflows)
- [x] 01-03-PLAN.md — Integration wiring (README, installer skill list, test coverage)
- [ ] 01-04-PLAN.md — Gap closure: GSD workflow in CONTRIBUTING.md + populate 0.5.0 changelog

### Phase 2: Tool System Enhancements

**Goal:** Expand the tool system — parallelize tool capability commands for faster data pulls, add an adjust-tool skill for iterative tool configuration refinement, and support non-CLI tools (APIs and MCP servers)
**Requirements**: TOOL-01 (parallel execution), TOOL-02 (type field + migration), TOOL-03 (REST API support), TOOL-04 (GraphQL API support), TOOL-05 (MCP server support), TOOL-06 (secrets.md), TOOL-07 (adjust-tool skill), TOOL-08 (installer + tests)
**Depends on:** Phase 1
**Plans:** 6 plans (4 complete + 2 gap closure)

Plans:
- [x] 02-01-PLAN.md — Schema foundation: migration 003 + type field backfill handler in workflows
- [x] 02-02-PLAN.md — adjust-tool skill: stub, workflow, installer registration, tests
- [x] 02-03-PLAN.md — Non-CLI tool registration: REST/GraphQL/MCP in add-tool + secrets.md
- [x] 02-04-PLAN.md — Parallel execution + type-aware runtime in begin-the-day/run-tools + README
- [x] 02-05-PLAN.md — Gap closure: smart backfill heuristics + add-tool URL entry UX fix
- [x] 02-06-PLAN.md — Gap closure: GraphQL introspection in relearn-tools + adjust-tool format repair

### Phase 3: Prioritized now view — distill daily file to focus items

**Goal:** Add a `/donna:focus` skill that reads today's daily file, enriches items by re-querying relevant tools, and produces a short prioritized summary of the most important items to focus on right now
**Requirements**: FOCUS-01 (stub), FOCUS-02 (workflow), FOCUS-03 (parse open tasks), FOCUS-04 (text-analysis signals), FOCUS-05 (tool enrichment), FOCUS-06 (dynamic focus list), FOCUS-07 (focus.md output), FOCUS-08 (terminal output), FOCUS-09 (installer), FOCUS-10 (README), FOCUS-11 (tests)
**Depends on:** Phase 2
**Plans:** 1/2 plans executed

Plans:
- [x] 03-01-PLAN.md — Core skill: stub, workflow, installer registration, README entry
- [ ] 03-02-PLAN.md — Test coverage for focus stub and workflow

## Backlog

### Phase 999.1: Tool system architecture evolution (BACKLOG)

**Goal:** Store GraphQL schemas for real diff-based relearn, restructure tools data format (per-tool files or richer YAML instead of flat markdown), and run each tool in its own agent with clean context during run-tools/begin-the-day
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd:review-backlog when ready)
