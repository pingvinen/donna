---
created: 2026-03-14T21:43:24.497Z
title: Evaluate natural language input as alternative to slash commands
area: general
files: []
---

## Problem

Currently Donna only responds to explicit skill invocations (slash commands like `/donna:add-task`). The question is whether Donna should also react to natural language triggers like "Donna: please remind me to do X" — routing the request to the appropriate skill (e.g. `add-task`).

Key considerations:
- **Discoverability**: Would natural language be easier for users to remember than specific skill names?
- **Ambiguity**: Natural language is inherently ambiguous — how reliably can intent be parsed and routed to the correct skill?
- **Scope creep**: Supporting NL input could set expectations for a conversational interface that's hard to maintain
- **Memorability**: Slash commands are explicit and predictable; NL triggers may be harder to remember the exact phrasing that works
- **Implementation complexity**: Parsing NL reliably adds significant complexity vs. structured skill invocation

## Solution

TBD — needs design discussion. Options to evaluate:
1. Keep slash commands only (explicit, predictable, simple)
2. Add a single NL entry point (e.g. "Donna: ...") that routes to skills
3. Hybrid: slash commands for power users, NL as a convenience layer
