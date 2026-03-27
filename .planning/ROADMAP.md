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
| 3. Role Awareness and Daily Rhythm | v1.0 | 2/2 | Complete   | 2026-03-21 |
| 3.1 Standing Files Subfolder | v1.0 | 4/4 | Complete | 2026-03-15 |
| 4. External Tool Enrichment | v1.0 | 1/2 | In Progress|  |

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
**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — Core skill: stub, workflow, installer registration, README entry
- [x] 03-02-PLAN.md — Test coverage for focus stub and workflow

### Phase 4: Ingest GitHub issues into GSD

**Goal:** Add internal skill to ingest GitHub issues into GSD — for each open issue without "ingested" label: classify, create TODOs with issue references, post comments, and apply labels. On release: check completed TODOs for issue provenance, post version comments, and close resolved issues with appropriate semantics. (ref: #21)
**Requirements**: INGEST-01 (skill file), INGEST-02 (batch ingestion flow), INGEST-03 (release-time script), INGEST-04 (PR commenting), INGEST-05 (release.yml integration), INGEST-06 (test coverage)
**Depends on:** Phase 3
**Plans:** 1/2 plans executed

Plans:
- [x] 04-01-PLAN.md — Ingestion skill: gsd-custom:ingest-issues command file + tests
- [x] 04-02-PLAN.md — Release-time closure: post-release-comments.cjs script + release.yml step + tests

### Phase 5: Fix the constant timeout warnings

**Goal:** Remove all `timeout` binary usage from Donna workflows and replace with the Bash tool's native timeout parameter for cross-platform compatibility (ref: #18)
**Requirements**: TBD
**Depends on:** Phase 4
**Plans:** 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — Remove timeout binary from workflows + update test assertions

### Phase 6: Polish and harden — version check, skip-setup guard, simplify adjust-tool, UAT merge gate, docs and README improvements, enhance tool learning, refactor skill bootstrap

**Goal:** Harden and polish the existing Donna skill suite: create donna-tools.cjs as a centralized CLI utility to eliminate bootstrap duplication across workflows, add a daily version check, suppress the setup prompt when already configured, simplify adjust-tool, add a UAT merge gate, improve README documentation, and enhance tool learning with cascading sources
**Requirements**: D-01 (daily version check), D-02 (non-blocking update hint), D-03 (version check in init), D-04 (skip-setup guard), D-05 (simplify adjust-tool), D-06 (UAT merge gate), D-07 (README skills grouping), D-08 (automation docs), D-09 (cascading tool learning), D-10 (donna-tools.cjs entry point), D-11 (donna-tools subcommands), D-12 (workflow bootstrap refactor)
**Depends on:** Phase 5
**Plans:** 5 plans

Plans:
- [ ] 06-01-PLAN.md — donna-tools.cjs: centralized CLI utility with init, commit, daily-path, resolve-secret subcommands + version check
- [ ] 06-02-PLAN.md — UAT merge gate, skip-setup guard, simplify adjust-tool
- [ ] 06-03-PLAN.md — README improvements: grouped skills list + automation docs
- [ ] 06-04-PLAN.md — Enhanced tool learning cascade in add-tool and relearn-tools
- [ ] 06-05-PLAN.md — Workflow bootstrap refactor: replace inline bootstrap with donna-tools calls in all 9 workflows
