---
name: donna:help
description: Conversational troubleshooting — diagnose issues with Donna's config, storage, skills, or tools
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna help workflow. This command provides interactive troubleshooting by inspecting Donna's state and guiding the user through diagnosing and resolving issues.
</objective>

<execution_context>
@~/.donna/workflows/help.md
</execution_context>
