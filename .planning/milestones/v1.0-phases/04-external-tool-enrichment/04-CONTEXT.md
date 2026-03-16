# Phase 4: External Tool Enrichment - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Declare external CLI tools, teach Donna about them, and surface their data in the daily brief. Delivers: `donna:add-tool` (declare and learn tools), `donna:relearn-tools` (version-aware re-learning), `donna:refresh-tools` (mid-day tool data refresh), tool data integration in `begin-the-day`, and `tools.md` standing file. Hardcoded integrations are out of scope — all tools go through the registry.

</domain>

<decisions>
## Implementation Decisions

### Tool learning approach
- Capabilities map stored in tools.md — what the tool CAN DO for Donna (e.g. "gh — can list assigned PRs, show review requests, list issues"), not a full CLI reference
- Training data as baseline for well-known tools (gh, jira, kubectl), augmented by CLI help parsing only when the installed version is newer than what Claude was trained on
- Version stored at learn time; relearn compares stored version vs `tool --version` output
- Single tools.md file with sections per tool (consistent with role.md, recurring.md pattern)

### Tool declaration flow (donna:add-tool)
- Minimum input: just the tool name (e.g. "gh"). Claude resolves the CLI command, verifies installation (`which`), learns capabilities
- Pre-fill from set-role notes: if set-role noted tools (e.g. "Jira (sprint management)"), add-tool recognizes them and pre-fills context, skipping redundant questions
- User selects relevant capabilities from a pre-filled list (sensible defaults checked) with option for write-ins
- Batch mode: if set-role noted multiple tools, add-tool offers to configure all noted tools in one session
- Verification during add-tool: run `which <command>`, `<command> --version`, and a simple auth test query. Warn if not installed but allow saving
- Auth validation at add time (e.g. `gh api user`) — catch auth problems early with clear fix instructions

### Data pulling in daily brief
- Tool tasks appear in a single "## From Tools" section in the daily file, below manual tasks
- Each task tagged with source: `- [ ] Review PR #42 [gh](https://github.com/...)`
- Always include clickable URL when the tool provides an external ID (PR number, ticket ID)
- Sensible defaults per tool for what data to pull (e.g. gh: assigned PRs + review requests), but user selects from a pre-filled capabilities list during add-tool with option for write-ins

### Dynamic task refresh
- Tool-sourced tasks are living data — they change throughout the day as tickets get reassigned, PRs get merged, etc.
- Two refresh mechanisms:
  1. `begin-the-day` always refreshes tool data as part of the morning ritual
  2. `donna:refresh-tools` — standalone skill for mid-day updates without the full carry-forward/recurring logic
- Smart merge on refresh:
  - Tool says done/closed/merged → auto-mark [x] with reason
  - User manually checked [x] but tool says open → keep [x] (user's local state wins)
  - Tool removed task entirely (reassigned, closed) → move to a "## Resolved" section at bottom of daily file with reason
  - New tasks from tool → add to "## From Tools" section

### Failure and graceful degradation
- Skip and warn on failure: if a tool fails during daily brief (auth error, CLI not found, timeout), skip it with a warning line (e.g. "! gh: authentication failed — run `gh auth login`"), continue with other tools
- No retry — fail fast per tool, don't delay the brief
- When no tools are configured, begin-the-day works exactly as before with no errors or degradation
- Tool failures never block manual tasks, carry-forward, or recurring task processing

### Claude's Discretion
- Exact capabilities map format within tools.md
- How training data version comparison works (heuristic is fine)
- CLI help parsing strategy for unknown tools
- Refresh-tools workflow internals
- How auth test queries are selected per tool type
- Smart merge implementation details

</decisions>

<specifics>
## Specific Ideas

- set-role already notes tools with `"Run /donna:add-tool to configure"` — add-tool should detect these notes and offer a smooth handoff
- Task format in daily file: `- [ ] Review PR #42 [gh](https://github.com/org/repo/pull/42)` — tag + link in one
- Resolved section example: `- [x] Review PR #42 [gh](https://...) (merged)` — auto-checked with reason
- Follow existing checkmark output pattern from other skills

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/begin-the-day.md`: deduplication logic, daily file write pattern, git commit flow — tool integration step hooks in after recurring tasks
- `workflows/set-role.md`: approve-tools step already notes tools for future configuration — add-tool reads these notes
- `workflows/done.md`: fuzzy-matching pattern — needs to handle `[gh]` tags and `(merged)` suffixes when matching
- `src/installer.cjs`: copies stubs + workflows — new files (add-tool, relearn-tools, refresh-tools) auto-distribute
- `src/output.cjs`: banner(), success(), fail(), info() formatting utilities

### Established Patterns
- Stub-workflow split: thin stubs in `stubs/claude-code/donna/` reference shared workflows in `~/.donna/workflows/`
- Config read from `~/.config/donna/config.md` with YAML frontmatter
- Daily file format: `daily/YYYY-MM-DD.md` with YAML frontmatter, task sections
- Conventional commit messages: `donna(skill-name): description`
- AskUserQuestion for interactive flows with multi-select

### Integration Points
- `~/.donna/workflows/` — new workflow files: add-tool.md, relearn-tools.md, refresh-tools.md
- `stubs/claude-code/donna/` — new stub files: add-tool.md, relearn-tools.md, refresh-tools.md
- Storage repo `tools.md` — new standing file created by add-tool
- `begin-the-day.md` — needs new step between recurring tasks and write-daily-file to pull tool data
- `done.md` — needs update to handle `[tool-tag]` and URL suffixes in fuzzy matching
- `installer.cjs` — needs to enumerate new skills in success message

</code_context>

<deferred>
## Deferred Ideas

- **Standing files subfolder (NEXT PRIORITY)**: Move all standing files (role.md, recurring.md, tools.md, etc.) into a dedicated subfolder (`.donna/` or `Donna/`) within the storage repo, so the user retains ownership of the repo root for their own notes and structure. This is a structural change that should happen before or alongside Phase 4 execution.
- **Automatic tool refresh on schedule**: Run refresh-tools automatically (e.g. as part of begin-the-day or on a cron/hook). Currently out of scope due to pull-model constraint — no daemon or scheduler.
- **Auto-relearn tools during begin-the-day**: Check tool versions during morning ritual and re-learn if version changed since last learn. Nice quality-of-life enhancement for a future iteration.

</deferred>

---

*Phase: 04-external-tool-enrichment*
*Context gathered: 2026-03-15*
