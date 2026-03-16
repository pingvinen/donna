---
name: donna:relearn-tools
description: Re-learn capabilities for tools whose installed version has changed
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
Run the Donna relearn-tools workflow. This command checks each registered tool's installed version against its stored version and re-learns capabilities for tools that have been updated.
</objective>

<execution_context>
@~/.donna/workflows/relearn-tools.md
</execution_context>
