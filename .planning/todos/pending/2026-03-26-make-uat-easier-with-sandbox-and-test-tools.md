---
created: 2026-03-26T22:30:00.000Z
title: Make UAT easier with sandbox environment and test tools (ref: #19)
area: testing
github_issue: 19
files: []
---

## Problem

UAT is difficult for a single person to do comprehensively. Two key issues: (1) risk of breaking your actual Donna setup during testing, and (2) lacking relevant tools of each type (CLI, REST API, GraphQL API, MCP server) to test against.

## Solution

Provide a sandboxed Donna environment for UAT that does not affect the real setup. Additionally, provide test tools (a CLI, REST API, GraphQL API, and MCP server) that can be spun up for testing. Bonus: make these tools configurable (version changes, field renames) to enable testing relearn-tools.
