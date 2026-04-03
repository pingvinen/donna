---
created: 2026-03-26T22:30:00.000Z
title: Enhance tool learning to read source code, docs, and API schemas (ref: #20)
area: tooling
github_issue: 20
files: []
---

## Problem

Tool learning may not capture enough capability information from just the CLI help output. Additional learning paths could improve quality.

## Solution

If tool learning is insufficient, add additional discovery paths:
1. For open source tools: find the source repository and read commands from code, READMEs, and docs
2. Find online documentation matching the installed tool version
3. For REST APIs: look for Swagger/OpenAPI specs
4. For GraphQL APIs: send an introspection query (fall back to docs if introspection is disabled)
