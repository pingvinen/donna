# Phase 2: Tool System Enhancements - Context

**Gathered:** 2026-03-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Expand the existing tool system in three directions: (1) parallelize tool capability commands for faster data pulls, (2) add a `/donna:adjust-tool` skill for iterative tool configuration refinement, and (3) support non-CLI tools — REST APIs, GraphQL APIs, and MCP servers. Does not add new daily workflow skills or change the daily file format beyond what tool support requires.

</domain>

<decisions>
## Implementation Decisions

### Parallelization strategy
- Spawn one background agent per tool (not per capability) during begin-the-day and run-tools
- Each agent runs all capabilities for its tool sequentially; tools run in parallel
- Collect all results after all agents finish, then do a single smart-merge pass into the daily file (atomic write)
- Independent failure: if one tool agent fails/times out, others complete normally; failed tool adds a warning (existing pattern)
- No retry on failure — consistent with current behavior
- Global timeout of 2 minutes for the entire parallel batch; collect whatever completed and warn about the rest
- Per-command timeout remains at 10 seconds within each agent

### Non-CLI tool types
- Support three new tool types: REST APIs, GraphQL APIs, and MCP servers
- When adding a tool, ask the user to choose the type: CLI, REST API, GraphQL API, or MCP server
- **API auth:** Gitignored secrets file at `<storage_repo>/donna/secrets.md`, auto-added to `.gitignore` by Donna
  - Capabilities reference `{{SECRET_NAME}}` placeholders; Donna substitutes at runtime from secrets.md
  - Donna never prompts for actual secret values — user edits secrets.md directly
  - Secrets file stored inside the `donna/` subfolder (consistent with other standing files)
- **MCP servers:** Claude calls MCP tools directly (native invocation, not shell wrapper)
  - MCP server configuration lives in Claude Code's settings, not duplicated in tools.md
  - tools.md stores only which MCP tool names to call as capabilities
- **API capability format:** Claude's discretion — determine best format (curl templates, structured definitions, etc.) during research/planning

### Adjust-tool skill design
- New skill: `/donna:adjust-tool`
- All fields are adjustable: scope/filtering, capabilities, auth/secrets, tool command itself
- Menu-driven flow: show current config, ask "What do you want to change?", edit selected field, re-verify if needed, save
- If no tool name argument provided, list all registered tools from tools.md as options
- When scope changes, ask user: "Scope changed. Re-learn capabilities with new scope?" before re-learning
- Follows existing stub + workflow split pattern

### tools.md schema evolution
- Add `type: cli|rest|graphql|mcp` field to each tool section
- Run migration on upgrade to backfill `type: cli` on existing tool sections (via migrator.cjs)
- MCP tools store MCP tool names as capabilities (minimal — server config lives in Claude Code settings)
- API tool fields: Claude's discretion to determine the right field set (base_url, auth_header, response_format, etc.)
- Backwards compatible: all reading code should handle missing `type` field gracefully as `cli`

### Claude's Discretion
- API capability definition format (curl templates vs structured fields)
- API-specific fields in tools.md (base_url, auth_header, response_format — decide during research)
- How secrets.md is structured (YAML frontmatter, key-value pairs, etc.)
- How to validate API connectivity (equivalent of auth-test for CLI tools)
- Implementation of the 2-minute global timeout mechanism
- How MCP tool capabilities map to the daily file task format

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Tool system (existing implementation)
- `workflows/add-tool.md` — Current CLI tool registration flow, learn-capabilities logic, tools.md write format
- `workflows/run-tools.md` — Current tool execution and smart-merge logic for daily files
- `workflows/relearn-tools.md` — Version-aware re-learning flow
- `workflows/begin-the-day.md` — Pull-tool-data step (lines 130-167), how tool tasks integrate with daily files

### Skill patterns
- `workflows/setup.md` — Reference for skill structure and AskUserQuestion patterns
- `stubs/claude-code/donna/` — Stub format for all existing skills

### Project conventions
- `CLAUDE.md` — Git/CI rules, no git from subagents, stub-workflow split, Obsidian compatibility
- `.planning/PROJECT.md` — Key decisions including "Each tool gets its own agent" and "User-declared tools, not hardcoded integrations"

### Migration system
- `src/migrator.cjs` — Existing migration framework for adding `type: cli` backfill
- `src/installer.cjs` — Where new skills get registered for installation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `workflows/add-tool.md` — learn-capabilities step has well-known tool baselines (gh, jira, kubectl) that need extending for new tool types
- `workflows/run-tools.md` — smart-merge logic is tool-agnostic and can handle new tool type outputs
- `src/migrator.cjs` — Cumulative migration system ready for new migrations
- `src/installer.cjs` — Handles skill registration, file copy lists

### Established Patterns
- Stub + workflow split: every skill has a stub in `stubs/claude-code/donna/` and a workflow in `workflows/`
- tools.md format: `## <tool_name>` sections with metadata fields and `### Capabilities` subsections
- Git commit from main context only (SSH signing constraint)
- AskUserQuestion for all interactive flows
- Standing files live in `donna/` subfolder of storage repo

### Integration Points
- `workflows/begin-the-day.md` pull-tool-data step needs parallelization refactor
- `workflows/run-tools.md` needs same parallelization treatment
- `src/installer.cjs` needs new skill entries for adjust-tool
- `src/migrator.cjs` needs new migration for `type: cli` backfill
- `.gitignore` management in storage repo for secrets.md

</code_context>

<specifics>
## Specific Ideas

- Secrets file should never be prompted for values — user edits it directly to avoid secrets appearing in conversation context
- MCP integration should feel zero-config from Donna's perspective: if Claude Code has the MCP server configured, Donna just needs the tool names
- Agent-per-tool parallelization aligns with existing PROJECT.md decision: "Each tool gets its own agent — isolates tool logic and scales naturally"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-tool-system-enhancements*
*Context gathered: 2026-03-16*
