---
name: donna:setup
description: Set up Donna — configure storage repo, initialize file structure, create bootstrap config
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
Run the Donna setup workflow. This command guides the user through configuring Donna: setting the storage repo path, initializing the file structure, and writing the bootstrap config at ~/.config/donna/config.md.
</objective>

<execution_context>
@~/.donna/workflows/setup.md
</execution_context>
