---
name: donna:contribute-idea
description: Submit a feature idea or bug report — checks for duplicates, then creates a GitHub Issue
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna contribute-idea workflow. This command helps users submit feature ideas or bug reports by checking for duplicates against existing GitHub Issues and the project's pending todos, then creating a new issue if the idea is novel.
</objective>

<execution_context>
@~/.donna/workflows/contribute-idea.md
</execution_context>
