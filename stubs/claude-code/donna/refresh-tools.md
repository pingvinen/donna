---
name: donna:refresh-tools
description: Refresh external tool data in today's daily file
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Run the Donna refresh-tools workflow. This command pulls fresh data from all configured external tools and smart-merges it into today's daily file, without running the full begin-the-day carry-forward and recurring task logic.
</objective>

<execution_context>
@~/.donna/workflows/refresh-tools.md
</execution_context>
