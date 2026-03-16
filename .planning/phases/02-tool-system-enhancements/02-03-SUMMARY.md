---
phase: 02-tool-system-enhancements
plan: "03"
subsystem: tool-workflows
tags: [tool-types, rest-api, graphql, mcp, secrets, add-tool, relearn-tools]
dependency_graph:
  requires: ["02-01"]
  provides: [multi-type-tool-registration, api-connectivity-validation, secrets-infrastructure, non-cli-relearn-handling]
  affects: [workflows/add-tool.md, workflows/relearn-tools.md]
tech_stack:
  added: []
  patterns: [secrets-file-gitignore, curl-api-validation, type-conditional-workflow-branching]
key_files:
  modified:
    - workflows/add-tool.md
    - workflows/relearn-tools.md
decisions:
  - "REST/GraphQL tools use base_url+auth_header+auth_secret fields; MCP tools store only mcp: prefixed capability names — no server config in tools.md"
  - "Donna never prompts for actual secret values — user edits donna/secrets.md directly; workflow only asks for KEY NAME"
  - "API connectivity validation uses curl only when real secret exists; placeholder REPLACE_WITH_YOUR_SECRET skips validation with clear message"
  - "relearn-tools skips version checking for non-CLI types entirely — adds them directly to unchanged_tools as not applicable"
metrics:
  duration_minutes: 15
  completed_date: "2026-03-16"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 2
---

# Phase 2 Plan 3: Non-CLI Tool Type Support Summary

**One-liner:** Extended add-tool workflow to support REST API, GraphQL API, and MCP server tool types with type-specific registration flows, secrets.md infrastructure, curl API connectivity validation, and graceful relearn-tools handling for non-CLI types.

## What Was Built

### Task 1: Extended add-tool workflow for REST/GraphQL/MCP types and secrets.md

Updated `workflows/add-tool.md` with:

- New `ask-tool-type` step (after `ask-tool-name`) presenting a numbered menu for CLI/REST/GraphQL/MCP selection
- Type-branching in the command collection step: CLI prompts for command, REST/GraphQL prompts for base URL, MCP skips entirely
- `verify-installation` step now skips for non-CLI types
- `auth-test` step branches by type: CLI keeps existing well-known tool tests; REST/GraphQL asks for auth header name and secret KEY NAME (never the value), creates `donna/secrets.md` with placeholder `REPLACE_WITH_YOUR_SECRET`, ensures `donna/secrets.md` is in `.gitignore`, then validates connectivity with `curl` only when a real secret is present; MCP prints a message about Claude Code settings
- Type-specific `ask-scope` prompts (all three non-CLI types get API/resource-relevant wording)
- Type-specific `learn-capabilities` branches: CLI keeps existing logic; REST asks for `METHOD /path` entries; GraphQL asks for single-line query entries; MCP asks for `mcp:<server>/<tool>` entries
- Type-specific `write-tools-md` output formats: REST/GraphQL include `base_url`, `auth_header`, `auth_secret`; MCP includes only `type` and `learned`; CLI keeps existing format
- Type-specific `confirm` messages: REST/GraphQL show secrets reminder; MCP shows Claude Code settings reminder

### Task 2: Updated relearn-tools for non-CLI type awareness

Updated `workflows/relearn-tools.md` with:

- `check-versions` step now branches at the top: REST/GraphQL/MCP tools are added directly to `<unchanged_tools>` (version checking not applicable); CLI tools (or absent type, treated as `cli`) use existing version comparison logic
- `report-unchanged` step distinguishes non-CLI tools with message `<type> tool — re-learning not applicable (capabilities are user-defined)` vs CLI tools which show existing `unchanged at <version>` message
- `relearn-changed` step has a leading note clarifying CLI-only re-learning support

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist
- `workflows/add-tool.md` — present, contains `ask-tool-type` step, `type: rest`, `type: graphql`, `type: mcp`, `secrets.md`, `donna/secrets.md`, `curl -s -o /dev/null`, `mcp:`, `REPLACE_WITH_YOUR_SECRET`, `base_url`, `auth_header`, `auth_secret`
- `workflows/relearn-tools.md` — present, contains `treat as "cli"`, `not applicable`, `user-defined` messaging for non-CLI types

### No secret value prompts
Verified: no AskUserQuestion in add-tool.md asks for actual token/key/password values. The workflow only asks for KEY NAMES (e.g., GITHUB_TOKEN) and instructs users to edit secrets.md directly.

## Self-Check: PASSED
