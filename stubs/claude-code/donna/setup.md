---
name: donna:setup
description: Set up Donna assistant for this machine
allowed-tools:
  - Read
  - Bash
---

<objective>
Run the Donna setup workflow. This command verifies that Donna is installed correctly by loading the setup workflow from the shared runtime directory and displaying the current installation status.
</objective>

<execution_context>
@~/.donna/workflows/setup.md
</execution_context>
