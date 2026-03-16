---
name: donna:add-tool
description: Declare an external CLI tool and teach Donna its capabilities
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna add-tool workflow. This command declares external CLI tools (like gh, jira, kubectl) and teaches Donna their capabilities so they can be surfaced in the daily brief.
</objective>

<execution_context>
@~/.donna/workflows/add-tool.md
</execution_context>
