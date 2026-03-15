---
name: donna:run-tools
description: Run external tools and pull fresh data into today's daily file
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Run the Donna run-tools workflow. This command executes all configured external tool commands, pulls fresh data, and smart-merges results into today's daily file, without running the full begin-the-day carry-forward and recurring task logic.
</objective>

<execution_context>
@~/.donna/workflows/run-tools.md
</execution_context>
