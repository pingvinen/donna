# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-03-16
**Phases:** 5 | **Plans:** 14 | **Commits:** 80

### What Was Built
- npm package with installer, version tracking, cumulative migration system, and CI/CD pipeline (PR validation, release creation, OIDC npm publish)
- 8 skills: setup, set-role, add-task, done, begin-the-day, add-tool, relearn-tools, refresh-tools
- Hybrid storage (daily journals + standing files in donna/ subfolder) with git-backed persistence
- Role-aware daily planning with web research agent and carry-forward
- External tool registry with auto-learning and daily brief integration

### What Worked
- Distribution-first strategy paid off — CI/CD issues caught early, every subsequent phase shipped through a proven pipeline
- Stub-workflow split pattern made skills easy to add incrementally
- TDD anchor pattern (one test per plan) kept quality consistent
- Phase 3.1 insertion (standing files subfolder) handled cleanly with decimal numbering
- 4-day timeline from init to shipped MVP — aggressive but achievable scope

### What Was Inefficient
- ROADMAP.md progress table got out of sync with actual completion — Phase 1 showed "2/3" and Phase 2 showed "0/2" even though all were complete
- SUMMARY.md frontmatter `requirements_completed` was inconsistently filled across phases — metadata gap caught only at audit
- Phase 3.1 required 4 plans for what was essentially a file-move migration — could have been 2

### Patterns Established
- check-pending-migrations step: character-for-character identical block across all workflows for future migration compatibility
- Carry-forward counter pattern: "(N times)" suffix for visible task urgency
- Tool-tagged tasks: `[tool](url)` suffix preserved on completion for traceability
- Smart merge for refresh-tools: embedded URL as stable identifier with 4-rule resolution

### Key Lessons
1. Keep ROADMAP.md progress table updated after every phase — stale data creates confusion at milestone time
2. SUMMARY frontmatter should be validated as part of phase completion, not discovered at audit
3. Standing files belong in a subfolder from the start — retrofitting required a 4-plan phase insertion
4. The audit step before milestone completion is valuable — it caught real gaps (set-role → add-tool handoff) that would have been invisible otherwise

### Cost Observations
- Model mix: predominantly opus for execution, sonnet/haiku for subagents (research, exploration)
- Sessions: ~10 across 4 days
- Notable: parallel subagent execution in Phase 1 and Phase 4 research saved significant wall-clock time

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Commits | Phases | Key Change |
|-----------|---------|--------|------------|
| v1.0 | 80 | 5 | First milestone — established all patterns |

### Cumulative Quality

| Milestone | Tests | Audit Score | Known Gaps |
|-----------|-------|-------------|------------|
| v1.0 | 71+ | 31/31 reqs | 3 (all non-blocking) |

### Top Lessons (Verified Across Milestones)

1. Distribution-first development catches integration issues early
2. Audit before milestone completion catches gaps invisible during development
