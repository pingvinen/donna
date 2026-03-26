---
created: 2026-03-16T00:04:31.085Z
title: Support non-CLI tools — APIs and MCP servers
area: tooling
files: []
---

## Problem

Donna's external tool system currently assumes tools are CLI programs that can be invoked via shell commands. This excludes two important categories of tools:

1. **API-based tools** — Services accessed via HTTP/REST calls (e.g., Jira API, GitHub API, calendar APIs) that don't have a CLI wrapper or where the CLI is less capable than the API.
2. **MCP servers** — Model Context Protocol servers that expose tool capabilities through the MCP protocol, which Claude Code can interact with natively.

Users who rely on APIs or MCP servers for their workflow currently have no way to integrate these as Donna tools.

## Solution

Extend the tool declaration system to support multiple tool types:

- **CLI tools** (current behavior) — invoked via shell commands
- **API tools** — declared with base URL, auth method, and endpoint patterns; Donna generates fetch/curl calls
- **MCP tools** — declared as MCP server references; Donna delegates to Claude Code's MCP integration

The `donna:add-tool` skill and tool config schema would need a `type` field (cli/api/mcp) with type-specific configuration. The `donna:run-tools` and `donna:refresh-tools` skills would need to dispatch based on tool type.
